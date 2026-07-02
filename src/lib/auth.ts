import { SignJWT, jwtVerify } from 'jose';

export interface UserSession {
  id: string;
  name: string;
  role: string;
  companyId: string;
  companyName: string;
  currency: string;
  commissionRate: number;
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-temporary-saas-key-2026-luxury-streetwear'
);

export async function encryptSession(session: UserSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function decryptSession(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}
