/**
 * Platform Configuration
 * Single source of truth for all platform-level constants.
 * Nothing in the codebase imports process.env directly — use this file instead.
 *
 * NOTE: Required secrets use ES `get` accessors so they are validated lazily
 * at request time, not at module import time (which would break next build).
 */

export const Platform = {
  name: 'Flowxiq',
  version: '1.0.0',
  supportEmail: 'support@flowxiq.com',
  companyEmail: 'hello@flowxiq.com',

  db: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },

  auth: {
    get secret(): string {
      const s = process.env.JWT_SECRET;
      if (!s) throw new Error('[FATAL] JWT_SECRET environment variable is not set. Set it in Vercel → Settings → Environment Variables.');
      return s;
    },
    sessionTTL: '24h',
    activationTTL: '7d',
    resetCodeTTLMs: 15 * 60 * 1000, // 15 minutes
    maxLoginAttemptsPerMinute: 10,
    maxResetAttemptsPerHour: 3,
  },

  email: {
    provider: 'resend' as const,
    apiKey: process.env.RESEND_API_KEY || '',
    from: 'Flowxiq <noreply@flowxiq.com>',
    replyTo: 'support@flowxiq.com',
  },

  google: {
    sheetId: process.env.GOOGLE_SHEET_ID || '',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    get privateKey(): string {
      return (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    },
  },

  upstash: {
    redisUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },

  encryption: {
    // 64-char hex string = 32 bytes for AES-256-GCM
    get key(): string {
      const k = process.env.PLATFORM_ENCRYPTION_KEY;
      if (!k) throw new Error('[FATAL] PLATFORM_ENCRYPTION_KEY environment variable is not set. Set it in Vercel → Settings → Environment Variables.');
      return k;
    },
  },

  storage: {
    maxBase64PhotoSizeKB: 500,
    maxStorageGbPerTenant: 1,
  },

  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://flowxiq.com',
    isProduction: process.env.NODE_ENV === 'production',
  },

  superAdmin: {
    // Internal platform admin identifier — never exposed to clients
    role: 'super_admin' as const,
  },
};

export type PlatformConfig = typeof Platform;
