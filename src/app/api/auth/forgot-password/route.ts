import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// In-memory store for reset codes (valid for 15 minutes)
const resetCodes = new Map<string, { code: string; expires: number }>();

export { resetCodes };

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    // Look up user by email (always return ok to avoid enumeration)
    const found = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`)
      .limit(1);

    if (!found.length) {
      // Return ok anyway to prevent email enumeration
      return NextResponse.json({ ok: true });
    }

    // Generate 6-digit code, store for 15 minutes
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(email.toLowerCase(), { code, expires: Date.now() + 15 * 60 * 1000 });

    // Log to console — visible in Vercel logs. Hook up an email provider here when ready.
    console.log(`[PASSWORD RESET] Code for ${email}: ${code} (expires 15 min)`);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
