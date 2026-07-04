/**
 * Rate Limiter
 * Sliding-window in-memory rate limiter.
 * Upgradeable to Redis/Upstash in V2 by swapping the store.
 *
 * Usage:
 *   const result = rateLimit(`login:${ip}`, 10, 60_000); // 10 per minute
 *   if (!result.allowed) return rateLimited();
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart — acceptable for serverless cold starts)
const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment the rate limit for a given key.
 * @param key       Unique identifier (e.g. `login:192.168.1.1`)
 * @param maxReqs   Maximum allowed requests in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  maxReqs: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxReqs - 1, resetAt };
  }

  if (entry.count >= maxReqs) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxReqs - entry.count, resetAt: entry.resetAt };
}

/**
 * Get the client IP address from a request.
 * Respects x-forwarded-for for Vercel/proxy deployments.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

// Cleanup old entries periodically (prevents memory leak in long-running processes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Array.from(store.entries()).forEach(([key, entry]) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 5 * 60 * 1000); // every 5 minutes
}
