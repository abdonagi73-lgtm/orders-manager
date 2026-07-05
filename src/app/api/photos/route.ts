import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orderItems, orders } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getSession } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  // Require a valid session
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
    if (ids.length === 0) {
      return NextResponse.json({ photos: {} });
    }

    // Only return photos for items that belong to this company
    const dbItems = await db
      .select({ id: orderItems.id, photo: orderItems.photo })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(
        and(
          inArray(orderItems.id, ids),
          eq(orders.company_id, session.companyId)
        )
      );

    const photos = dbItems.reduce((acc, it) => {
      acc[it.id] = it.photo;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ photos });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load photos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Require a valid session
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { itemId, photo } = await req.json();
    if (!itemId || !photo) {
      return NextResponse.json({ error: 'itemId and photo required' }, { status: 400 });
    }

    // Verify item belongs to the authenticated company before writing
    const existing = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(eq(orderItems.id, itemId), eq(orders.company_id, session.companyId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 403 });
    }

    await db
      .update(orderItems)
      .set({ photo })
      .where(eq(orderItems.id, itemId));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}
