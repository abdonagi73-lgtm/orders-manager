/**
 * POST /api/auth/verify-email-change
 * Verifies the 6-digit code sent to the new email and applies the change.
 * Codes are stored in the DB (not in-memory) to survive serverless cold starts.
 */
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ok, internalError } from '@/lib/api/response';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), { status: 400 });
    }

    // Load the pending email-change code from DB
    const [user] = await db
      .select({
        reset_code:         users.reset_code,
        reset_code_expires: users.reset_code_expires,
        // The new email is stored temporarily in reset_code_expires with a pipe separator
        // Format: "<expires_iso>|<new_email>"
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user?.reset_code) {
      return new Response(JSON.stringify({ error: 'No pending email change — please start over' }), { status: 400 });
    }

    // Parse stored value: "expires_iso|new_email"
    const stored = user.reset_code_expires ?? '';
    const pipeIdx = stored.indexOf('|');
    if (pipeIdx === -1) {
      return new Response(JSON.stringify({ error: 'Invalid state — please start over' }), { status: 400 });
    }
    const expiresIso = stored.substring(0, pipeIdx);
    const newEmail   = stored.substring(pipeIdx + 1);

    if (Date.now() > new Date(expiresIso).getTime()) {
      await db.update(users).set({ reset_code: null, reset_code_expires: null }).where(eq(users.id, session.id));
      return new Response(JSON.stringify({ error: 'Code expired — please start over' }), { status: 400 });
    }

    if (user.reset_code !== String(code)) {
      return new Response(JSON.stringify({ error: 'Incorrect code' }), { status: 400 });
    }

    // Apply the email change and clear the code
    await db.update(users)
      .set({
        email:              newEmail,
        reset_code:         null,
        reset_code_expires: null,
        updated_at:         new Date().toISOString(),
      })
      .where(eq(users.id, session.id));

    return ok({ success: true, newEmail });
  } catch (e) {
    console.error('[verify-email-change POST]', e);
    return internalError();
  }
}
