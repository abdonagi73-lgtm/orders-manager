/**
 * Shared server-side auth helpers for API routes.
 * All authentication MUST go through these functions.
 * Never trust client-supplied headers (x-user-role, x-company-id) as the sole
 * source of authority — always verify from the signed session cookie.
 */

import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import type { UserSession } from '@/lib/auth';

/**
 * Reads and verifies the session cookie.
 * Returns the decrypted session or null if missing/invalid.
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie?.value) return null;
    return await decryptSession(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Returns true ONLY if a valid super_admin session cookie is present.
 * The x-user-role header fallback has been removed — it is client-controllable.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === 'super_admin';
}

/**
 * Returns true if a valid session exists and the user belongs to the given company.
 */
export async function isCompanyMember(companyId: string): Promise<boolean> {
  const session = await getSession();
  return !!session && session.companyId === companyId;
}
