import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if(pin !== process.env.OWNER_PIN) return NextResponse.json({error:'unauthorized'},{status:401});
  const sheets = google.sheets({ version: 'v4', auth: new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })});
  const [ordersRes, itemsRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID!, range: 'Orders!A1:P6' }),
    sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID!, range: 'Items!A1:N3' }),
  ]);
  return NextResponse.json({
    orderHeaders: ordersRes.data.values?.[0],
    orderRow2: ordersRes.data.values?.[1],
    orderRow3: ordersRes.data.values?.[2],
    itemHeaders: itemsRes.data.values?.[0],
    itemRow2: itemsRes.data.values?.[1],
  });
}
