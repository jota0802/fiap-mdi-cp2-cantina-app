import { sql } from 'drizzle-orm';
import { createDb } from './client.js';
import { logger } from '../lib/logger.js';
import { isProductionTarget, confirmInProd } from '../scripts/_safety.js';

async function main() {
  if (isProductionTarget(process.env.DATABASE_URL)) {
    const message = `\n⚠️  PERIGO: este comando vai APAGAR TODOS OS DADOS.\n` +
      `   Banco:   ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@')}\n` +
      `   Tabelas: schema 'public' inteiro será dropped`;
    const ok = await confirmInProd('apagar tudo em prod', message);
    if (!ok) {
      console.error('❌ Confirmação não recebida — abortando.');
      process.exit(1);
    }
  }

  const db = await createDb();
  logger.warn('⚠️  DROPPING all tables...');
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  // Drizzle guarda o historico de migrations em schema separado (drizzle.__drizzle_migrations).
  // Sem dropar isso, o migrator pula 0000/0001 e tenta aplicar so o resto, quebrando.
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  logger.info('Schema reset. Run db:push or db:migrate next, then db:seed.');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Reset failed');
  process.exit(1);
});
