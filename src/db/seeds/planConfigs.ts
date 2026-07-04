/**
 * Seed: Plan Configurations
 * Seeds the 4 default plans into plan_configs table.
 * Plans are DB-driven — change capabilities here without code changes.
 */

import { createClient } from '@libsql/client';
import { Platform } from '@/config';

const plans = [
  {
    id: 'plan_trial',
    plan_key: 'trial',
    display_name: 'Free Trial',
    description: '30-day free trial with full access to core features',
    price_monthly: 0,
    price_annual: 0,
    max_workers: 1,       // only role=worker counts
    max_storage_gb: 1,
    features: JSON.stringify([
      'export_csv',
      'export_pdf',
    ]),
    is_public: 1,
    sort_order: 0,
  },
  {
    id: 'plan_professional',
    plan_key: 'professional',
    display_name: 'Professional',
    description: 'For growing retail teams with multiple workers',
    price_monthly: 23.99,
    price_annual: 239.88,   // ~2 months free
    max_workers: 10,
    max_storage_gb: 10,
    features: JSON.stringify([
      'export_csv',
      'export_pdf',
      'analytics',
      'reports',
      'reports_export',
      'integrations',
      'audit_log',
    ]),
    is_public: 1,
    sort_order: 1,
  },
  {
    id: 'plan_business',
    plan_key: 'business',
    display_name: 'Business',
    description: 'Advanced features including API, AI, and advanced integrations',
    price_monthly: 79.99,
    price_annual: 799.88,
    max_workers: 50,
    max_storage_gb: 50,
    features: JSON.stringify([
      'export_csv',
      'export_pdf',
      'analytics',
      'reports',
      'reports_export',
      'integrations',
      'integrations_advanced',
      'api_access',
      'ai_suggestions',
      'advanced_analytics',
      'audit_log',
      'extended_storage',
    ]),
    is_public: 1,
    sort_order: 2,
  },
  {
    id: 'plan_enterprise',
    plan_key: 'enterprise',
    display_name: 'Enterprise',
    description: 'Unlimited usage, SSO, custom integrations, and dedicated support',
    price_monthly: 0,    // custom pricing
    price_annual: 0,     // custom pricing
    max_workers: null,   // unlimited
    max_storage_gb: null,// unlimited
    features: JSON.stringify([
      'export_csv',
      'export_pdf',
      'analytics',
      'reports',
      'reports_export',
      'integrations',
      'integrations_advanced',
      'api_access',
      'ai_suggestions',
      'ai_ocr',
      'ai_voice',
      'advanced_analytics',
      'audit_log',
      'extended_storage',
      'sso',
      'custom_branding',
      'priority_support',
      'dedicated_onboarding',
      'multi_location',
    ]),
    is_public: 1,
    sort_order: 3,
  },
];

export async function seedPlanConfigs(): Promise<void> {
  const client = createClient({ url: Platform.db.url, authToken: Platform.db.authToken });
  const now = new Date().toISOString();

  for (const plan of plans) {
    // Upsert — don't overwrite if already exists
    await client.execute({
      sql: `INSERT OR IGNORE INTO plan_configs 
            (id, plan_key, display_name, description, price_monthly, price_annual, 
             max_workers, max_storage_gb, features, is_public, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        plan.id, plan.plan_key, plan.display_name, plan.description,
        plan.price_monthly, plan.price_annual,
        plan.max_workers ?? null, plan.max_storage_gb ?? null,
        plan.features, plan.is_public, plan.sort_order,
        now, now,
      ],
    });
    console.log(`[seed] plan_configs: ${plan.plan_key} ✓`);
  }

  client.close();
}
