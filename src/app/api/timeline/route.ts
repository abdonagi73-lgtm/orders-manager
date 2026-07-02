import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { timeline } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
    }

    const orderId = req.nextUrl.searchParams.get('orderId');

    let conditions = [eq(timeline.company_id, companyId)];
    if (orderId) {
      conditions.push(eq(timeline.order_id, orderId));
    }

    const list = await db
      .select()
      .from(timeline)
      .where(and(...conditions))
      .orderBy(desc(timeline.timestamp));

    return NextResponse.json({ events: list });
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

    const newEvent = {
      id: 'tl_' + Date.now(),
      company_id: companyId,
      order_id: body.orderId || '',
      order_name: body.orderName || '',
      action: body.action,
      by: body.by || '',
      timestamp: new Date().toISOString(),
    };

    await db.insert(timeline).values(newEvent);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
