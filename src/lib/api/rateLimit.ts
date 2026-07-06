/**
 * Rate Limiter — Upstash Redis (production) with in-memory fallback (dev/CI)
 *
 * Production (Vercel):  Uses @upstash/ratelimit with sliding-window algorithm.
 *                       State is stored in Redis → works across all serverless
 *                       instances, survives cold starts, and is IP-scoped.
 *
 * Development / CI:     Falls back to in-memory Map when env vars are absent.
 *                       Behaviour is functionally identical but not distributed.
 *
 * Usage (unchanged from previous API):
 *   const result = await rateLimit(`login:${ip}`, 10, 60);  // 10 per 60 seconds
 *   if (!result.allowed) return 429;
 *
 * NOTE: rateLimit() is now async. All callers must await it.
 */

import { getClientIp as _getClientIp } from './rateLimitHelpers';

export { getClientIp } from './rateLimitHelpers';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── Upstash Redis path ────────────────────────────────────────────────────────
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let _ratelimiter: Map<string, import('@upstash/ratelimit').Ratelimit> | null = null;

async function getRedisLimiter(key: string, maxReqs: number, windowSec: number): Promise<RateLimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null; // fall through to in-memory

  try {
    const { Redis }      = await import('@upstash/redis');
    const { Ratelimit }  = await import('@upstash/ratelimit');

    if (!_ratelimiter) _ratelimiter = new Map();

    const cacheKey = `${maxReqs}:${windowSec}`;
    if (!_ratelimiter.has(cacheKey)) {
      const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
      _ratelimiter.set(
        cacheKey,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(maxReqs, `${windowSec} s`),
          analytics: false,
          prefix: 'flowxiq:rl',
        })
      );
    }

    const limiter = _ratelimiter.get(cacheKey)!;
    const { success, remaining, reset } = await limiter.limit(key);
    return { allowed: success, remaining, resetAt: reset };
  } catch (err) {
    // Redis unavailable — fail open so auth still works, log the error
    console.error('[rateLimit] Upstash error, failing open:', err);
    return { allowed: true, remaining: maxReqs, resetAt: Date.now() + windowSec * 1000 };
  }
}

// ─── In-memory fallback ────────────────────────────────────────────────────────
interface MemEntry { count: number; resetAt: number; }
const memStore = new Map<string, MemEntry>();

function memRateLimit(key: string, maxReqs: number, windowMs: number): RateLimitResult {
  const now   = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    memStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxReqs - 1, resetAt };
  }
  if (entry.count >= maxReqs) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxReqs - entry.count, resetAt: entry.resetAt };
}

// Clean up expired in-memory entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Array.from(memStore.entries()).forEach(([k, e]) => {
      if (now > e.resetAt) memStore.delete(k);
    });
  }, 5 * 60 * 1000);
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * @param key       Unique rate-limit key (e.g. `pw-worker:1.2.3.4`)
 * @param maxReqs   Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds (converted to seconds for Upstash)
 */
export async function rateLimit(
  key: string,
  maxReqs: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redis     = await getRedisLimiter(key, maxReqs, windowSec);
  if (redis) return redis;
  return memRateLimit(key, maxReqs, windowMs);
}
