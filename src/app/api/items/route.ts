import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, getItemsByOrder, appendItem, updateItem, deleteItem, addNotification } from '@/lib/sheets';
import type { OrderItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const workerId = req.nextUrl.searchParams.get('workerId');
    let items = orderId ? await getItemsByOrder(orderId) : await getAllItems();
    if(workerId) items = items.filter(i => i.workerId === workerId);
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
      vendor: body.vendor, code: body.code,
      category: body.category,
      colors: body.colors, sizes: body.sizes,
      price: Number(body.price),
      qty: Number(body.qty) || 1,
      notes: body.notes || '',
      ownerNote: '', status: 'pending',
      photo: body.photo || '',
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
    if (item.status === 'flagged' && item.workerId) {
      await addNotification('item_flagged', 'worker',
        item.workerId, '', item.orderId || '', '', item.id, item.code,
        `${item.vendor} · ${item.code} was flagged${item.ownerNote ? ': ' + item.ownerNote : ' — please review'}`);
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
