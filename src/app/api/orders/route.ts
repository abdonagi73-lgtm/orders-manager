import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOrdersByWorker, createOrder, updateOrder } from '@/lib/sheets';
import type { Order } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const workerId = req.nextUrl.searchParams.get('workerId');
    const orders = workerId ? await getOrdersByWorker(workerId) : await getAllOrders();
    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'create') {
      const order: Order = {
        id: crypto.randomUUID(),
        name: body.name,
        startDate: body.startDate,
        workerId: body.workerId,
        workerName: body.workerName,
        status: 'open',
        shippingCost: 0,
        workerCommission: 0,
        totalOrderCost: 0,
        createdAt: new Date().toISOString(),
        closedAt: '',
        itemCount: 0,
        totalValue: 0,
      };
      await createOrder(order);
      // Notify owner: order started
      await fetch(new URL('/api/notifications', req.url), {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          action: 'create', type: 'order_started', for: 'owner',
          workerId: order.workerId, workerName: order.workerName,
          orderId: order.id, orderName: order.name,
          message: `${order.workerName} started a new order: "${order.name}"`,
        }),
      }).catch(()=>{});
      return NextResponse.json({ order }, { status: 201 });
    }
    if (body.action === 'update') {
      await updateOrder(body.order);
      // If status changed to submitted, notify owner
      if (body.order?.status === 'submitted') {
        await fetch(new URL('/api/notifications', req.url), {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            action: 'create', type: 'order_submitted', for: 'owner',
            workerId: body.order.workerId, workerName: body.order.workerName,
            orderId: body.order.id, orderName: body.order.name,
            message: `${body.order.workerName} submitted order "${body.order.name}" — ready for review`,
          }),
        }).catch(()=>{});
      }
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'close') {
      const orders = await getAllOrders();
      const order = orders.find(o => o.id === body.orderId);
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      order.status = 'imported';
      order.closedAt = new Date().toISOString();
      await updateOrder(order);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
