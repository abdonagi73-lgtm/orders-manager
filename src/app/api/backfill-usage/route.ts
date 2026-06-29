import { NextRequest, NextResponse } from 'next/server';
import { getAllItems } from '@/lib/sheets';
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

  const items = await getAllItems();

  // Count usage from all items
  const counts: Record<string, Record<string,number>> = {
    vendors:{}, categories:{}, colors:{}, sizes:{}
  };

  items.forEach(item => {
    if(item.vendor) counts.vendors[item.vendor] = (counts.vendors[item.vendor]||0) + 1;
    if(item.category) counts.categories[item.category] = (counts.categories[item.category]||0) + 1;
    [...new Set(item.colors||[])].filter(Boolean).forEach(c => {
      counts.colors[c] = (counts.colors[c]||0) + 1;
    });
    [...new Set((item.sizes||[]).map(String))].filter(Boolean).forEach(s => {
      counts.sizes[s] = (counts.sizes[s]||0) + 1;
    });
  });

  // Build rows to write all at once
  const rows: string[][] = [];
  Object.entries(counts).forEach(([type, map]) => {
    Object.entries(map).forEach(([name, count]) => {
      rows.push([type, name, String(count)]);
    });
  });

  if(rows.length > 0) {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });

    // Clear existing Usage tab first
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'Usage!A:C',
    });

    // Write all rows in one call
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Usage!A:C',
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });
  }

  return NextResponse.json({
    ok: true,
    items_processed: items.length,
    rows_written: rows.length,
    vendors: Object.keys(counts.vendors).length,
    categories: Object.keys(counts.categories).length,
    colors: Object.keys(counts.colors).length,
    sizes: Object.keys(counts.sizes).length,
  });
}
