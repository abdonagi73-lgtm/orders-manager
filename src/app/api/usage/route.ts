import { NextRequest, NextResponse } from 'next/server';
import { getUsageData, incrementUsage } from '@/lib/sheets';

export async function GET() {
  try {
    const data = await getUsageData();
    return NextResponse.json(data);
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await incrementUsage(body.items || []);
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
