import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { companies, orders, orderItems, users } from '@/db/schema';
import { eq, ne, count, sql } from 'drizzle-orm';
import { isSuperAdmin } from '@/lib/serverAuth';

// GET /api/admin/platform-stats — super_admin usage overview across all tenants
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // All companies excluding system admin
    const allCompanies = await db
      .select()
      .from(companies)
      .where(ne(companies.id, 'system-admin-tenant'));

    // Order counts per company
    const orderCounts = await db
      .select({
        company_id: orders.company_id,
        total_orders: count(orders.id),
        total_value: sql<number>`COALESCE(SUM(${orders.totalOrderCost}), 0)`,
      })
      .from(orders)
      .groupBy(orders.company_id);

    // Item counts per company
    const itemCounts = await db
      .select({
        company_id: orders.company_id,
        total_items: count(orderItems.id),
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.order_id, orders.id))
      .groupBy(orders.company_id);

    // Worker counts per company
    const workerCounts = await db
      .select({
        company_id: users.company_id,
        total_workers: count(users.id),
      })
      .from(users)
      .groupBy(users.company_id);

    // Merge everything together
    const stats = allCompanies.map((company) => {
      const oc = orderCounts.find((o) => o.company_id === company.id);
      const ic = itemCounts.find((i) => i.company_id === company.id);
      const wc = workerCounts.find((w) => w.company_id === company.id);
      return {
        id: company.id,
        name: company.name,
        status: company.status,
        currency: company.currency,
        logo_url: company.logo_url,
        total_orders: oc?.total_orders ?? 0,
        total_value: oc?.total_value ?? 0,
        total_items: ic?.total_items ?? 0,
        total_workers: wc?.total_workers ?? 0,
      };
    });

    const platform_totals = {
      total_businesses: stats.length,
      active_businesses: stats.filter((s) => s.status === 'active').length,
      total_orders: stats.reduce((a, s) => a + Number(s.total_orders), 0),
      total_items: stats.reduce((a, s) => a + Number(s.total_items), 0),
      total_value: stats.reduce((a, s) => a + Number(s.total_value), 0),
    };

    return NextResponse.json({ businesses: stats, platform_totals });
  } catch (err) {
    console.error('[platform-stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
