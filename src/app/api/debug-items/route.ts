import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
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
  const pin = req.nextUrl.searchParams.get('pin');
  if(pin !== process.env.OWNER_PIN) return NextResponse.json({error:'unauthorized'},{status:401});
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: 'Items!A1:P10',
  });
  return NextResponse.json({ rows: res.data.values });
}
