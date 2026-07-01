import { NextRequest, NextResponse } from 'next/server';
import { savePhoto, getPhotos } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',') ?? [];
    const photos = await getPhotos(ids);
    return NextResponse.json({ photos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { itemId, photo } = await req.json();
    if (!itemId || !photo) return NextResponse.json({ error: 'itemId and photo required' }, { status: 400 });
    await savePhoto(itemId, photo);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
