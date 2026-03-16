import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

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

export async function createAdminSession(userId: string, email: string) {
  const jwtSecret = getJwtSecret();
  const token = await new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(jwtSecret);
  return token;
}

export async function verifyAdminSession(token: string) {
  try {
    const jwtSecret = getJwtSecret();
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload;
  } catch (error) {
    return null;
  }
}
