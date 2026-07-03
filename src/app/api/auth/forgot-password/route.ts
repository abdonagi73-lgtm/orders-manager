import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// In-memory store for reset codes (production would use Redis or DB table)
// We use the module-level map so it persists across requests in the same process
const resetCodes = new Map<string, { code: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const db = await getDb();
    const user = await db.get(
      `SELECT u.id, u.email, u.name, c.name as companyName
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    // Always return ok to avoid email enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    resetCodes.set(email.toLowerCase(), { code, expires });

    // Log the code (in production this would send an actual email)
    console.log(`[PASSWORD RESET] Code for ${email}: ${code} (expires in 15 min)`);

    // If Resend/SendGrid/etc is configured, send email here.
    // For now we store in the console. The super-admin can communicate it manually.
    // TODO: integrate email provider

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Export resetCodes so reset-password route can access it
export { resetCodes };
