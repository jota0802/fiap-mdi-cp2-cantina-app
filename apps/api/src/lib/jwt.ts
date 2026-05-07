import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { env } from '../env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.enum(['customer', 'staff']),
  locale: z.string(),
  cantinaId: z.string().optional(), // presente só pra staff
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

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
  return JwtPayloadSchema.parse(payload);
}
