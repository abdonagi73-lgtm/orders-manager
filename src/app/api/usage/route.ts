import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

function safeJSON(val: any) {
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company identifier missing' }, { status: 400 });
    }

    // Dynamic aggregation from order_items table
    const itemsList = await db
      .select({
        item: orderItems
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(eq(orders.company_id, companyId));

    const vendors: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const colors: Record<string, number> = {};
    const sizes: Record<string, number> = {};

    for (const row of itemsList) {
      const it = row.item;

      // Vendors
      vendors[it.vendor] = (vendors[it.vendor] || 0) + 1;

      // Categories
      categories[it.category] = (categories[it.category] || 0) + 1;

      // Colors array
      const colorArr = safeJSON(it.colors);
      for (const c of colorArr) {
        colors[c] = (colors[c] || 0) + 1;
      }

      // Sizes array
      const sizeArr = safeJSON(it.sizes);
      for (const s of sizeArr) {
        sizes[s] = (sizes[s] || 0) + 1;
      }
    }

    return NextResponse.json({ vendors, categories, colors, sizes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Calculated dynamically from database state, no-op for event logging.
  return NextResponse.json({ ok: true });
}
