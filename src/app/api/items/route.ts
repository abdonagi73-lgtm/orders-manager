import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems, notifications, companies } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { OrderItem } from '@/lib/types';
import { isSubscriptionActive } from '@/lib/subscription/gate';

async function refreshOrderStats(orderId: string, companyId: string) {
  // Load items (only non-deleted) and company commission rate in parallel
  const [itemsList, companyList] = await Promise.all([
    db
      .select({ item: orderItems })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(
        eq(orders.id, orderId),
        eq(orders.company_id, companyId),
        isNull(orderItems.deleted_at),   // exclude soft-deleted items
      )),
    db
      .select({ commission_rate: companies.commission_rate, shippingCost: orders.shippingCost })
      .from(orders)
      .innerJoin(companies, eq(orders.company_id, companies.id))
      .where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)))
      .limit(1),
  ]);

  const itemCount    = itemsList.length;
  const totalValue   = itemsList.reduce((sum, row) => sum + (row.item.price * row.item.qty), 0);
  // Use the company's actual commission rate (falls back to 3% if not configured)
  const rate         = companyList[0]?.commission_rate ?? 0.03;
  const commission   = parseFloat((totalValue * rate).toFixed(2));
  const shippingCost = companyList[0]?.shippingCost ?? 0;
  const totalOrderCost = parseFloat((totalValue + shippingCost + commission).toFixed(2));

  await db
    .update(orders)
    .set({ itemCount, totalValue, workerCommission: commission, totalOrderCost })
    .where(and(eq(orders.id, orderId), eq(orders.company_id, companyId)));
}

function safeJSON(val: any) {
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
    }

    const orderId = req.nextUrl.searchParams.get('orderId');
    const workerId = req.nextUrl.searchParams.get('workerId');

    const list = await db
      .select({
        item: orderItems
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(
        eq(orders.company_id, companyId),
        orderId ? eq(orderItems.order_id, orderId) : undefined,
        workerId ? eq(orderItems.workerId, workerId) : undefined
      ));

    const items = list.map((row) => ({
      id: row.item.id,
      orderId: row.item.order_id,
      workerId: row.item.workerId,
      vendor: row.item.vendor,
      code: row.item.code,
      category: row.item.category,
      colors: safeJSON(row.item.colors),
      sizes: safeJSON(row.item.sizes),
      price: row.item.price,
      qty: row.item.qty,
      notes: row.item.notes,
      ownerNote: row.item.ownerNote,
      status: row.item.status as any,
      createdAt: row.item.createdAt,
      photo: row.item.photo,
    }));

    return NextResponse.json({ items });
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

    // Verify parent order exists and belongs to this company before adding items
    const orderCheck = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, body.orderId), eq(orders.company_id, companyId)))
      .limit(1);

    if (orderCheck.length === 0) {
      return NextResponse.json({ error: 'Parent order not found or access denied.' }, { status: 404 });
    }

    const itemId = crypto.randomUUID();

    const newItem = {
      id: itemId,
      order_id: body.orderId,
      workerId: body.workerId || '',
      vendor: body.vendor,
      code: body.code,
      category: body.category,
      colors: JSON.stringify(body.colors || []),
      sizes: JSON.stringify(body.sizes || []),
      price: Number(body.price),
      qty: Number(body.qty) || 1,
      notes: body.notes || '',
      ownerNote: '',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      photo: body.photo || '',
    };

    await db.insert(orderItems).values(newItem);

    // Refresh stats
    await refreshOrderStats(body.orderId, companyId);

    // Map back colors/sizes for visual UI rendering
    const responseItem = {
      ...newItem,
      orderId: newItem.order_id,
      colors: body.colors || [],
      sizes: body.sizes || [],
    };

    return NextResponse.json({ item: responseItem }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    const userRole = req.headers.get('x-user-role');
    const isManager = ['admin', 'manager', 'owner', 'super_admin'].includes(userRole || '');

    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 401 });
    }

    const active = await isSubscriptionActive(db, companyId);
    if (!active) {
      return NextResponse.json({ error: 'Subscription inactive or expired. Please contact support/upgrade.' }, { status: 403 });
    }

    const item: OrderItem = await req.json();

    // Verify item belongs to current company and retrieve parent order state
    const existingList = await db
      .select({ orderId: orders.id, orderStatus: orders.status })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(eq(orderItems.id, item.id), eq(orders.company_id, companyId)));

    if (existingList.length === 0) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 });
    }

    const parentOrder = existingList[0];

    // Enforce worker modification constraints
    if (!isManager) {
      if (parentOrder.orderStatus !== 'open') {
        return NextResponse.json({ error: 'Cannot modify items in a submitted or processed order.' }, { status: 403 });
      }
      if (item.status && item.status !== 'pending') {
        return NextResponse.json({ error: 'Workers cannot approve or flag items.' }, { status: 403 });
      }
      if (item.ownerNote !== undefined && item.ownerNote !== '') {
        return NextResponse.json({ error: 'Workers cannot set manager notes.' }, { status: 403 });
      }
    }

    await db
      .update(orderItems)
      .set({
        price: Number(item.price),
        qty: Number(item.qty) || 1,
        notes: item.notes || '',
        ownerNote: item.ownerNote || '',
        status: item.status || 'pending',
        colors: JSON.stringify(item.colors || []),
        sizes: JSON.stringify(item.sizes || []),
      })
      .where(eq(orderItems.id, item.id));

    const orderId = parentOrder.orderId;
    await refreshOrderStats(orderId, companyId);

    if (item.status === 'flagged' && item.workerId) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        company_id: companyId,
        type: 'item_flagged',
        for_who: 'worker',
        worker_id: item.workerId,
        worker_name: '',
        order_id: orderId,
        order_name: '',
        item_id: item.id,
        item_code: item.code,
        message: `${item.vendor} · ${item.code} was flagged${item.ownerNote ? ': ' + item.ownerNote : ' — please review'}`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    const userRole = req.headers.get('x-user-role');
    const isManager = ['admin', 'manager', 'owner', 'super_admin'].includes(userRole || '');

    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 401 });
    }

    const active = await isSubscriptionActive(db, companyId);
    if (!active) {
      return NextResponse.json({ error: 'Subscription inactive or expired. Please contact support/upgrade.' }, { status: 403 });
    }

    const { id } = await req.json();

    // Verify item belongs to current company and retrieve parent order state (including photo for cleanup)
    const existingList = await db
      .select({ orderId: orders.id, orderStatus: orders.status, photo: orderItems.photo })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(eq(orderItems.id, id), eq(orders.company_id, companyId)));

    if (existingList.length === 0) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 });
    }

    const parentOrder = existingList[0];

    // Enforce worker deletion constraints
    if (!isManager) {
      if (parentOrder.orderStatus !== 'open') {
        return NextResponse.json({ error: 'Cannot delete items in a submitted or processed order.' }, { status: 403 });
      }
    }

    const orderId = parentOrder.orderId;

    // Delete photo from Vercel Blob storage if it is hosted there
    if (parentOrder.photo && parentOrder.photo.startsWith('https://') && parentOrder.photo.includes('.public.blob.vercel-storage.com')) {
      try {
        const { del } = await import('@vercel/blob');
        await del(parentOrder.photo);
      } catch (err) {
        console.error('[items DELETE] Failed to delete vercel blob photo:', err);
      }
    }

    await db.delete(orderItems).where(eq(orderItems.id, id));
    await refreshOrderStats(orderId, companyId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

