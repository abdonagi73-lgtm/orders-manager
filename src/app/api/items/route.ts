import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, getItemsByOrder, appendItem, updateItem, deleteItem } from '@/lib/sheets';
import type { OrderItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const items = orderId ? await getItemsByOrder(orderId) : await getAllItems();
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item: OrderItem = {
      id: crypto.randomUUID(),
      orderId: body.orderId,
      workerId: body.workerId || '',
      vendor: body.vendor,
      code: body.code,
      category: body.category,
      colors: body.colors,
      sizes: body.sizes,
      price: Number(body.price),
      qty: Number(body.qty) || 1,
      notes: body.notes || '',
      ownerNote: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await appendItem(item);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const item: OrderItem = await req.json();
    await updateItem(item);
    // If item was flagged, notify the worker
    if (item.status === 'flagged' && item.workerId) {
      await fetch(new URL('/api/notifications', req.url), {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          action: 'create', type: 'item_flagged', for: 'worker',
          workerId: item.workerId,
          orderId: item.orderId, orderName: '',
          itemId: item.id, itemCode: item.code,
          message: `Item ${item.vendor} · ${item.code} was flagged${item.ownerNote ? ': ' + item.ownerNote : ' — please review'}`,
        }),
      }).catch(()=>{});
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteItem(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
