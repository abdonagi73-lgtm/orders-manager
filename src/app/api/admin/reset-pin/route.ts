import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { isSuperAdmin } from '@/lib/serverAuth';

// POST /api/admin/reset-pin — super_admin resets any user's PIN
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, newPin } = await req.json();
    if (!userId || !newPin) {
      return NextResponse.json({ error: 'userId and newPin are required' }, { status: 400 });
    }
    if (String(newPin).length !== 4 || isNaN(Number(newPin))) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const pinHash = bcrypt.hashSync(String(newPin), 10);
    const updated = await db
      .update(users)
      .set({ pin_hash: pinHash })
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (err) {
    console.error('[reset-pin]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
