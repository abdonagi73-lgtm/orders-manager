import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { checkWorkerLimit } from '@/lib/subscription/gate';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try {
    return await decryptSession(sessionCookie.value);
  } catch {
    return null;
  }
}

// GET: List all team members for the authenticated owner's company
export async function GET() {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const team = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        is_activated: users.is_activated,
      })
      .from(users)
      .where(eq(users.company_id, session.companyId));

    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  }
}

// POST: Add a new worker or manager to the company
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only owners/admins can add team members
  if (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { name, role, pin, email } = await request.json();

    if (!name || !role || !pin) {
      return NextResponse.json({ error: 'Name, role, and password are required' }, { status: 400 });
    }
    if (pin.toString().length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!['worker', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Role must be worker or manager' }, { status: 400 });
    }

    // Enforce subscription worker limit (workers only, not managers)
    if (role === 'worker') {
      const gate = await checkWorkerLimit(db, session.companyId);
      if (!gate.allowed) {
        return NextResponse.json({
          error: gate.reason ?? 'Worker limit reached for your current plan',
          upgradeRequired: gate.upgradeRequired ?? true,
          currentCount: gate.currentCount,
          limit: gate.limit,
        }, { status: 403 });
      }
    }

    const userId = `${session.companyId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const pinHash = bcrypt.hashSync(pin.toString(), 10);

    await db.insert(users).values({
      id: userId,
      company_id: session.companyId,
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      pin_hash: pinHash,
      role,
      is_activated: true,
    });

    return NextResponse.json({ success: true, userId, name: name.trim(), role });
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A team member with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  }
}

// DELETE: Remove a team member by ID
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    // Safety: can't delete yourself
    if (userId === session.id) {
      return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 });
    }

    await db
      .delete(users)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}
