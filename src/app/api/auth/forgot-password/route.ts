import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { dispatch } from '@/lib/notifications/dispatch';
import { rateLimit, getClientIp } from '@/lib/api/rateLimit';
import { ok, rateLimited, internalError } from '@/lib/api/response';
import { Platform } from '@/config';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 attempts per hour per IP (was 3 — generous enough for real users, tight for bots)
    const ip = getClientIp(req);
    const limit = await rateLimit(`forgot-pw:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) return rateLimited();

    const { email } = await req.json();
    if (!email) return ok({ message: 'If this email exists, a reset code was sent.' });

    // Look up user by email
    const found = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`)
      .limit(1);

    if (found.length && found[0].email) {
      const user = found[0];

      // Generate 6-digit code valid for 15 minutes
      const code    = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + Platform.auth.resetCodeTTLMs).toISOString();

      // Store code in DB — survives serverless cold starts / multiple lambda instances
      await db
        .update(users)
        .set({ reset_code: code, reset_code_expires: expires })
        .where(eq(users.id, user.id));

      // Send email — must await on Vercel serverless (lambda killed on response return)
      const emailSent = await dispatch(
        {
          event:          'auth.password_reset',
          recipientEmail: user.email ?? undefined,
          recipientName:  user.name,
          companyId:      '',
          data:           { name: user.name, code },
        },
        { channels: ['email'] }
      );

      if (!emailSent) {
        console.error(`[forgot-password] Resend failed for ${user.email} — RESEND_API_KEY may be missing or domain not verified`);
        // Return a real error so the user knows something went wrong
        // (We still keep the code in DB so they can retry after fixing config)
        return new Response(
          JSON.stringify({ error: 'Failed to send email. Please contact support or try again later.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[forgot-password] Reset code sent to ${user.email}`);
    }

    // Always return the same response — never reveal if email exists
    return ok({ ok: true, message: 'If this email exists, a reset code was sent.' });
  } catch (error: unknown) {
    console.error('[forgot-password]', error);
    return internalError();
  }
}
