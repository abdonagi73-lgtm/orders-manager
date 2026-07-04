/**
 * Subscription Gate
 * Check whether a company's plan allows a given feature or capacity.
 * Never throws — always returns a structured result.
 *
 * Usage:
 *   const check = await checkWorkerLimit(db, companyId);
 *   if (!check.allowed) return planLimitErr('additional workers');
 */

import { eq, and, sql, isNull } from 'drizzle-orm';
import type { FeatureKey } from '@/lib/features/types';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface GateResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number | null;
  upgradeRequired?: boolean;
}

// ─── Plan Limits (sourced from plan_configs at runtime) ──────────────────────

interface PlanConfig {
  plan_key: string;
  max_workers: number | null;
  max_storage_gb: number | null;
  features: string; // JSON array
}

async function getPlanConfig(db: Db, companyId: string): Promise<PlanConfig | null> {
  try {
    const { subscriptions, planConfigs } = await import('@/db/schema');

    const sub = await db
      .select({
        plan: subscriptions.plan,
        status: subscriptions.status,
        trial_ends_at: subscriptions.trial_ends_at,
      })
      .from(subscriptions)
      .where(eq(subscriptions.company_id, companyId))
      .limit(1);

    // Default to trial if no subscription record exists
    const planKey = sub[0]?.plan ?? 'trial';
    const status  = sub[0]?.status ?? 'active';

    // Suspended subscriptions block all gated actions
    if (status === 'suspended' || status === 'cancelled') {
      return null;
    }

    // Check trial expiry
    if (planKey === 'trial' && sub[0]?.trial_ends_at) {
      const expired = new Date(sub[0].trial_ends_at) < new Date();
      if (expired) return null;
    }

    const config = await db
      .select()
      .from(planConfigs)
      .where(eq(planConfigs.plan_key, planKey))
      .limit(1);

    return config[0] ?? null;
  } catch (err) {
    logger.error('getPlanConfig failed', { companyId, error: String(err) });
    return null;
  }
}

// ─── Feature Access ───────────────────────────────────────────────────────────

/**
 * Check if the company's plan includes a specific feature.
 */
export async function checkFeatureAccess(
  db: Db,
  companyId: string,
  feature: FeatureKey
): Promise<GateResult> {
  const config = await getPlanConfig(db, companyId);

  if (!config) {
    return { allowed: false, reason: 'Subscription inactive or expired', upgradeRequired: true };
  }

  const features: FeatureKey[] = JSON.parse(config.features || '[]');
  const allowed = features.includes(feature);

  return {
    allowed,
    reason: allowed ? undefined : `Feature '${feature}' is not available on your current plan`,
    upgradeRequired: !allowed,
  };
}

// ─── Worker Limit ─────────────────────────────────────────────────────────────

/**
 * Check if the company can add another worker (role = 'worker' only).
 */
export async function checkWorkerLimit(db: Db, companyId: string): Promise<GateResult> {
  const config = await getPlanConfig(db, companyId);

  if (!config) {
    return { allowed: false, reason: 'Subscription inactive or expired', upgradeRequired: true };
  }

  if (config.max_workers === null) {
    // Unlimited
    return { allowed: true, limit: null };
  }

  const { users } = await import('@/db/schema');
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(
      and(
        eq(users.company_id, companyId),
        eq(users.role, 'worker'),
        isNull(users.deleted_at)
      )
    );

  const current = Number(row?.count ?? 0);
  const limit   = config.max_workers;
  const allowed = current < limit;

  return {
    allowed,
    currentCount: current,
    limit,
    reason: allowed ? undefined : `Your plan allows up to ${limit} worker(s). You currently have ${current}.`,
    upgradeRequired: !allowed,
  };
}

// ─── Subscription Info ────────────────────────────────────────────────────────

export interface SubscriptionInfo {
  plan: string;
  status: string;
  trialEndsAt?: string;
  features: FeatureKey[];
  limits: {
    maxWorkers: number | null;
    maxStorageGb: number | null;
  };
  usage: {
    workers: number;
  };
}

export async function getSubscriptionInfo(db: Db, companyId: string): Promise<SubscriptionInfo> {
  const { subscriptions, users } = await import('@/db/schema');

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.company_id, companyId))
    .limit(1);

  const planKey = sub[0]?.plan ?? 'trial';
  const status  = sub[0]?.status ?? 'active';

  const config = await getPlanConfig(db, companyId);
  const features: FeatureKey[] = config ? JSON.parse(config.features || '[]') : [];

  const [workerRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(
      and(
        eq(users.company_id, companyId),
        eq(users.role, 'worker'),
        isNull(users.deleted_at)
      )
    );

  return {
    plan: planKey,
    status,
    trialEndsAt: sub[0]?.trial_ends_at ?? undefined,
    features,
    limits: {
      maxWorkers:   config?.max_workers   ?? null,
      maxStorageGb: config?.max_storage_gb ?? null,
    },
    usage: {
      workers: Number(workerRow?.count ?? 0),
    },
  };
}
