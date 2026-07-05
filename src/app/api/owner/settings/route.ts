import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { settings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/serverAuth';

// Default settings returned when no DB override exists for a key
const DEFAULTS: Record<string, unknown> = {
  tax:          6,
  markup:       3.5,
  shipping:     6.10,
  theme:        'system',
  orderPrefix:  '',
  requirePhoto: false,
};

/**
 * GET /api/owner/settings
 * Returns merged settings: DB values override defaults.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(eq(settings.company_id, session.companyId));

    // Start with defaults, then apply any DB overrides
    const result: Record<string, unknown> = { ...DEFAULTS };
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/owner/settings
 * Upsert one or more key/value pairs for the authenticated company.
 * Body: { key: string, value: unknown } or { updates: Record<string, unknown> }
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only admins/owners may change settings
  if (!['admin', 'owner', 'manager', 'super_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Accept either a single {key, value} or a {updates: {...}} bulk payload
    const updates: Record<string, unknown> = body.updates
      ? body.updates
      : { [body.key]: body.value };

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
    }

    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(updates)) {
      const serialized = JSON.stringify(value);

      // Check if this key already exists for this company
      const existing = await db
        .select({ id: settings.id })
        .from(settings)
        .where(and(eq(settings.company_id, session.companyId), eq(settings.key, key)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value: serialized, updated_by: session.id, updated_at: now })
          .where(and(eq(settings.company_id, session.companyId), eq(settings.key, key)));
      } else {
        await db.insert(settings).values({
          id: crypto.randomUUID(),
          company_id: session.companyId,
          key,
          value: serialized,
          updated_by: session.id,
          updated_at: now,
        });
      }
    }

    return NextResponse.json({ ok: true, updated: Object.keys(updates) });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
