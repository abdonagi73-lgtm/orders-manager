import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems, notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Order } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
    }

    const workerId = req.nextUrl.searchParams.get('workerId');

    let dbOrders = [];
    if (workerId) {
      dbOrders = await db
        .select()
        .from(orders)
        .where(and(eq(orders.company_id, companyId), eq(orders.workerId, workerId)))
        .orderBy(desc(orders.createdAt));
    } else {
      dbOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.company_id, companyId))
        .orderBy(desc(orders.createdAt));
    }

    return NextResponse.json({ orders: dbOrders });
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

    const body = await req.json();

    if (body.action === 'create') {
      const orderId = crypto.randomUUID();
      const newOrder = {
        id: orderId,
        company_id: companyId,
        name: body.name.trim(),
        startDate: body.startDate,
        workerId: body.workerId,
        workerName: body.workerName,
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
        id: 'n_' + Date.now(),
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

    if (body.action === 'update') {
      const order = body.order;
      if (!order || !order.id) {
        return NextResponse.json({ error: 'Invalid order structure' }, { status: 400 });
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
          // Worker reassignment by manager
          workerId:   order.workerId   ?? undefined,
          workerName: order.workerName ?? undefined,
        })
        .where(and(eq(orders.id, order.id), eq(orders.company_id, companyId)));

      if (order.status === 'submitted') {
        await db.insert(notifications).values({
          id: 'n_' + Date.now(),
          company_id: companyId,
          type: 'order_submitted',
          for_who: 'owner',
          worker_id: order.workerId,
          worker_name: order.workerName,
          order_id: order.id,
          order_name: order.name,
          item_id: '',
          item_code: '',
          message: `${order.workerName} submitted "${order.name}" — ready for review`,
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (body.action === 'close') {
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
