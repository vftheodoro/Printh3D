import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import {
  isAdminRole,
  type AdminRole,
  type AdminSessionClaims,
} from '@/modules/auth/domain';

function getJwtSecret(): Uint8Array {
  const secretKey = process.env.ADMIN_JWT_SECRET;
  if (!secretKey) {
    throw new Error('Missing ADMIN_JWT_SECRET environment variable.');
  }
  return new TextEncoder().encode(secretKey);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(
  userId: string,
  email: string,
  role: AdminRole,
) {
  const jwtSecret = getJwtSecret();
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(jwtSecret);
  return token;
}

export async function verifyAdminSession(
  token: string,
): Promise<AdminSessionClaims | null> {
  try {
    const jwtSecret = getJwtSecret();
    const { payload } = await jwtVerify(token, jwtSecret);
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      !isAdminRole(payload.role)
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
