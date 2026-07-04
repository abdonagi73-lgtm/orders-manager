/**
 * RBAC Framework — Core Functions
 * Use these functions everywhere permissions are checked.
 * Never compare session.role === 'something' directly.
 */

import { NextResponse } from 'next/server';
import { DefaultRolePermissions } from './roles';
import { Permissions, type Permission } from './permissions';

export interface SessionLike {
  role: string;
  id?: string;
  companyId?: string;
}

/**
 * Check if a session has a specific permission.
 * Synchronous — uses the default role permission table.
 */
export function hasPermission(session: SessionLike, permission: Permission): boolean {
  const rolePermissions = DefaultRolePermissions[session.role] ?? [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a session has ALL of the specified permissions.
 */
export function hasAllPermissions(session: SessionLike, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(session, p));
}

/**
 * Check if a session has ANY of the specified permissions.
 */
export function hasAnyPermission(session: SessionLike, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(session, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: string): Permission[] {
  return DefaultRolePermissions[role] ?? [];
}

/**
 * Returns a 403 NextResponse if the session lacks the given permission.
 * Use at the top of API route handlers.
 */
export function enforcePerm(
  session: SessionLike | null,
  permission: Permission
): NextResponse | null {
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  if (!hasPermission(session, permission)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } },
      { status: 403 }
    );
  }
  return null;
}

export { Permissions };
export type { Permission };
export { DefaultRolePermissions };
