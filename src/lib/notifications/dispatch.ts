/**
 * Notification Dispatcher
 * Routes notification events through the appropriate channels.
 * Always fire-and-forget: never await at call sites.
 */

import { sendEmail } from './email';
import { renderTemplate } from './templates';
import { logger } from '@/lib/logger';
import type { NotificationEvent, NotificationPayload, DispatchOptions } from './types';

export type { NotificationEvent, NotificationPayload };

/**
 * Dispatch a notification through the specified channels.
 * Call with void — never await.
 *
 * Example:
 *   void dispatch({
 *     event: 'auth.password_reset',
 *     recipientEmail: user.email,
 *     recipientName: user.name,
 *     data: { name: user.name, code: '483920' },
 *   }, { channels: ['email'] });
 */
export async function dispatch(
  payload: NotificationPayload,
  options: DispatchOptions = { channels: ['email'] }
): Promise<void> {
  const { event, recipientEmail, recipientName, data } = payload;

  for (const channel of options.channels) {
    if (channel === 'email') {
      if (!recipientEmail) {
        logger.warn('dispatch: email channel requested but no recipientEmail provided', { event });
        continue;
      }

      const template = renderTemplate(event, { ...data, name: recipientName });

      if (!template) {
        logger.warn('dispatch: no email template found for event', { event });
        continue;
      }

      await sendEmail({
        to:      recipientEmail,
        subject: template.subject,
        html:    template.html,
      });
    }
    // Future: 'in_app' channel writes to notifications table
    // Future: 'push' channel sends FCM/APNs push
  }
}
