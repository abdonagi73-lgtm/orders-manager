// src/app/api/init/route.ts
// Call this ONCE after deploy: GET /api/init?pin=YOUR_PIN
// Sets up sheet tabs, headers, default settings, and seeds vendor registry.

import { NextRequest, NextResponse } from 'next/server';
import { initSheet } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if (pin !== process.env.OWNER_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await initSheet();
    return NextResponse.json({ ok: true, message: 'Sheet initialized successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
