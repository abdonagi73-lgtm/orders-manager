import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { isSuperAdmin } from '@/lib/serverAuth';

// GET: Fetch owner credentials for a given companyId
export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  try {
    // Get the admin/owner user for this company
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        is_activated: users.is_activated,
      })
      .from(users)
      .where(eq(users.company_id, companyId));

    // Find the primary owner/admin
    const owner = results.find(u => u.role === 'admin' || u.role === 'owner') || results[0];

    if (!owner) {
      return NextResponse.json({ error: 'No owner found' }, { status: 404 });
    }

    return NextResponse.json({
      userId: owner.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      is_activated: owner.is_activated ?? false,
    });
  } catch (error: any) {
    console.error('Credentials fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST: Generate a new activation passcode for an owner (resets their access)
export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Generate new uppercase passcode
    const newPasscode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const hashedPasscode = bcrypt.hashSync(newPasscode, 10);

    // Update user: set new pin_hash and mark as NOT activated (forces them to re-activate)
    await db
      .update(users)
      .set({
        pin_hash: hashedPasscode,
        is_activated: false,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ passcode: newPasscode });
  } catch (error: any) {
    console.error('Credential reset error:', error);
    return NextResponse.json({ error: 'Failed to reset credentials' }, { status: 500 });
  }
}

