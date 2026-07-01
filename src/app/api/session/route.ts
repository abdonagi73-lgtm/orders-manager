import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getRegistry, verifyWorker, getWorkers, saveWorkers, getManagers, saveManagers } from '@/lib/sheets';
import type { Worker } from '@/lib/types';

export async function GET() {
  try {
    const [settings, registry, workers, managers] = await Promise.all([
      getSettings(), getRegistry(), getWorkers(), getManagers()
    ]);
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
      const [settings, managers] = await Promise.all([getSettings(), getManagers()]);
      const isOwner   = body.pin === settings.ownerPin;
      const isManager = managers.some((m: any) => m.pin === body.pin);
      return NextResponse.json({ ok: isOwner || isManager });
    }

    if (body.action === 'save-settings') {
      await saveSettings(body.settings);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'save-workers') {
      await saveWorkers(body.workers as Worker[]);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'change-worker-pin') {
      const { workerId, newPin } = body;
      if (!workerId || !newPin || newPin.length < 4) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
      }
      const workers = await getWorkers();
      if (workers.some(w => w.pin === newPin && w.id !== workerId)) {
        return NextResponse.json({ error: 'PIN already in use' }, { status: 400 });
      }
      const index = workers.findIndex(w => w.id === workerId);
      if (index === -1) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }
      workers[index].pin = newPin;
      await saveWorkers(workers);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'save-managers') {
      await saveManagers(body.managers);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
