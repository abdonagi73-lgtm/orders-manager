import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, companies, vendors } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try { return await decryptSession(sessionCookie.value); }
  catch { return null; }
}

// GET /api/owner/dashboard — returns company + rich analytics for the owner portal
export async function GET() {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companyId = session.companyId;

  try {
    // ── 1. Fetch raw data ─────────────────────────────────────────────────────
    const [companyRows, orderRows, vendorRows] = await Promise.all([
      db.select().from(companies).where(eq(companies.id, companyId)),
      db.select().from(orders)
        .where(eq(orders.company_id, companyId))
        .orderBy(desc(orders.createdAt)),
      db.select().from(vendors)
        .where(eq(vendors.company_id, companyId))
        .orderBy(desc(vendors.frequency_score))
        .limit(10),
    ]);

    const allOrders = orderRows;

    // ── 2. Aggregate stats ────────────────────────────────────────────────────
    const totalRevenue    = allOrders.reduce((s, o) => s + (o.totalValue || 0), 0);
    const totalOrders     = allOrders.length;
    const openOrders      = allOrders.filter(o => o.status === 'open').length;
    const closedOrders    = allOrders.filter(o => o.status === 'imported').length;
    const submittedOrders = allOrders.filter(o => o.status === 'submitted').length;
    const avgOrderValue   = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // ── 3. Commission totals ──────────────────────────────────────────────────
    const commissionPaid   = allOrders.filter(o => o.commissionPaid).reduce((s, o) => s + (o.workerCommission || 0), 0);
    const commissionUnpaid = allOrders.filter(o => !o.commissionPaid).reduce((s, o) => s + (o.workerCommission || 0), 0);

    // ── 4. Top 5 workers by order count ──────────────────────────────────────
    const workerMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const o of allOrders) {
      if (!o.workerId) continue;
      if (!workerMap[o.workerId]) {
        workerMap[o.workerId] = { name: o.workerName || o.workerId, count: 0, revenue: 0 };
      }
      workerMap[o.workerId].count++;
      workerMap[o.workerId].revenue += o.totalValue || 0;
    }
    const topWorkers = Object.entries(workerMap)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── 5. Top 5 vendors by frequency_score ──────────────────────────────────
    const topVendors = vendorRows.slice(0, 5).map(v => ({
      id: v.id,
      name: v.name,
      frequencyScore: v.frequency_score,
    }));

    // ── 6. Orders by month for last 6 months ─────────────────────────────────
    const now = new Date();
    const months: { label: string; key: string; count: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        count: 0,
        revenue: 0,
      });
    }
    for (const o of allOrders) {
      const created = o.createdAt || o.startDate || '';
      if (!created) continue;
      const d = new Date(created);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find(m => m.key === key);
      if (m) { m.count++; m.revenue += o.totalValue || 0; }
    }

    return NextResponse.json({
      company: companyRows[0] || null,
      orders: orderRows,
      analytics: {
        totalRevenue,
        totalOrders,
        openOrders,
        closedOrders,
        submittedOrders,
        avgOrderValue,
        commissionPaid,
        commissionUnpaid,
        topWorkers,
        topVendors,
        ordersByMonth: months,
      },
    });
  } catch (err) {
    console.error('[dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
