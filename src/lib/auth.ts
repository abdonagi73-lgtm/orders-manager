import { SignJWT, jwtVerify } from 'jose';
import { Platform } from '@/config';
import type { FeatureKey } from '@/lib/features/types';
import type { Permission } from '@/lib/rbac/permissions';

export interface UserSession {
  // Core identity
  id:             string;
  name:           string;
  role:           string;
  companyId:      string;
  companyName:    string;
  // Business context
  currency:       string;
  commissionRate: number;
  // Plan & feature context (added v1.1 — may be missing in older tokens)
  plan?:          string;
  permissions?:   Permission[];
  features?:      FeatureKey[];
}

const SECRET = new TextEncoder().encode(Platform.auth.secret);

export async function encryptSession(session: UserSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Platform.auth.sessionTTL)
    .sign(SECRET);
}

export async function encryptSessionLong(session: UserSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Platform.auth.activationTTL)
    .sign(SECRET);
}

export async function decryptSession(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] });
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}
