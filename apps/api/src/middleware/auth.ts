import type { MiddlewareHandler } from 'hono';
import { verifyJwt, type JwtPayload } from '../lib/jwt.js';
import { unauthorized } from '../lib/errors.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw unauthorized('Missing Bearer token');
  }
  const token = auth.slice(7).trim();
  if (!token) throw unauthorized('Empty token');
  try {
    const payload = await verifyJwt(token);
    c.set('user', payload);
    await next();
  } catch {
    throw unauthorized('Invalid token');
  }
};
