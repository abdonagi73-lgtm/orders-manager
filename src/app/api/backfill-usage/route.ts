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
  try {
    const pin = req.nextUrl.searchParams.get('pin');
    if(pin !== process.env.OWNER_PIN) return NextResponse.json({error:'unauthorized'},{status:401});

    const sheets = google.sheets({ version: 'v4', auth: getAuth() });

    // Read Items sheet directly
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Items!A2:N',
    });

    const rows = (res.data.values ?? []).filter(r => r[0]);
    const counts: Record<string, Record<string,number>> = {
      vendors:{}, categories:{}, colors:{}, sizes:{}
    };

    rows.forEach(r => {
      const vendor   = r[2];
      const category = r[4];
      const colorsRaw = r[5];
      const sizesRaw  = r[6];

      if(vendor) counts.vendors[vendor] = (counts.vendors[vendor]||0) + 1;
      if(category) counts.categories[category] = (counts.categories[category]||0) + 1;

      try {
        const colors: string[] = Array.isArray(colorsRaw) ? colorsRaw : JSON.parse(colorsRaw||'[]');
        [...new Set(colors)].filter(Boolean).forEach(c => {
          counts.colors[c] = (counts.colors[c]||0) + 1;
        });
      } catch {}

      try {
        const sizes: string[] = Array.isArray(sizesRaw) ? sizesRaw : JSON.parse(sizesRaw||'[]');
        [...new Set(sizes.map(String))].filter(Boolean).forEach(s => {
          counts.sizes[s] = (counts.sizes[s]||0) + 1;
        });
      } catch {}
    });

    const writeRows: string[][] = [];
    Object.entries(counts).forEach(([type, map]) => {
      Object.entries(map).forEach(([name, count]) => {
        writeRows.push([type, name, String(count)]);
      });
    });

    // Clear and rewrite Usage tab
    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: 'Usage!A:C' });
    if(writeRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: 'Usage!A:C',
        valueInputOption: 'RAW',
        requestBody: { values: writeRows },
      });
    }

    return NextResponse.json({
      ok: true,
      items_processed: rows.length,
      rows_written: writeRows.length,
      vendors: Object.keys(counts.vendors),
      top_categories: Object.entries(counts.categories).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}:${v}`),
    });
  } catch(e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
