/**
 * PATCH /api/auth/update-credentials
 * Update user name, email (with code verification), or PIN
 */
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { ok, internalError } from '@/lib/api/response';
import { dispatch } from '@/lib/notifications/dispatch';
import bcrypt from 'bcryptjs';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { field } = body;

    if (field === 'name') {
      const { value } = body;
      if (!value?.trim()) {
        return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
      }
      await db.update(users).set({ name: value.trim(), updated_at: new Date().toISOString() })
        .where(eq(users.id, session.id));
      return ok({ success: true });
    }

    if (field === 'email') {
      const { newEmail, currentPin } = body;
      if (!newEmail?.trim() || !currentPin) {
        return new Response(JSON.stringify({ error: 'New email and current PIN are required' }), { status: 400 });
      }

      // Verify current PIN
      const [user] = await db.select({ pin_hash: users.pin_hash, name: users.name })
        .from(users).where(eq(users.id, session.id)).limit(1);

      if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

      const pinValid = await bcrypt.compare(String(currentPin), user.pin_hash);
      if (!pinValid) {
        return new Response(JSON.stringify({ error: 'Incorrect PIN' }), { status: 400 });
      }

      // Check email not already taken
      const [existing] = await db.select({ id: users.id }).from(users)
        .where(and(sql`LOWER(${users.email}) = LOWER(${newEmail.trim()})`, isNull(users.deleted_at)))
        .limit(1);
      if (existing && existing.id !== session.id) {
        return new Response(JSON.stringify({ error: 'This email is already in use' }), { status: 409 });
      }

      // Generate 6-digit code and store in DB (survives serverless cold starts)
      const code    = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Pack "expires_iso|new_email" into reset_code_expires
      await db
        .update(users)
        .set({
          reset_code:         code,
          reset_code_expires: `${expires}|${newEmail.trim()}`,
        })
        .where(eq(users.id, session.id));

      // Send verification code to the NEW email
      await dispatch({
        event: 'auth.password_reset',
        recipientEmail: newEmail.trim(),
        recipientName: user.name,
        companyId: session.companyId ?? '',
        data: { name: user.name, code },
      }, { channels: ['email'] });

      return ok({ success: true, message: 'Verification code sent to new email' });
    }

    if (field === 'pin') {
      const { currentPin, newPin } = body;
      if (!currentPin || !newPin) {
        return new Response(JSON.stringify({ error: 'Current and new PIN are required' }), { status: 400 });
      }
      if (!/^\d{4,6}$/.test(String(newPin))) {
        return new Response(JSON.stringify({ error: 'PIN must be 4-6 digits' }), { status: 400 });
      }

      const [user] = await db.select({ pin_hash: users.pin_hash })
        .from(users).where(eq(users.id, session.id)).limit(1);

      if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

      const pinValid = await bcrypt.compare(String(currentPin), user.pin_hash);
      if (!pinValid) {
        return new Response(JSON.stringify({ error: 'Incorrect current PIN' }), { status: 400 });
      }

      const newHash = await bcrypt.hash(String(newPin), 12);
      await db.update(users).set({ pin_hash: newHash, updated_at: new Date().toISOString() })
        .where(eq(users.id, session.id));

      return ok({ success: true });
    }

    return new Response(JSON.stringify({ error: 'Invalid field' }), { status: 400 });
  } catch (e) {
    console.error('[update-credentials PATCH]', e);
    return internalError();
  }
}
