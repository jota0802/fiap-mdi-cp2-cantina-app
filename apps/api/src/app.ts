import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { allowedOrigins, env } from './env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = new Hono();

  app.use('*', cors({ origin: allowedOrigins, credentials: true }));
  app.use('*', secureHeaders());

  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    logger.info({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: Date.now() - start,
    }, 'request');
  });

  app.get('/api/v1/health', (c) => {
    return c.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      version: '0.0.0',
      env: env.NODE_ENV,
    });
  });

  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));

  app.onError(errorHandler);

  return app;
}
