/**
 * Email Templates
 * Each notification event has a render function that returns { subject, html }.
 * All templates use inline CSS for email client compatibility.
 */

import type { NotificationEvent } from '../types';
import { Platform } from '@/config';

interface TemplateResult {
  subject: string;
  html: string;
}

// ─── Base Layout ─────────────────────────────────────────────────────────────

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0A0F1C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1C;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                flow<span style="color:#3B82F6;">xiq</span>
              </span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#111827;border:1px solid #1E2E4F;border-radius:16px;padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;color:#4B5563;font-size:12px;line-height:1.6;">
              <p style="margin:0;">© ${new Date().getFullYear()} Flowxiq · All rights reserved</p>
              <p style="margin:4px 0 0;">
                <a href="${Platform.app.url}" style="color:#3B82F6;text-decoration:none;">${Platform.app.url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;line-height:1.2;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#9CA3AF;line-height:1.6;">${text}</p>`;
}

function codeBlock(code: string): string {
  return `<div style="background:#0A0F1C;border:1px solid #1E2E4F;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
    <span style="font-family:monospace;font-size:32px;font-weight:800;letter-spacing:12px;color:#3B82F6;">${code}</span>
  </div>`;
}

function ctaButton(text: string, href: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#3B82F6;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">${text}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #1E2E4F;margin:24px 0;">`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function renderTemplate(
  event: NotificationEvent,
  data: Record<string, unknown>
): TemplateResult | null {
  switch (event) {
    case 'auth.password_reset':
      return {
        subject: 'Your Flowxiq password reset code',
        html: baseLayout('Password Reset', `
          ${h1('Reset your password')}
          ${p(`Hi ${data.name || 'there'},`)}
          ${p('We received a request to reset your Flowxiq password. Use the code below — it expires in 15 minutes.')}
          ${codeBlock(String(data.code))}
          ${p('If you did not request this reset, you can safely ignore this email. Your password will not change.')}
          ${divider()}
          ${p('<small style="color:#6B7280;">This code is valid for 15 minutes only.</small>')}
        `),
      };

    case 'auth.welcome':
      return {
        subject: `Welcome to Flowxiq — ${data.companyName}`,
        html: baseLayout('Welcome to Flowxiq', `
          ${h1(`Welcome to Flowxiq, ${data.name}!`)}
          ${p(`Your ${data.companyName} workspace is ready. You're on the <strong style="color:#3B82F6;">${data.plan || 'Free Trial'}</strong> plan.`)}
          ${ctaButton('Open Your Portal', `${Platform.app.url}/app`)}
          ${divider()}
          ${p('Need help? Reply to this email or visit our support center.')}
        `),
      };

    case 'auth.workspace_approved':
      return {
        subject: `Your Flowxiq Workspace is Approved! — ${data.companyName}`,
        html: baseLayout('Workspace Approved', `
          ${h1(`Congratulations! Your workspace has been approved.`)}
          ${p(`Hi ${data.name || 'there'},`)}
          ${p(`We are pleased to inform you that your request for <strong style="color:#fff;">${data.companyName}</strong> has been approved.`)}
          ${p(`You can log in to your dashboard using the temporary credentials below:`)}
          <div style="background:#0A0F1C;border:1px solid #1E2E4F;border-radius:10px;padding:20px;margin:24px 0;font-family:sans-serif;color:#9CA3AF;line-height:1.8;text-align:left;">
            <div style="margin-bottom:8px;"><strong>Workspace ID:</strong> <span style="color:#fff;font-family:monospace;font-size:15px;margin-left:8px;">${data.companyId}</span></div>
            <div style="margin-bottom:8px;"><strong>Email/Username:</strong> <span style="color:#fff;font-family:monospace;font-size:15px;margin-left:8px;">${data.email}</span></div>
            <div style="margin-bottom:8px;"><strong>Temporary Password:</strong> <span style="color:#3B82F6;font-family:monospace;font-size:16px;font-weight:700;margin-left:8px;">${data.tempPassword}</span></div>
          </div>
          ${p(`Upon your first login, you will be prompted to choose a permanent, secure password.`)}
          ${ctaButton('Log In to Flowxiq', `${Platform.app.url}/app`)}
          ${divider()}
          ${p('If you have any questions or need onboarding assistance, please reply to this email.')}
        `),
      };

    case 'subscription.trial_ending':
      return {
        subject: `Your Flowxiq trial ends in ${data.daysLeft} days`,
        html: baseLayout('Trial Ending Soon', `
          ${h1('Your free trial is ending soon')}
          ${p(`Hi ${data.name || 'there'},`)}
          ${p(`Your Flowxiq free trial for <strong style="color:#fff;">${data.companyName}</strong> ends in <strong style="color:#F59E0B;">${data.daysLeft} days</strong>.`)}
          ${p('Upgrade to a paid plan to keep full access to your account and data.')}
          ${ctaButton('Upgrade Now', `${Platform.app.url}/owner?tab=subscription`)}
          ${divider()}
          ${p('Questions? Contact us at <a href="mailto:support@flowxiq.com" style="color:#3B82F6;">support@flowxiq.com</a>')}
        `),
      };

    case 'subscription.upgrade_requested':
      return {
        subject: `Upgrade request from ${data.companyName}`,
        html: baseLayout('Upgrade Request', `
          ${h1('A customer wants to upgrade')}
          ${p(`<strong style="color:#fff;">${data.companyName}</strong> has requested an upgrade to the <strong style="color:#3B82F6;">${data.targetPlan}</strong> plan.`)}
          ${p(`Contact: ${data.ownerName || 'N/A'} · ${data.ownerEmail || 'N/A'}`)}
          ${ctaButton('View in HQ', `${Platform.app.url}/super-admin`)}
        `),
      };

    case 'order.submitted':
      return {
        subject: `Order submitted: ${data.orderName}`,
        html: baseLayout('Order Submitted', `
          ${h1('Order submitted for review')}
          ${p(`<strong style="color:#fff;">${data.workerName}</strong> has submitted order <strong style="color:#3B82F6;">${data.orderName}</strong> for your review.`)}
          ${p(`Items: ${data.itemCount} · Total: ${data.currency}${data.total}`)}
          ${ctaButton('Review Order', `${Platform.app.url}/owner`)}
        `),
      };

    default:
      return null;
  }
}
