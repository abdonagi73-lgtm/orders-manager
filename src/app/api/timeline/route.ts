import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = 'Timeline';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB}!A:F`,
    });
    let rows = (res.data.values ?? []).filter(r => r[0]);
    if(orderId) rows = rows.filter(r => r[1] === orderId);
    const events = rows.map(r => ({
      id: r[0], orderId: r[1], orderName: r[2],
      action: r[3], by: r[4], timestamp: r[5],
    })).reverse();
    return NextResponse.json({ events });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: `${TAB}!A:F`,
      valueInputOption: 'RAW',
      requestBody: { values: [[
        'tl_'+Date.now(), body.orderId, body.orderName,
        body.action, body.by, new Date().toISOString()
      ]]},
    });
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
