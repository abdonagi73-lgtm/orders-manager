/**
 * Platform Configuration
 * Single source of truth for all platform-level constants.
 * Nothing in the codebase imports process.env directly — use this file instead.
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
    secret: process.env.JWT_SECRET || 'super-secret-temporary-saas-key-2026-luxury-streetwear',
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

  encryption: {
    // 64-char hex string = 32 bytes for AES-256-GCM
    key: process.env.PLATFORM_ENCRYPTION_KEY || '0'.repeat(64),
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
} as const;

export type PlatformConfig = typeof Platform;
