// src/app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getRegistry } from '@/lib/sheets';

export async function GET() {
  try {
    const [settings, registry] = await Promise.all([getSettings(), getRegistry()]);
    return NextResponse.json({ settings, registry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // PIN verification
    if (body.action === 'verify-pin') {
      const settings = await getSettings();
      const correct = body.pin === settings.ownerPin;
      return NextResponse.json({ ok: correct });
    }

    // Save settings
    if (body.action === 'save-settings') {
      await saveSettings(body.settings);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
