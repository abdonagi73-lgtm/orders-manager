/**
 * POST /api/auth/verify-email-change
 * Verifies the 6-digit code sent to the new email and applies the change
 */
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ok, internalError } from '@/lib/api/response';
import { resetCodes } from '@/lib/resetCodes';

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

    const cacheKey = `email-change:${session.id}`;
    const entry = resetCodes.get(cacheKey) as any;

    if (!entry) {
      return new Response(JSON.stringify({ error: 'No pending email change — please start over' }), { status: 400 });
    }

    if (Date.now() > entry.expires) {
      resetCodes.delete(cacheKey);
      return new Response(JSON.stringify({ error: 'Code expired — please start over' }), { status: 400 });
    }

    if (entry.code !== String(code)) {
      return new Response(JSON.stringify({ error: 'Incorrect code' }), { status: 400 });
    }

    // Apply the email change
    await db.update(users)
      .set({ email: entry.newEmail, updated_at: new Date().toISOString() })
      .where(eq(users.id, session.id));

    resetCodes.delete(cacheKey);

    return ok({ success: true, newEmail: entry.newEmail });
  } catch (e) {
    console.error('[verify-email-change POST]', e);
    return internalError();
  }
}
