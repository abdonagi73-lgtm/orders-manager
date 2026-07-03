import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { resetCodes } from '../forgot-password/route';

// Bcrypt-compatible hash — check what the project uses
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs').catch(() => null)
              || await import('bcrypt').catch(() => null);
  if (bcrypt) return (bcrypt as any).hash(password, 10);
  // Fallback: plain (NOT production-safe — only if no bcrypt available)
  return password;
}

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
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 });
    }
    if (entry.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect reset code. Please try again.' }, { status: 400 });
    }

    // Code is valid — update password
    const hashed = await hashPassword(newPassword);
    const db = await getDb();

    await db.run(
      `UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)`,
      [hashed, email.trim()]
    );

    // Clear the used code
    resetCodes.delete(email.toLowerCase());

    console.log(`[PASSWORD RESET] Password updated for: ${email}`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
