/**
 * GET    /api/v1/team         — list team members
 * POST   /api/v1/team         — add a team member (checks worker limit)
 * DELETE /api/v1/team?id=xxx  — soft-delete a team member
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { checkWorkerLimit } from '@/lib/subscription/gate';
import { logAudit } from '@/lib/audit';
import { ok, created, notFound, internalError, validationErr, planLimitErr, err } from '@/lib/api/response';
import bcrypt from 'bcryptjs';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET() {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.TEAM_VIEW);
    if (denied) return denied;

    const members = await db
      .select({
        id:           users.id,
        name:         users.name,
        email:        users.email,
        role:         users.role,
        is_activated: users.is_activated,
        created_at:   users.created_at,
      })
      .from(users)
      .where(
        and(
          eq(users.company_id, session!.companyId),
          isNull(users.deleted_at)
        )
      )
      .orderBy(users.role, users.name);

    return ok(members);
  } catch (error) {
    console.error('[v1/team GET]', error);
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.TEAM_ADD);
    if (denied) return denied;

    const body = await req.json();
    const { name, role, pin } = body;

    if (!name?.trim()) return validationErr({ name: 'Name is required' });
    if (!pin?.trim())  return validationErr({ pin: 'PIN is required' });
    if (!role)         return validationErr({ role: 'Role is required' });

    const validRoles = ['worker', 'manager', 'owner'];
    if (!validRoles.includes(role)) {
      return validationErr({ role: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Check worker limit if adding a worker
    if (role === 'worker') {
      const check = await checkWorkerLimit(db, session!.companyId);
      if (!check.allowed) return planLimitErr('additional workers');
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const id  = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      company_id:   session!.companyId,
      name:         name.trim(),
      email:        body.email?.trim() || null,
      pin_hash:     pinHash,
      role,
      is_activated: false,
      created_at:   now,
      updated_at:   now,
    });

    void logAudit(db, {
      companyId:  session!.companyId,
      actorId:    session!.id,
      actorName:  session!.name,
      actorRole:  session!.role,
      action:     'user.added',
      entityType: 'user',
      entityId:   id,
      meta:       { name: name.trim(), role },
    });

    return created({ id, name: name.trim(), role });
  } catch (error) {
    console.error('[v1/team POST]', error);
    return internalError();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.TEAM_REMOVE);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return err('VALIDATION_ERROR', 'id query parameter required', 422);

    // Prevent self-deletion
    if (id === session!.id) return err('VALIDATION_ERROR', 'You cannot remove yourself', 400);

    const existing = await db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.company_id, session!.companyId),
          isNull(users.deleted_at)
        )
      )
      .limit(1);

    if (!existing.length) return notFound('Team member');

    // Soft delete
    await db
      .update(users)
      .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .where(eq(users.id, id));

    void logAudit(db, {
      companyId:  session!.companyId,
      actorId:    session!.id,
      actorName:  session!.name,
      actorRole:  session!.role,
      action:     'user.removed',
      entityType: 'user',
      entityId:   id,
      meta:       { name: existing[0].name, role: existing[0].role },
    });

    return ok({ message: 'Team member removed.' });
  } catch (error) {
    console.error('[v1/team DELETE]', error);
    return internalError();
  }
}
