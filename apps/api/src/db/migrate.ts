import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { createDb } from './client.js';
import { env } from '../env.js';
import { logger } from '../lib/logger.js';

async function main() {
  logger.info('Running migrations...');
  const db = await createDb();
  if (env.USE_PGLITE) {
    await migratePglite(db as Parameters<typeof migratePglite>[0], { migrationsFolder: './drizzle' });
  } else {
    await migratePg(db as Parameters<typeof migratePg>[0], { migrationsFolder: './drizzle' });
  }
  logger.info('Migrations done ✅');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
