/**
 * Notification Types
 * All notification events and channels defined here.
 */

export type NotificationChannel = 'in_app' | 'email';

export type NotificationEvent =
  // Orders
  | 'order.created'
  | 'order.submitted'
  | 'order.closed'
  // Items
  | 'item.flagged'
  | 'item.approved'
  // Team
  | 'team.member_added'
  | 'team.member_removed'
  // Subscription
  | 'subscription.trial_ending'   // 7 days before trial ends
  | 'subscription.trial_ended'
  | 'subscription.upgrade_requested'
  | 'subscription.suspended'
  // Auth
  | 'auth.password_reset'
  | 'auth.welcome';

export interface NotificationPayload {
  event: NotificationEvent;
  companyId?: string;
  recipientEmail?: string;
  recipientName?: string;
  data: Record<string, unknown>;
}

export interface DispatchOptions {
  channels: NotificationChannel[];
}
