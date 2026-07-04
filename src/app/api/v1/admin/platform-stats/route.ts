/**
 * GET    /api/v1/admin/platform-stats  — overall platform health metrics (super_admin only)
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { companies, users, orders, subscriptions, integrations, audit_log } from '@/db/schema';
import { isNull, sql, eq, and, gte, desc } from 'drizzle-orm';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { ok, internalError } from '@/lib/api/response';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.PLATFORM_STATS);
    if (denied) return denied;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      [totalCompanies],
      [activeCompanies],
      [totalUsers],
      [totalOrders],
      [recentOrders],
      [totalIntegrations],
      [connectedIntegrations],
      [trialCompanies],
      [paidCompanies],
      recentAuditEvents,
    ] = await Promise.all([
      // Total companies
      db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(isNull(companies.deleted_at)),

      // Active companies
      db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(
        and(eq(companies.status, 'active'), isNull(companies.deleted_at))
      ),

      // Total users
      db.select({ count: sql<number>`COUNT(*)` }).from(users).where(isNull(users.deleted_at)),

      // Total orders
      db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(isNull(orders.deleted_at)),

      // Orders in last 30 days
      db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(
        and(isNull(orders.deleted_at), gte(orders.createdAt, thirtyDaysAgo))
      ),

      // Total integrations
      db.select({ count: sql<number>`COUNT(*)` }).from(integrations),

      // Connected integrations
      db.select({ count: sql<number>`COUNT(*)` }).from(integrations).where(
        eq(integrations.status, 'connected')
      ),

      // Trial companies
      db.select({ count: sql<number>`COUNT(*)` }).from(subscriptions).where(
        eq(subscriptions.plan, 'trial')
      ),

      // Paid companies
      db.select({ count: sql<number>`COUNT(*)` }).from(subscriptions).where(
        and(
          sql`plan != 'trial'`,
          eq(subscriptions.status, 'active')
        )
      ),

      // Recent audit events (last 7 days, up to 20)
      db.select({
        id:          audit_log.id,
        company_id:  audit_log.company_id,
        actor_name:  audit_log.actor_name,
        actor_role:  audit_log.actor_role,
        action:      audit_log.action,
        entity_type: audit_log.entity_type,
        created_at:  audit_log.created_at,
      })
      .from(audit_log)
      .where(gte(audit_log.created_at, sevenDaysAgo))
      .orderBy(desc(audit_log.created_at))
      .limit(20),
    ]);

    return ok({
      companies: {
        total:   Number(totalCompanies?.count ?? 0),
        active:  Number(activeCompanies?.count ?? 0),
        trial:   Number(trialCompanies?.count ?? 0),
        paid:    Number(paidCompanies?.count ?? 0),
      },
      users: {
        total: Number(totalUsers?.count ?? 0),
      },
      orders: {
        total:        Number(totalOrders?.count ?? 0),
        last30Days:   Number(recentOrders?.count ?? 0),
      },
      integrations: {
        total:     Number(totalIntegrations?.count ?? 0),
        connected: Number(connectedIntegrations?.count ?? 0),
      },
      recentActivity: recentAuditEvents,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[platform-stats GET]', error);
    return internalError();
  }
}
