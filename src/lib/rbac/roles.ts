/**
 * Default Role-to-Permission Mappings
 * Roles are named bundles of permissions.
 * These are the platform defaults — in V2, roles will be overrideable per tenant.
 */

import { Permissions, type Permission } from './permissions';

const workerPermissions: Permission[] = [
  Permissions.ORDERS_VIEW,
  Permissions.ORDERS_CREATE,
  Permissions.ORDERS_SUBMIT,
  Permissions.ITEMS_ADD,
  Permissions.ITEMS_EDIT,
  Permissions.ITEMS_PHOTO,
  Permissions.VENDORS_VIEW,
  Permissions.NOTIFICATIONS_VIEW,
];

const managerPermissions: Permission[] = [
  ...workerPermissions,
  Permissions.ORDERS_CLOSE,
  Permissions.ORDERS_DELETE,
  Permissions.ORDERS_EXPORT,
  Permissions.ITEMS_FLAG,
  Permissions.ITEMS_APPROVE,
  Permissions.ITEMS_DELETE,
  Permissions.TEAM_VIEW,
  Permissions.TEAM_ADD,
  Permissions.TEAM_REMOVE,
  Permissions.TEAM_RESET_PIN,
  Permissions.VENDORS_ADD,
  Permissions.VENDORS_EDIT,
  Permissions.VENDORS_DELETE,
  Permissions.ANALYTICS_VIEW,
  Permissions.REPORTS_VIEW,
  Permissions.REPORTS_EXPORT,
  Permissions.SETTINGS_VIEW,
  Permissions.SETTINGS_EDIT,
  Permissions.AUDIT_VIEW,
  Permissions.BILLING_VIEW,
  Permissions.INTEGRATIONS_VIEW,
];

const ownerPermissions: Permission[] = [
  ...managerPermissions,
  Permissions.BILLING_MANAGE,
  Permissions.INTEGRATIONS_MANAGE,
  Permissions.INTEGRATIONS_SYNC,
];

const superAdminPermissions: Permission[] = Object.values(Permissions) as Permission[];

export const DefaultRolePermissions: Record<string, Permission[]> = {
  worker:      workerPermissions,
  manager:     managerPermissions,
  owner:       ownerPermissions,
  admin:       ownerPermissions,   // legacy alias for owner
  super_admin: superAdminPermissions,
};

export {
  workerPermissions,
  managerPermissions,
  ownerPermissions,
  superAdminPermissions,
};
