/**
 * Feature Flag Types
 * Every gated feature in the platform is listed here.
 * Add new features here before gating any UI or API with them.
 */

export type FeatureKey =
  // Core integrations
  | 'integrations'
  | 'integrations_advanced'
  | 'api_access'
  // Analytics & Reporting
  | 'analytics'
  | 'reports'
  | 'reports_export'
  | 'advanced_analytics'
  // AI
  | 'ai_suggestions'
  | 'ai_ocr'
  | 'ai_voice'
  // Storage & Media
  | 'extended_storage'
  // Export
  | 'export_csv'
  | 'export_pdf'
  // Platform
  | 'sso'
  | 'custom_branding'
  | 'priority_support'
  | 'dedicated_onboarding'
  | 'audit_log'
  | 'multi_location';

export interface FeatureFlag {
  key: FeatureKey;
  enabled: boolean;
  scope: 'global' | 'company';
  companyId?: string;
  overrideReason?: string;
  setBy?: string;
}

export interface FeatureCheckResult {
  enabled: boolean;
  source: 'company_override' | 'plan' | 'global_default';
}
