/**
 * GET /api/v1/audit-log
 * Returns the company's audit log with pagination and filtering.
 * Requires audit:view permission (managers and above).
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { audit_log } from '@/db/schema';
import { eq, and, desc, like, sql } from 'drizzle-orm';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { ok, unauthorized, internalError } from '@/lib/api/response';
import { parsePagination, paginationMeta } from '@/lib/api/paginate';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.AUDIT_VIEW);
    if (denied) return denied;

    const { page, limit, offset } = parsePagination(req);
    const url = new URL(req.url);

    // Filters
    const actionFilter    = url.searchParams.get('action') || '';
    const entityFilter    = url.searchParams.get('entity') || '';
    const actorFilter     = url.searchParams.get('actor') || '';

    // Super-admin can query any company; others are locked to their own
    const companyId = session!.role === 'super_admin'
      ? (url.searchParams.get('companyId') || session!.companyId)
      : session!.companyId;

    // Build conditions
    const conditions = [eq(audit_log.company_id, companyId)];
    if (actionFilter)    conditions.push(like(audit_log.action,      `%${actionFilter}%`));
    if (entityFilter)    conditions.push(eq(audit_log.entity_type,   entityFilter));
    if (actorFilter)     conditions.push(like(audit_log.actor_name,  `%${actorFilter}%`));

    // Total count
    const [countRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(audit_log)
      .where(and(...conditions));

    const total = Number(countRow?.count ?? 0);

    // Paginated rows
    const rows = await db
      .select()
      .from(audit_log)
      .where(and(...conditions))
      .orderBy(desc(audit_log.created_at))
      .limit(limit)
      .offset(offset);

    return ok(rows, paginationMeta(total, page, limit));
  } catch (error) {
    console.error('[audit-log GET]', error);
    return internalError();
  }
}
