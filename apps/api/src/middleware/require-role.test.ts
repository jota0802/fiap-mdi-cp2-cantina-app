import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { requireRole } from './require-role.js';
import { errorHandler } from './error-handler.js';
import type { JwtPayload } from '../lib/jwt.js';

function makeApp(requiredRole: 'customer' | 'staff', actualRole: 'customer' | 'staff') {
  const app = new Hono();
  app.onError(errorHandler);
  app.use('*', async (c, next) => {
    c.set('user', {
      sub: 'u1',
      role: actualRole,
      email: 'x@x.com',
      locale: 'pt',
      cantinaId: undefined,
    } as JwtPayload);
    await next();
  });
  app.use('*', requireRole(requiredRole));
  app.get('/', (c) => c.json({ ok: true }));
  return app;
}

describe('requireRole middleware', () => {
  it('libera quando role bate', async () => {
    const app = makeApp('staff', 'staff');
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  it('bloqueia com 403 quando role nao bate', async () => {
    const app = makeApp('staff', 'customer');
    const res = await app.request('/');
    expect(res.status).toBe(403);
  });

  it('bloqueia customer quando rota exige customer mas user e staff', async () => {
    const app = makeApp('customer', 'staff');
    const res = await app.request('/');
    expect(res.status).toBe(403);
  });
});
