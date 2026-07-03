import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
    }

    const forWho = req.nextUrl.searchParams.get('for');
    const workerId = req.nextUrl.searchParams.get('workerId');

    let conditions = [eq(notifications.company_id, companyId)];
    if (forWho) {
      conditions.push(eq(notifications.for_who, forWho));
    }
    if (workerId) {
      conditions.push(eq(notifications.worker_id, workerId));
    }

    const list = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.created_at));

    const unread = list.filter((n) => !n.read).length;
    return NextResponse.json({ notifications: list, unread });
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
      const newNotif = {
        id: 'n_' + Date.now(),
        company_id: companyId,
        type: body.type,
        for_who: body.for,
        worker_id: body.workerId || '',
        worker_name: body.workerName || '',
        order_id: body.orderId || '',
        order_name: body.orderName || '',
        item_id: body.itemId || '',
        item_code: body.itemCode || '',
        message: body.message,
        read: false,
        created_at: new Date().toISOString(),
      };

      await db.insert(notifications).values(newNotif);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'mark-read') {
      const forWho = body.for;
      const workerId = body.workerId;

      let conditions = [eq(notifications.company_id, companyId), eq(notifications.read, false)];
      if (forWho) {
        conditions.push(eq(notifications.for_who, forWho));
      }
      if (workerId) {
        conditions.push(eq(notifications.worker_id, workerId));
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(and(...conditions));

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
