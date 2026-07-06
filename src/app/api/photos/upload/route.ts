/**
 * POST /api/photos/upload
 * Accepts a base64-encoded JPEG photo, uploads it to Vercel Blob,
 * and returns a permanent CDN URL.
 *
 * Body: { photo: "data:image/jpeg;base64,..." }
 * Returns: { url: "https://..." }
 */
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/serverAuth';
import { db } from '@/db/db';
import { companies, orderItems, orders } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

// Max accepted base64 size (~800KB raw = ~600KB file)
const MAX_B64_BYTES = 800 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { photo } = await req.json();

    if (!photo || typeof photo !== 'string') {
      return NextResponse.json({ error: 'photo field required' }, { status: 400 });
    }

    if (photo.length > MAX_B64_BYTES) {
      return NextResponse.json({ error: 'Photo too large (max 600KB)' }, { status: 413 });
    }

    // Strip the data URL prefix → get raw base64
    const base64 = photo.includes(',') ? photo.split(',')[1] : photo;
    const buffer = Buffer.from(base64, 'base64');

    // ── Enforce Storage Cap ──
    const [companyInfo] = await db
      .select({ maxStorageGb: companies.storage_limit_gb })
      .from(companies)
      .where(eq(companies.id, session.companyId))
      .limit(1);

    const itemsWithPhotos = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(
        eq(orders.company_id, session.companyId),
        isNotNull(orderItems.photo)
      ));

    const limitGb = companyInfo?.maxStorageGb ?? 5; // Default to 5GB
    const limitBytes = limitGb * 1024 * 1024 * 1024;
    const currentBytes = itemsWithPhotos.length * 500 * 1024; // Estimate 500KB per photo

    if (currentBytes + buffer.length > limitBytes) {
      return NextResponse.json({ error: 'Storage cap exceeded. Please upgrade your subscription plan.' }, { status: 413 });
    }
    const mimeMatch = photo.match(/^data:([^;]+);/);
    const mime = mimeMatch?.[1] ?? 'image/jpeg';

    // Convert base64 → Buffer → Blob
    const blob   = new Blob([buffer], { type: mime });

    // Filename: companyId/timestamp.jpg (namespaced per tenant)
    const ext      = mime.split('/')[1] ?? 'jpg';
    const filename = `photos/${session.companyId}/${Date.now()}.${ext}`;

    const result = await put(filename, blob, {
      access:      'public',       // CDN-accessible
      contentType: mime,
    });

    return NextResponse.json({ url: result.url });
  } catch (e: any) {
    console.error('[photos/upload]', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
