import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { getDb } from './db/client.js';
import { startPromoteJob } from './jobs/promote-orders.js';
import type { DB } from './db/client.js';

const db = await getDb();
const app = await createApp({ db });
const stopJob = startPromoteJob(db as DB);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`🌶️  Hono running on http://localhost:${info.port} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  stopJob();
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
