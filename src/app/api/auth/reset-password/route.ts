import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { resetCodes } from '../forgot-password/route';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const entry = resetCodes.get(email.toLowerCase());
    if (!entry) {
      return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400 });
    }
    if (Date.now() > entry.expires) {
      resetCodes.delete(email.toLowerCase());
      return NextResponse.json({ error: 'Reset code expired. Please request a new one.' }, { status: 400 });
    }
    if (entry.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect reset code.' }, { status: 400 });
    }

    // Hash and update — pin_hash stores all credentials (both PINs and passwords)
    const hashed = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ pin_hash: hashed })
      .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`);

    resetCodes.delete(email.toLowerCase());
    console.log(`[PASSWORD RESET] Password updated for: ${email}`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
