import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { allowedOrigins, env } from './env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRoutes } from './routes/auth.js';
import { createItemsRoutes } from './routes/items.js';
import { createOrdersRoutes } from './routes/orders.js';
import { createFavoritesRoutes } from './routes/favorites.js';
import { getDb } from './db/client.js';
import type { DB } from './db/client.js';

export async function createApp(injected?: { db?: DB }) {
  const db = injected?.db ?? await getDb();
  const app = new Hono();

  app.use('*', cors({ origin: allowedOrigins, credentials: true }));
  app.use('*', secureHeaders());
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    logger.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start }, 'request');
  });

  app.get('/api/v1/health', (c) => c.json({ status: 'ok', uptime: Math.floor(process.uptime()), version: '0.0.0', env: env.NODE_ENV }));

  app.route('/api/v1/auth', await createAuthRoutes(db));
  app.route('/api/v1/items', createItemsRoutes(db));
  app.route('/api/v1/orders', createOrdersRoutes(db));
  app.route('/api/v1/favorites', createFavoritesRoutes(db));

  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));
  app.onError(errorHandler);

  return app;
}
