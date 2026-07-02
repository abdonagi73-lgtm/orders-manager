import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

// GET: Retrieve all users belonging to the caller's company (retrieved from header)
// Super_admin can query any company via ?company= query param
export async function GET(request: Request) {
  const role = request.headers.get('x-user-role');
  const headerCompanyId = request.headers.get('x-company-id');
  const url = new URL(request.url);
  const queryCompanyId = url.searchParams.get('company');

  // Super_admin can target any company; others use their own header
  const companyId = role === 'super_admin' && queryCompanyId ? queryCompanyId : headerCompanyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
  }

  try {
    const list = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.company_id, companyId));

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve team catalog' }, { status: 500 });
  }
}

// POST: Add a new worker/admin profile to the caller's company
export async function POST(request: Request) {
  const companyId = request.headers.get('x-company-id');
  if (!companyId) {
    return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
  }

  try {
    const { name, pin, role } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and PIN code are required' }, { status: 400 });
    }

    const userId = `${companyId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const pinHash = bcrypt.hashSync(pin, 10);

    await db.insert(users).values({
      id: userId,
      company_id: companyId, // Hardcoded from x-company-id header for multi-tenant isolation
      name,
      pin_hash: pinHash,
      role: role || 'worker',
    });

    return NextResponse.json({
      id: userId,
      name,
      role: role || 'worker',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add profile' }, { status: 500 });
  }
}

// DELETE: Remove a staff profile from the caller's company
export async function DELETE(request: Request) {
  const companyId = request.headers.get('x-company-id');
  const callerUserId = request.headers.get('x-user-id');
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get('id');

  if (!companyId) {
    return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
  }
  if (!targetId) {
    return NextResponse.json({ error: 'Target profile ID required' }, { status: 400 });
  }

  // Prevent users from deleting themselves
  if (targetId === callerUserId) {
    return NextResponse.json({ error: 'Cannot delete your own active session profile' }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(users)
      .where(and(eq(users.id, targetId), eq(users.company_id, companyId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
