import { NextRequest, NextResponse } from 'next/server';
import { getAllItems } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || 'saw').toLowerCase();
  const items = await getAllItems();
  const sample = items[0];
  const matches = items.filter(i =>
    String(i.vendor||'').toLowerCase().includes(q) ||
    String(i.code||'').toLowerCase().includes(q) ||
    String(i.category||'').toLowerCase().includes(q) ||
    (i.colors||[]).some((c:string) => String(c).toLowerCase().includes(q)) ||
    (i.sizes||[]).some((s:string) => String(s).toLowerCase().includes(q))
  );
  return NextResponse.json({
    total: items.length, query: q, matches: matches.length,
    sample_vendor: sample?.vendor,
    sample_colors: sample?.colors,
    sample_colors_type: typeof sample?.colors,
    matched: matches.slice(0,3).map(i=>({vendor:i.vendor,code:i.code,orderId:i.orderId}))
  });
}
