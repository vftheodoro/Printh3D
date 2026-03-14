import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.ADMIN_JWT_SECRET || 'fallback-secret-key-123-do-not-use-in-production';
const JWT_SECRET = new TextEncoder().encode(secretKey);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(userId: string, email: string) {
  const token = await new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

export async function verifyAdminSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}
