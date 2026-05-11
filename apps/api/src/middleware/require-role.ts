import type { MiddlewareHandler } from 'hono';
import { forbidden } from '../lib/errors.js';

export type ValidRole = 'customer' | 'staff';

export function requireRole(role: ValidRole): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || user.role !== role) {
      throw forbidden(`Apenas ${role} pode acessar esta rota`);
    }
    await next();
  };
}
