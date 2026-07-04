/**
 * POST /api/v1/subscription
 * GET  /api/v1/subscription
 *
 * GET:  Returns current plan, usage, and features for authenticated company.
 * POST: Handles upgrade requests (manual flow — notifies super-admin).
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSubscriptionInfo, checkWorkerLimit } from '@/lib/subscription/gate';
import { dispatch } from '@/lib/notifications/dispatch';
import { logAudit } from '@/lib/audit';
import { ok, unauthorized, internalError, err } from '@/lib/api/response';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { Platform } from '@/config';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET() {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.BILLING_VIEW);
    if (denied) return denied;

    const info = await getSubscriptionInfo(db, session!.companyId);
    return ok(info);
  } catch (error) {
    console.error('[subscription GET]', error);
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.BILLING_VIEW);
    if (denied) return denied;

    const body = await req.json();
    const { action, targetPlan } = body;

    if (action === 'request_upgrade') {
      if (!targetPlan) return err('VALIDATION_ERROR', 'targetPlan is required', 422);

      const validPlans = ['professional', 'business', 'enterprise'];
      if (!validPlans.includes(targetPlan)) {
        return err('VALIDATION_ERROR', `Invalid plan. Must be one of: ${validPlans.join(', ')}`, 422);
      }

      // Mark the upgrade request on the subscription record
      await db
        .update(subscriptions)
        .set({
          upgrade_requested_at: new Date().toISOString(),
          upgrade_target_plan:  targetPlan,
          updated_at:           new Date().toISOString(),
        })
        .where(eq(subscriptions.company_id, session!.companyId));

      // Notify super-admin via email
      void dispatch(
        {
          event:          'subscription.upgrade_requested',
          recipientEmail: Platform.supportEmail,
          recipientName:  'Flowxiq Support',
          companyId:      session!.companyId,
          data: {
            companyName: session!.companyName,
            targetPlan,
            ownerName:   session!.name,
            ownerEmail:  '', // email not in session — super-admin can look up
          },
        },
        { channels: ['email'] }
      );

      // Log audit event
      void logAudit(db, {
        companyId:   session!.companyId,
        actorId:     session!.id,
        actorName:   session!.name,
        actorRole:   session!.role,
        action:      'subscription.upgrade_requested',
        entityType:  'subscription',
        entityId:    session!.companyId,
        meta:        { targetPlan },
      });

      return ok({ message: `Upgrade request to ${targetPlan} submitted. Our team will reach out within 1 business day.` });
    }

    return err('VALIDATION_ERROR', `Unknown action: ${action}`, 422);
  } catch (error) {
    console.error('[subscription POST]', error);
    return internalError();
  }
}
