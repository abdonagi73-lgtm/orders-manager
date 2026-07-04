import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { resetCodes } from '@/lib/resetCodes';
import { dispatch } from '@/lib/notifications/dispatch';
import { rateLimit, getClientIp } from '@/lib/api/rateLimit';
import { ok, rateLimited, internalError } from '@/lib/api/response';
import { Platform } from '@/config';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 attempts per hour per IP
    const ip = getClientIp(req);
    const limit = rateLimit(`forgot-pw:${ip}`, Platform.auth.maxResetAttemptsPerHour, 60 * 60 * 1000);
    if (!limit.allowed) return rateLimited();

    const { email } = await req.json();
    if (!email) return ok({ message: 'If this email exists, a reset code was sent.' });

    // Look up user by email (always return ok — never reveal if email exists)
    const found = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`)
      .limit(1);

    if (found.length && found[0].email) {
      const user = found[0];

      // Generate 6-digit code valid for 15 minutes
      const code = String(Math.floor(100000 + Math.random() * 900000));
      resetCodes.set(email.toLowerCase(), {
        code,
        expires: Date.now() + Platform.auth.resetCodeTTLMs,
      });

      // Send real email via Resend
      void dispatch(
        {
          event: 'auth.password_reset',
          recipientEmail: user.email ?? undefined,
          recipientName: user.name,
          companyId: '',
          data: { name: user.name, code },
        },
        { channels: ['email'] }
      );
    }

    // Always return the same response to prevent email enumeration
    return ok({ message: 'If this email exists, a reset code was sent.' });
  } catch (error: unknown) {
    console.error('[forgot-password]', error);
    return internalError();
  }
}
