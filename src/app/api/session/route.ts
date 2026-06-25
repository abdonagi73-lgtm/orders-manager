import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getRegistry, verifyWorker, getWorkers, saveWorkers } from '@/lib/sheets';
import type { Worker } from '@/lib/types';

export async function GET() {
  try {
    const [settings, registry, workers] = await Promise.all([
      getSettings(), getRegistry(), getWorkers()
    ]);
    return NextResponse.json({ settings, registry, workers });
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
      return NextResponse.json({ ok: body.pin === settings.ownerPin });
    }
    if (body.action === 'save-settings') {
      await saveSettings(body.settings);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'save-workers') {
      await saveWorkers(body.workers as Worker[]);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
