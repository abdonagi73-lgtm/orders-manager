/**
 * Shared helpers for rate limiting.
 * Kept in a separate file to avoid circular imports.
 */

/**
 * Get the real client IP from a Next.js request.
 * Respects x-forwarded-for set by Vercel's edge network.
 */
export function getClientIp(request: Request | { headers: { get(key: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
