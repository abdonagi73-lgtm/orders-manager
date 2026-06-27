import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getRegistry, verifyWorker, getWorkers, saveWorkers } from '@/lib/sheets';
import type { Worker } from '@/lib/types';

export async function GET() {
  try {
    const [settings, registry, workers] = await Promise.all([
      getSettings(), getRegistry(), getWorkers()
    ]);
    // Load managers from Settings tab row 5
    let managers: any[] = [];
    try {
      const { google: g } = await import('googleapis');
      const sheets = g.sheets({ version: 'v4', auth: new g.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: (process.env.GOOGLE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })});
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: 'Settings!A5:B5',
      });
      const row = (res.data.values ?? [])[0];
      if (row && row[0] === 'managers') managers = JSON.parse(row[1] || '[]');
    } catch(e) { managers = []; }
    return NextResponse.json({ settings, registry, workers, managers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'verify-worker') {
      const worker = await verifyWorker(body.pin);
      return NextResponse.json({ ok: !!worker, worker });
    }
    if (body.action === 'verify-owner') {
      const settings = await getSettings();
      // Check owner PIN or any manager PIN
      let ok = body.pin === settings.ownerPin;
      if(!ok) {
        try {
          const { google: g } = await import('googleapis');
          const sheets = g.sheets({ version: 'v4', auth: new g.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
              private_key: (process.env.GOOGLE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          })});
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID!,
            range: 'Settings!A5:B5',
          });
          const row = (res.data.values ?? [])[0];
          if (row && row[0] === 'managers') {
            const managers = JSON.parse(row[1] || '[]');
            ok = managers.some((m: any) => m.pin === body.pin);
          }
        } catch(e) {}
      }
      return NextResponse.json({ ok });
    }
    if (body.action === 'save-settings') {
      await saveSettings(body.settings);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'save-workers') {
      await saveWorkers(body.workers as Worker[]);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'save-managers') {
      // Store managers as JSON in Settings tab
      const sheets = google.sheets({ version: 'v4', auth: new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: (process.env.GOOGLE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })});
      const managersJson = JSON.stringify(body.managers || []);
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: 'Settings!A5:B5',
        valueInputOption: 'RAW',
        requestBody: { values: [['managers', managersJson]] },
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
