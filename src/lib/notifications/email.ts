/**
 * Email Notification Sender (Resend)
 */

import { Resend } from 'resend';
import { Platform } from '@/config';
import { logger } from '@/lib/logger';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(Platform.email.apiKey);
  }
  return _resend;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!Platform.email.apiKey) {
    logger.warn('Email not sent — RESEND_API_KEY is not configured', { to: options.to, subject: options.subject });
    return false;
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from:     Platform.email.from,
      to:       options.to,
      subject:  options.subject,
      html:     options.html,
      replyTo:  options.replyTo ?? Platform.email.replyTo,
    });

    if (error) {
      logger.error('Resend email failed', { to: options.to, subject: options.subject, error: String(error) });
      return false;
    }

    logger.info('Email sent', { to: options.to, subject: options.subject });
    return true;
  } catch (error) {
    logger.error('Email send exception', { to: options.to, error: String(error) });
    return false;
  }
}
