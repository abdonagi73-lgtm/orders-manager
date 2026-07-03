import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { vendors } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET: Retrieve list of vendors belonging to the caller's company
export async function GET(request: Request) {
  const companyId = request.headers.get('x-company-id');
  if (!companyId) {
    return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
  }

  try {
    const list = await db
      .select({
        id: vendors.id,
        name: vendors.name,
      })
      .from(vendors)
      .where(eq(vendors.company_id, companyId));

    // Seed default vendors for testing if none exist
    if (list.length === 0) {
      const defaultVendors = [
        { id: `${companyId}-v1`, company_id: companyId, name: 'CLO CLOTHING INC' },
        { id: `${companyId}-v2`, company_id: companyId, name: 'SUPREME TRADERS' },
        { id: `${companyId}-v3`, company_id: companyId, name: 'GLOBAL APPAREL CO' },
      ];
      await db.insert(vendors).values(defaultVendors);
      return NextResponse.json(defaultVendors.map((v) => ({ id: v.id, name: v.name })));
    }

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve vendor index' }, { status: 500 });
  }
}
