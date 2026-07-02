import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orderItems } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',') ?? [];
    if (ids.length === 0) {
      return NextResponse.json({ photos: {} });
    }

    const dbItems = await db
      .select({
        id: orderItems.id,
        photo: orderItems.photo,
      })
      .from(orderItems)
      .where(inArray(orderItems.id, ids));

    const photos = dbItems.reduce((acc, it) => {
      acc[it.id] = it.photo;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ photos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { itemId, photo } = await req.json();
    if (!itemId || !photo) {
      return NextResponse.json({ error: 'itemId and photo required' }, { status: 400 });
    }

    await db
      .update(orderItems)
      .set({ photo })
      .where(eq(orderItems.id, itemId));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
