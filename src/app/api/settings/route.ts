import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { settings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/serverAuth';

// Known setting keys with their defaults
const DEFAULTS: Record<string, number | string> = {
  tax:      6,
  markup:   3.5,
  shipping: 6.1,
};

// GET — return all settings for caller's company
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.company_id, session.companyId));

    // Build object: key -> parsed value, with defaults for missing keys
    const result: Record<string, number | string> = { ...DEFAULTS };
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }

    return NextResponse.json({ settings: result });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 });
  }
}

// POST — upsert one or more settings for caller's company
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    // Accept either { key, value } or { settings: { key: value, ... } }
    const pairs: { key: string; value: string }[] = [];
    if (body.key !== undefined && body.value !== undefined) {
      pairs.push({ key: body.key, value: JSON.stringify(body.value) });
    } else if (body.settings && typeof body.settings === 'object') {
      for (const [k, v] of Object.entries(body.settings)) {
        pairs.push({ key: k, value: JSON.stringify(v) });
      }
    } else {
      return NextResponse.json({ error: 'Provide {key, value} or {settings: {...}}' }, { status: 400 });
    }

    const now = new Date().toISOString();
    for (const { key, value } of pairs) {
      // Check if exists
      const existing = await db
        .select({ id: settings.id })
        .from(settings)
        .where(and(eq(settings.company_id, session.companyId), eq(settings.key, key)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value, updated_by: session.id, updated_at: now })
          .where(and(eq(settings.company_id, session.companyId), eq(settings.key, key)));
      } else {
        await db.insert(settings).values({
          id: crypto.randomUUID(),
          company_id: session.companyId,
          key,
          value,
          updated_by: session.id,
          updated_at: now,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}
