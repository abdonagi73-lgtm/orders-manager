import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = 'Notifications';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
async function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

async function ensureTab() {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = meta.data.sheets?.some(s => s.properties?.title === TAB);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A1:L1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['id','type','for','workerId','workerName','orderId','orderName','itemId','itemCode','message','read','createdAt']] },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTab();
    const sheets = await getSheets();
    const forWho = req.nextUrl.searchParams.get('for');
    const workerId = req.nextUrl.searchParams.get('workerId');
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB}!A2:L`,
    });
    let rows = (res.data.values ?? []).filter((r: string[]) => r[0]);
    if (forWho === 'owner') rows = rows.filter((r: string[]) => r[2] === 'owner');
    if (forWho === 'worker' && workerId) rows = rows.filter((r: string[]) => r[2] === 'worker' && r[3] === workerId);
    const notifications = rows.map((r: string[]) => ({
      id: r[0], type: r[1], for: r[2],
      workerId: r[3], workerName: r[4],
      orderId: r[5], orderName: r[6],
      itemId: r[7], itemCode: r[8],
      message: r[9], read: r[10] === 'true',
      createdAt: r[11],
    }));
    const unread = notifications.filter((n: any) => !n.read).length;
    return NextResponse.json({ notifications: notifications.reverse(), unread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTab();
    const body = await req.json();
    const sheets = await getSheets();

    if (body.action === 'create') {
      const row = [
        'n_' + Date.now(),
        body.type, body.for,
        body.workerId || '', body.workerName || '',
        body.orderId || '', body.orderName || '',
        body.itemId || '', body.itemCode || '',
        body.message, 'false',
        new Date().toISOString(),
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: `${TAB}!A:L`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'mark-read') {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID, range: `${TAB}!A:L`,
      });
      const rows = res.data.values ?? [];
      const updates: any[] = [];
      rows.forEach((row: string[], i: number) => {
        if (i === 0) return;
        const matchOwner = body.for === 'owner' && row[2] === 'owner';
        const matchWorker = body.for === 'worker' && row[2] === 'worker' && row[3] === body.workerId;
        if ((matchOwner || matchWorker) && row[10] !== 'true') {
          updates.push({ range: `${TAB}!K${i + 1}`, values: [['true']] });
        }
      });
      if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: updates },
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
