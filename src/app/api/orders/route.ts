import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems, notifications } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Order } from '@/lib/types';
import { isSubscriptionActive } from '@/lib/subscription/gate';

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
    }

    const workerId = req.nextUrl.searchParams.get('workerId');
    // Pagination: default 50 per page, max 200
    const limit  = Math.min(Number(req.nextUrl.searchParams.get('limit')  ?? 50), 200);
    const offset = Math.max(Number(req.nextUrl.searchParams.get('offset') ?? 0),  0);

    const whereClause = workerId
      ? and(eq(orders.company_id, companyId), eq(orders.workerId, workerId))
      : eq(orders.company_id, companyId);

    const [dbOrders, [{ total }]] = await Promise.all([
      db.select().from(orders).where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(orders).where(whereClause),
    ]);

    return NextResponse.json({ orders: dbOrders, total, limit, offset });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 401 });
    }

    const active = await isSubscriptionActive(db, companyId);
    if (!active) {
      return NextResponse.json({ error: 'Subscription inactive or expired. Please contact support/upgrade.' }, { status: 403 });
    }

    const body = await req.json();

    if (body.action === 'create') {
      const orderId = crypto.randomUUID();
      const newOrder = {
        id: orderId,
        company_id: companyId,
        name: body.name.trim(),
        startDate: body.startDate,
        workerId:   body.workerId   || null,
        workerName: body.workerName ?? '',
        status: 'open' as const,
        shippingCost: 0,
        workerCommission: 0,
        totalOrderCost: 0,
        commissionPaid: false,
        orderType: body.orderType || 'store',
        createdAt: new Date().toISOString(),
        closedAt: '',
        itemCount: 0,
        totalValue: 0,
      };

      await db.insert(orders).values(newOrder);

      // Create notification
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        company_id: companyId,
        type: 'order_started',
        for_who: 'owner',
        worker_id: newOrder.workerId,
        worker_name: newOrder.workerName,
        order_id: newOrder.id,
        order_name: newOrder.name,
        item_id: '',
        item_code: '',
        message: `${newOrder.workerName} started a new order: "${newOrder.name}"`,
        read: false,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ order: newOrder }, { status: 201 });
    }

    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');
    const isManager = ['admin', 'manager', 'owner', 'super_admin'].includes(userRole || '');

    if (body.action === 'update') {
      const order = body.order;
      if (!order || !order.id) {
        return NextResponse.json({ error: 'Invalid order structure' }, { status: 400 });
      }

      // Check existing order state first to verify ownership and status
      const existing = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, order.id), eq(orders.company_id, companyId)))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const currentOrder = existing[0];

      // Enforce RBAC constraints for standard workers
      if (!isManager) {
        if (currentOrder.workerId !== userId) {
          return NextResponse.json({ error: 'Access denied: Cannot edit orders assigned to other workers' }, { status: 403 });
        }
        if (currentOrder.status !== 'open') {
          return NextResponse.json({ error: 'Access denied: Cannot edit a submitted or processed order' }, { status: 403 });
        }
        if (order.status && !['open', 'submitted'].includes(order.status)) {
          return NextResponse.json({ error: 'Access denied: Workers can only change status to submitted' }, { status: 403 });
        }
        if (order.commissionPaid !== undefined && order.commissionPaid !== currentOrder.commissionPaid) {
          return NextResponse.json({ error: 'Access denied: Only managers can approve commission payments' }, { status: 403 });
        }
        if (order.workerId && order.workerId !== currentOrder.workerId) {
          return NextResponse.json({ error: 'Access denied: Workers cannot reassign orders' }, { status: 403 });
        }
      }

      await db
        .update(orders)
        .set({
          name: order.name,
          startDate: order.startDate,
          status: order.status,
          shippingCost: Number(order.shippingCost) || 0,
          workerCommission: Number(order.workerCommission) || 0,
          totalOrderCost: Number(order.totalOrderCost) || 0,
          commissionPaid: Boolean(order.commissionPaid),
          orderType: order.orderType || 'store',
          closedAt: order.closedAt || '',
          itemCount: Number(order.itemCount) || 0,
          totalValue: Number(order.totalValue) || 0,
          // Worker reassignment by manager — null means unassigned
          workerId:   order.workerId   || null,
          workerName: order.workerName ?? '',
        })
        .where(and(eq(orders.id, order.id), eq(orders.company_id, companyId)));

      if (order.status === 'submitted' && currentOrder.status !== 'submitted') {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          company_id: companyId,
          type: 'order_submitted',
          for_who: 'owner',
          worker_id: order.workerId || userId || '',
          worker_name: order.workerName || '',
          order_id: order.id,
          order_name: order.name,
          item_id: '',
          item_code: '',
          message: `${order.workerName || 'Worker'} submitted "${order.name}" — ready for review`,
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (body.action === 'close') {
      if (!isManager) {
        return NextResponse.json({ error: 'Access denied: Only managers can close or import orders' }, { status: 403 });
      }

      const orderId = body.orderId;
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      await db
        .update(orders)
        .set({
          status: 'imported',
          closedAt: new Date().toISOString(),
        })
        .where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)));

      return NextResponse.json({ ok: true });
    }

    if (body.action === 'delete') {
      if (!isManager) {
        return NextResponse.json({ error: 'Access denied: Only managers can delete orders' }, { status: 403 });
      }

      const orderId = body.orderId;
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      // Cascade delete items in Drizzle
      await db.delete(orderItems).where(eq(orderItems.order_id, orderId));
      await db.delete(orders).where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)));

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

