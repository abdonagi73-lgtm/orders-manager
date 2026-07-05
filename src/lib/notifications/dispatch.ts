/**
 * Notification Dispatcher
 * Routes notification events through the appropriate channels.
 */

import { sendEmail } from './email';
import { renderTemplate } from './templates';
import { logger } from '@/lib/logger';
import type { NotificationEvent, NotificationPayload, DispatchOptions } from './types';

export type { NotificationEvent, NotificationPayload };

/**
 * Dispatch a notification through the specified channels.
 * Returns true if the email was sent successfully, false otherwise.
 */
export async function dispatch(
  payload: NotificationPayload,
  options: DispatchOptions = { channels: ['email'] }
): Promise<boolean> {
  const { event, recipientEmail, recipientName, data } = payload;
  let allSucceeded = true;

  for (const channel of options.channels) {
    if (channel === 'email') {
      if (!recipientEmail) {
        logger.warn('dispatch: email channel requested but no recipientEmail provided', { event });
        allSucceeded = false;
        continue;
      }

      const template = renderTemplate(event, { ...data, name: recipientName });

      if (!template) {
        logger.warn('dispatch: no email template found for event', { event });
        allSucceeded = false;
        continue;
      }

      const sent = await sendEmail({
        to:      recipientEmail,
        subject: template.subject,
        html:    template.html,
      });

      if (!sent) {
        logger.error('dispatch: sendEmail returned false', { event, to: recipientEmail });
        allSucceeded = false;
      }
    }
    // Future: 'in_app' channel writes to notifications table
    // Future: 'push' channel sends FCM/APNs push
  }

  return allSucceeded;
}
