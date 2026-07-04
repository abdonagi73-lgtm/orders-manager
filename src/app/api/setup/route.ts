/**
 * GET  /api/setup  — return company setup state
 * POST /api/setup  — save wizard results, mark setup_complete
 */
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ok, internalError } from '@/lib/api/response';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.companyId) return new Response('Unauthorized', { status: 401 });

    const [company] = await db
      .select({
        setup_complete: companies.setup_complete,
        pos_type:       companies.pos_type,
        form_fields:    companies.form_fields,
        business_type:  companies.business_type,
      })
      .from(companies)
      .where(eq(companies.id, session.companyId))
      .limit(1);

    return ok({
      setup_complete: company?.setup_complete ?? 0,
      pos_type:       company?.pos_type ?? null,
      business_type:  company?.business_type ?? null,
      form_fields:    company?.form_fields ? JSON.parse(company.form_fields) : null,
    });
  } catch (e) {
    console.error('[setup GET]', e);
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { business_type, pos_type, form_fields, complete } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (business_type !== undefined) updates.business_type = business_type;
    if (pos_type !== undefined)       updates.pos_type       = pos_type;
    if (form_fields !== undefined)    updates.form_fields    = JSON.stringify(form_fields);
    if (complete)                     updates.setup_complete = 1;

    await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, session.companyId));

    return ok({ success: true });
  } catch (e) {
    console.error('[setup POST]', e);
    return internalError();
  }
}
