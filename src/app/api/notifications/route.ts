import { NextRequest, NextResponse } from 'next/server';
import { addNotification } from '@/lib/sheets';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = 'Notifications';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
async function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export async function GET(req: NextRequest) {
  try {
    const sheets = await getSheets();
    const forWho = req.nextUrl.searchParams.get('for');
    const workerId = req.nextUrl.searchParams.get('workerId');

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A:L`,
    });

    // Filter out header row and empty rows
    // A valid data row starts with 'n_' (our notification ID format)
    let rows = (res.data.values ?? []).filter((r: string[]) =>
      r[0] && r[0].toString().startsWith('n_')
    );

    if (forWho === 'owner') rows = rows.filter((r: string[]) => r[2] === 'owner');
    if (forWho === 'worker' && workerId) rows = rows.filter((r: string[]) =>
      r[2] === 'worker' && r[3] === workerId
    );

    const notifications = rows.map((r: string[]) => ({
      id: r[0], type: r[1], for: r[2],
      workerId: r[3], workerName: r[4],
      orderId: r[5], orderName: r[6],
      itemId: r[7], itemCode: r[8],
      message: r[9], read: r[10] === 'true',
      createdAt: r[11],
    }));

    const unread = notifications.filter((n: any) => !n.read).length;
    return NextResponse.json({ notifications: [...notifications].reverse(), unread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'create') {
      await addNotification(
        body.type, body.for,
        body.workerId || '', body.workerName || '',
        body.orderId || '', body.orderName || '',
        body.itemId || '', body.itemCode || '',
        body.message
      );
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'mark-read') {
      const sheets = await getSheets();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID, range: `${TAB}!A:L`,
      });
      const rows = res.data.values ?? [];
      const updates: any[] = [];
      rows.forEach((row: string[], i: number) => {
        if (!row[0]?.toString().startsWith('n_')) return;
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
