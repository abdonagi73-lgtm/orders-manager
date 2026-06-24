// src/app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, appendItem, updateItem, deleteItem } from '@/lib/sheets';
import type { OrderItem } from '@/lib/types';

export async function GET() {
  try {
    const items = await getAllItems();
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item: OrderItem = {
      id:        crypto.randomUUID(),
      vendor:    body.vendor,
      code:      body.code,
      category:  body.category,
      colors:    body.colors,
      sizes:     body.sizes,
      price:     Number(body.price),
      qty:       Number(body.qty) || 1,
      notes:     body.notes || '',
      ownerNote: '',
      status:    'pending',
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
