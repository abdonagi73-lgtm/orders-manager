import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Platform } from '@/config/platform';

const SHEET_ID = Platform.google.sheetId;
const TAB = 'Usage';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: Platform.google.serviceAccountEmail,
      private_key: Platform.google.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function GET() {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB}!A:C`,
    });
    const data: any = { vendors:{}, categories:{}, colors:{}, sizes:{} };
    (res.data.values ?? []).filter(r=>r[0]).forEach(r => {
      const [type, name, count] = r;
      if(data[type] !== undefined) data[type][name] = parseInt(count)||1;
    });
    return NextResponse.json(data);
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — rewrite all rows of one type in the Usage sheet
export async function POST(req: NextRequest) {
  try {
    const { type, items } = await req.json();
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB}!A:C`,
    });
    // Keep all rows that are NOT this type
    const keep = (res.data.values ?? []).filter(r=>r[0]&&r[0]!==type);
    const newRows = (items as {name:string,count?:number}[]).map(item => [type, item.name, String(item.count||1)]);
    const allRows = [...keep, ...newRows];

    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${TAB}!A:C` });
    if(allRows.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID, range: `${TAB}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: allRows },
      });
    }
    return NextResponse.json({ ok: true, written: newRows.length });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
