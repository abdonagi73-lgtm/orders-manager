import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOrdersByWorker, createOrder, updateOrder } from '@/lib/sheets';
import { google } from 'googleapis';
import type { Order } from '@/lib/types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function addNotification(type: string, forWho: string, workerId: string, workerName: string, orderId: string, orderName: string, message: string) {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'Notifications!A:L',
      valueInputOption: 'RAW',
      requestBody: { values: [['n_'+Date.now(), type, forWho, workerId, workerName, orderId, orderName, '', '', message, 'false', new Date().toISOString()]] },
    });
  } catch(e) { console.error('Notification error:', e); }
}

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
        name: body.name, startDate: body.startDate,
        workerId: body.workerId, workerName: body.workerName,
        status: 'open', shippingCost: 0,
        workerCommission: 0, totalOrderCost: 0,
        createdAt: new Date().toISOString(), closedAt: '',
        itemCount: 0, totalValue: 0,
      };
      await createOrder(order);
      await addNotification('order_started', 'owner', order.workerId, order.workerName, order.id, order.name,
        `${order.workerName} started a new order: "${order.name}"`);
      return NextResponse.json({ order }, { status: 201 });
    }

    if (body.action === 'update') {
      await updateOrder(body.order);
      if (body.order?.status === 'submitted') {
        await addNotification('order_submitted', 'owner', body.order.workerId, body.order.workerName, body.order.id, body.order.name,
          `${body.order.workerName} submitted "${body.order.name}" — ready for review`);
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
