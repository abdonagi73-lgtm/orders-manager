import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, getItemsByOrder, appendItem, updateItem, deleteItem } from '@/lib/sheets';
import { google } from 'googleapis';
import type { OrderItem } from '@/lib/types';

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

async function addNotification(type: string, forWho: string, workerId: string, itemId: string, itemCode: string, message: string) {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'Notifications!A:L',
      valueInputOption: 'RAW',
      requestBody: { values: [['n_'+Date.now(), type, forWho, workerId, '', '', '', itemId, itemCode, message, 'false', new Date().toISOString()]] },
    });
  } catch(e) { console.error('Notification error:', e); }
}

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
      vendor: body.vendor, code: body.code,
      category: body.category,
      colors: body.colors, sizes: body.sizes,
      price: Number(body.price),
      qty: Number(body.qty) || 1,
      notes: body.notes || '',
      ownerNote: '', status: 'pending',
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
      await addNotification('item_flagged', 'worker', item.workerId,
        item.id, item.code,
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
