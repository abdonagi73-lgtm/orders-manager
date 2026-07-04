/**
 * Audit Log — Core Write Function
 * Every mutation in the platform must call logAudit().
 * Fire-and-forget: never await at the call site to avoid blocking responses.
 *
 * Usage:
 *   void logAudit(db, {
 *     companyId: session.companyId,
 *     actorId: session.id,
 *     actorName: session.name,
 *     actorRole: session.role,
 *     action: 'order.created',
 *     entityType: 'order',
 *     entityId: order.id,
 *     meta: { orderName: order.name },
 *     requestId,
 *   });
 */

import { logger } from '@/lib/logger';

export interface AuditEvent {
  companyId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  requestId?: string;
}

export type AuditAction =
  // Orders
  | 'order.created'
  | 'order.submitted'
  | 'order.closed'
  | 'order.deleted'
  | 'order.updated'
  // Items
  | 'item.added'
  | 'item.edited'
  | 'item.status_changed'
  | 'item.deleted'
  | 'item.photo_updated'
  // Team
  | 'user.added'
  | 'user.removed'
  | 'user.pin_reset'
  | 'user.activated'
  // Auth
  | 'auth.login_success'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'auth.password_changed'
  // Vendors
  | 'vendor.added'
  | 'vendor.edited'
  | 'vendor.deleted'
  // Settings
  | 'settings.updated'
  | 'company.updated'
  // Integrations
  | 'integration.added'
  | 'integration.removed'
  | 'integration.synced'
  // Subscription
  | 'subscription.upgrade_requested'
  | 'subscription.plan_changed'
  | 'subscription.suspended'
  // Admin
  | 'admin.company_created'
  | 'admin.company_deleted'
  | 'admin.company_updated'
  | 'admin.user_added'
  | 'admin.user_removed'
  // System
  | 'system.error';

export type AuditEntityType =
  | 'order'
  | 'item'
  | 'user'
  | 'vendor'
  | 'company'
  | 'integration'
  | 'subscription'
  | 'setting';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

/**
 * Write an audit log entry. Non-blocking — call with void.
 */
export async function logAudit(db: Db, event: AuditEvent): Promise<void> {
  try {
    const { audit_log } = await import('@/db/schema');
    const { nanoid } = await import('nanoid').catch(() => ({
      nanoid: () => Math.random().toString(36).slice(2, 11),
    }));

    await db.insert(audit_log).values({
      id: typeof nanoid === 'function' ? nanoid() : crypto.randomUUID(),
      company_id:  event.companyId,
      actor_id:    event.actorId,
      actor_name:  event.actorName,
      actor_role:  event.actorRole,
      action:      event.action,
      entity_type: event.entityType,
      entity_id:   event.entityId,
      meta:        event.meta ? JSON.stringify(event.meta) : null,
      ip_address:  event.ipAddress ?? null,
      request_id:  event.requestId ?? null,
      created_at:  new Date().toISOString(),
    });
  } catch (error) {
    // Audit logging must never crash the request
    logger.warn('Failed to write audit log entry', {
      action: event.action,
      entityId: event.entityId,
      error: String(error),
    });
  }
}
