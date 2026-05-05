import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'staff';
  locale: string;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setSubject(payload.sub)
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .setIssuer('cantina-api')
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer: 'cantina-api' });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as 'customer' | 'staff',
    locale: payload.locale as string,
  };
}
