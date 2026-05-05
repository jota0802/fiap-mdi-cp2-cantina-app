import { sql } from 'drizzle-orm';
import { createDb } from './client.js';
import { logger } from '../lib/logger.js';

async function main() {
  const db = await createDb();
  logger.warn('⚠️  DROPPING all tables...');
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  logger.info('Schema reset. Run db:push or db:migrate next, then db:seed.');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Reset failed');
  process.exit(1);
});
