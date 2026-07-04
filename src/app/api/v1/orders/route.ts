/**
 * GET    /api/v1/orders        — list orders (paginated, filterable)
 * POST   /api/v1/orders        — create a new order
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { orders } from '@/db/schema';
import { eq, and, desc, like, sql, isNull } from 'drizzle-orm';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { logAudit } from '@/lib/audit';
import { ok, created, unauthorized, forbidden, internalError, validationErr } from '@/lib/api/response';
import { parsePagination, paginationMeta, parseSort } from '@/lib/api/paginate';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.ORDERS_VIEW);
    if (denied) return denied;

    const { page, limit, offset } = parsePagination(req);
    const { sortBy, sortDir } = parseSort(req, ['createdAt', 'name', 'status', 'totalValue'], 'createdAt');
    const url = new URL(req.url);

    const statusFilter = url.searchParams.get('status') || '';
    const workerFilter = url.searchParams.get('worker') || '';
    const searchFilter = url.searchParams.get('q') || '';

    const conditions = [
      eq(orders.company_id, session!.companyId),
      isNull(orders.deleted_at),
    ];
    if (statusFilter) conditions.push(eq(orders.status, statusFilter));
    if (workerFilter) conditions.push(eq(orders.workerId, workerFilter));
    if (searchFilter) conditions.push(like(orders.name, `%${searchFilter}%`));

    // Workers only see their own orders
    if (session!.role === 'worker') {
      conditions.push(eq(orders.workerId, session!.id));
    }

    const [countRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(and(...conditions));

    const total = Number(countRow?.count ?? 0);

    const rows = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(sortDir === 'asc' ? orders.createdAt : desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return ok(rows, paginationMeta(total, page, limit));
  } catch (error) {
    console.error('[v1/orders GET]', error);
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.ORDERS_CREATE);
    if (denied) return denied;

    const body = await req.json();
    const { name, startDate, orderType } = body;

    if (!name?.trim())      return validationErr({ name: 'Order name is required' });
    if (!startDate?.trim()) return validationErr({ startDate: 'Start date is required' });

    const id  = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(orders).values({
      id,
      company_id:       session!.companyId,
      name:             name.trim(),
      startDate,
      workerId:         session!.id,
      workerName:       session!.name,
      status:           'open',
      shippingCost:     0,
      workerCommission: 0,
      totalOrderCost:   0,
      commissionPaid:   false,
      orderType:        orderType || 'store',
      createdAt:        now,
      closedAt:         '',
      itemCount:        0,
      totalValue:       0,
    });

    void logAudit(db, {
      companyId:  session!.companyId,
      actorId:    session!.id,
      actorName:  session!.name,
      actorRole:  session!.role,
      action:     'order.created',
      entityType: 'order',
      entityId:   id,
      meta:       { orderName: name.trim() },
    });

    return created({ id, name: name.trim(), status: 'open', createdAt: now });
  } catch (error) {
    console.error('[v1/orders POST]', error);
    return internalError();
  }
}
