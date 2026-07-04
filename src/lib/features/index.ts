/**
 * Feature Flag Framework
 * Resolves whether a feature is enabled for a given company.
 * Resolution order: company_override → plan → global_default
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, and } from 'drizzle-orm';
import { Platform } from '@/config';
import type { FeatureKey, FeatureCheckResult } from './types';

// Features enabled for all companies regardless of plan (platform defaults)
const GLOBAL_DEFAULTS: Record<FeatureKey, boolean> = {
  integrations: false,
  integrations_advanced: false,
  api_access: false,
  analytics: false,
  reports: false,
  reports_export: false,
  advanced_analytics: false,
  ai_suggestions: false,
  ai_ocr: false,
  ai_voice: false,
  extended_storage: false,
  export_csv: true,   // available to all plans
  export_pdf: true,   // available to all plans
  sso: false,
  custom_branding: false,
  priority_support: false,
  dedicated_onboarding: false,
  audit_log: false,
  multi_location: false,
};

function getDb() {
  const client = createClient({ url: Platform.db.url, authToken: Platform.db.authToken });
  return drizzle(client);
}

/**
 * Check if a feature is enabled for a company.
 * Reads from the feature_flags table (company override) and falls back to plan features.
 */
export async function isFeatureEnabled(
  companyId: string,
  feature: FeatureKey,
  planFeatures?: FeatureKey[]
): Promise<boolean> {
  const result = await checkFeature(companyId, feature, planFeatures);
  return result.enabled;
}

export async function checkFeature(
  companyId: string,
  feature: FeatureKey,
  planFeatures?: FeatureKey[]
): Promise<FeatureCheckResult> {
  try {
    const db = getDb();

    // Dynamically import to avoid circular deps at module load time
    const { feature_flags } = await import('@/db/schema');

    // 1. Check company-specific override
    const [companyFlag] = await db
      .select()
      .from(feature_flags)
      .where(
        and(
          eq(feature_flags.scope, 'company'),
          eq(feature_flags.company_id, companyId),
          eq(feature_flags.feature_key, feature)
        )
      )
      .limit(1);

    if (companyFlag) {
      return { enabled: companyFlag.enabled === 1, source: 'company_override' };
    }

    // 2. Check plan-based features
    if (planFeatures && planFeatures.includes(feature)) {
      return { enabled: true, source: 'plan' };
    }

    // 3. Fall back to global default
    return { enabled: GLOBAL_DEFAULTS[feature] ?? false, source: 'global_default' };
  } catch {
    // On any DB error, fall back to global defaults (fail open for non-security features)
    return { enabled: GLOBAL_DEFAULTS[feature] ?? false, source: 'global_default' };
  }
}

/**
 * Get all enabled features for a company given their plan features.
 */
export async function getEnabledFeatures(
  companyId: string,
  planFeatures: FeatureKey[] = []
): Promise<FeatureKey[]> {
  const allFeatures = Object.keys(GLOBAL_DEFAULTS) as FeatureKey[];
  const results = await Promise.all(
    allFeatures.map(async (feature) => {
      const enabled = await isFeatureEnabled(companyId, feature, planFeatures);
      return enabled ? feature : null;
    })
  );
  return results.filter(Boolean) as FeatureKey[];
}

export { GLOBAL_DEFAULTS };
export type { FeatureKey, FeatureCheckResult };
