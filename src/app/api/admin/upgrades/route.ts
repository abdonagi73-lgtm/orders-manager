import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { subscriptions, companies, planConfigs } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { logAudit } from '@/lib/audit';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

// GET: List all companies with pending upgrade requests
export async function GET() {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.PLATFORM_ADMIN);
    if (denied) return denied;

    const list = await db
      .select({
        companyId:          companies.id,
        companyName:        companies.name,
        currentPlan:        subscriptions.plan,
        targetPlan:         subscriptions.upgrade_target_plan,
        requestedAt:        subscriptions.upgrade_requested_at,
        ownerName:          companies.owner_name,
        ownerEmail:         companies.email,
      })
      .from(subscriptions)
      .innerJoin(companies, eq(subscriptions.company_id, companies.id))
      .where(isNotNull(subscriptions.upgrade_requested_at));

    return NextResponse.json({ success: true, requests: list });
  } catch (error: any) {
    console.error('[upgrades GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Approve or reject an upgrade request
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.PLATFORM_ADMIN);
    if (denied) return denied;

    const body = await req.json();
    const { companyId, action } = body;

    if (!companyId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'companyId and action (approve/reject) are required' }, { status: 400 });
    }

    // Load subscription record
    const subList = await db.select().from(subscriptions).where(eq(subscriptions.company_id, companyId)).limit(1);
    if (subList.length === 0) {
      return NextResponse.json({ success: false, error: 'Subscription record not found' }, { status: 404 });
    }

    const sub = subList[0];
    if (!sub.upgrade_target_plan) {
      return NextResponse.json({ success: false, error: 'No pending upgrade request for this company' }, { status: 400 });
    }

    const targetPlan = sub.upgrade_target_plan;

    if (action === 'approve') {
      // 1. Load limits from plan config to copy onto company record
      const planList = await db.select().from(planConfigs).where(eq(planConfigs.plan_key, targetPlan)).limit(1);
      const limits = planList[0];

      // 2. Update subscription plan
      await db
        .update(subscriptions)
        .set({
          plan:                   targetPlan,
          status:                 'active',
          upgrade_requested_at:   null,
          upgrade_target_plan:    null,
          updated_at:             new Date().toISOString(),
        })
        .where(eq(subscriptions.company_id, companyId));

      // 3. Update company plan & limits for backwards compatibility
      await db
        .update(companies)
        .set({
          plan:                targetPlan,
          max_workers:         limits?.max_workers ?? 50,
          storage_limit_gb:    limits?.max_storage_gb ?? 10,
          updated_at:          new Date().toISOString(),
        })
        .where(eq(companies.id, companyId));

      // 4. Log audit event
      await logAudit(db, {
        companyId,
        actorId:     session!.id,
        actorName:   session!.name,
        actorRole:   session!.role,
        action:      'subscription.plan_changed',
        entityType:  'subscription',
        entityId:    companyId,
        meta:        { plan: targetPlan, status: 'approved' },
      });
    } else {
      // Reject request: simply clear the upgrade requested fields
      await db
        .update(subscriptions)
        .set({
          upgrade_requested_at:   null,
          upgrade_target_plan:    null,
          updated_at:             new Date().toISOString(),
        })
        .where(eq(subscriptions.company_id, companyId));

      // Log audit event
      await logAudit(db, {
        companyId,
        actorId:     session!.id,
        actorName:   session!.name,
        actorRole:   session!.role,
        action:      'subscription.plan_changed',
        entityType:  'subscription',
        entityId:    companyId,
        meta:        { plan: targetPlan, status: 'rejected' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[upgrades POST]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
