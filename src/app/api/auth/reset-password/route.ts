import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Load user + stored reset code from DB (works across serverless instances)
    const found = await db
      .select({
        id:                 users.id,
        reset_code:         users.reset_code,
        reset_code_expires: users.reset_code_expires,
      })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`)
      .limit(1);

    if (!found.length || !found[0].reset_code) {
      return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400 });
    }

    const user = found[0];

    // Check expiry
    if (!user.reset_code_expires || Date.now() > new Date(user.reset_code_expires).getTime()) {
      // Clear the expired code
      await db.update(users).set({ reset_code: null, reset_code_expires: null }).where(eq(users.id, user.id));
      return NextResponse.json({ error: 'Reset code expired. Please request a new one.' }, { status: 400 });
    }

    // Check code match
    if (user.reset_code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect reset code.' }, { status: 400 });
    }

    // Hash new password and clear the reset code atomically
    const hashed = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        pin_hash:           hashed,
        reset_code:         null,   // clear after use
        reset_code_expires: null,
        updated_at:         new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    console.log(`[reset-password] Password updated for: ${email}`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[reset-password]', error);
    return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
  }
}
