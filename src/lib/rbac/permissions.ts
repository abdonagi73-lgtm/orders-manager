/**
 * RBAC Permission Definitions
 * Every protected action in the platform is defined here as a typed constant.
 * Never compare role strings directly — always use these permissions.
 */

export const Permissions = {
  // ─── Orders ────────────────────────────────────────────────────────────────
  ORDERS_VIEW:        'orders:view',
  ORDERS_CREATE:      'orders:create',
  ORDERS_SUBMIT:      'orders:submit',
  ORDERS_CLOSE:       'orders:close',
  ORDERS_DELETE:      'orders:delete',
  ORDERS_EXPORT:      'orders:export',

  // ─── Items ─────────────────────────────────────────────────────────────────
  ITEMS_ADD:          'items:add',
  ITEMS_EDIT:         'items:edit',
  ITEMS_FLAG:         'items:flag',
  ITEMS_APPROVE:      'items:approve',
  ITEMS_DELETE:       'items:delete',
  ITEMS_PHOTO:        'items:photo',

  // ─── Team ──────────────────────────────────────────────────────────────────
  TEAM_VIEW:          'team:view',
  TEAM_ADD:           'team:add',
  TEAM_REMOVE:        'team:remove',
  TEAM_RESET_PIN:     'team:reset_pin',

  // ─── Vendors ───────────────────────────────────────────────────────────────
  VENDORS_VIEW:       'vendors:view',
  VENDORS_ADD:        'vendors:add',
  VENDORS_EDIT:       'vendors:edit',
  VENDORS_DELETE:     'vendors:delete',

  // ─── Analytics & Reports ───────────────────────────────────────────────────
  ANALYTICS_VIEW:     'analytics:view',
  REPORTS_VIEW:       'reports:view',
  REPORTS_EXPORT:     'reports:export',

  // ─── Settings ──────────────────────────────────────────────────────────────
  SETTINGS_VIEW:      'settings:view',
  SETTINGS_EDIT:      'settings:edit',

  // ─── Integrations ──────────────────────────────────────────────────────────
  INTEGRATIONS_VIEW:   'integrations:view',
  INTEGRATIONS_MANAGE: 'integrations:manage',
  INTEGRATIONS_SYNC:   'integrations:sync',

  // ─── Billing & Subscription ────────────────────────────────────────────────
  BILLING_VIEW:       'billing:view',
  BILLING_MANAGE:     'billing:manage',

  // ─── Audit ─────────────────────────────────────────────────────────────────
  AUDIT_VIEW:         'audit:view',

  // ─── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS_VIEW: 'notifications:view',

  // ─── Platform Admin (super_admin only) ─────────────────────────────────────
  PLATFORM_ADMIN:     'platform:admin',
  PLATFORM_STATS:     'platform:stats',
  PLATFORM_COMPANIES: 'platform:companies',
  PLATFORM_USERS:     'platform:users',
  PLATFORM_AUDIT:     'platform:audit',
  PLATFORM_BILLING:   'platform:billing',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
