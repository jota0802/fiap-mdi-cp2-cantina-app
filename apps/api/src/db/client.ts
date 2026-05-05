import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { drizzle as drizzlePgliteType } from 'drizzle-orm/pglite';
import { env } from '../env.js';
import * as schema from './schema.js';

export type DB =
  | ReturnType<typeof drizzlePg<typeof schema>>
  | ReturnType<typeof drizzlePgliteType<typeof schema>>;

let _db: DB | null = null;

export async function createDb(opts: { pglitePath?: string; databaseUrl?: string } = {}): Promise<DB> {
  if (env.USE_PGLITE || opts.pglitePath !== undefined) {
    const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
    const { PGlite } = await import('@electric-sql/pglite');
    const path = opts.pglitePath ?? env.PGLITE_PATH;
    const client = path === ':memory:' ? new PGlite() : new PGlite(path);
    return drizzlePglite(client, { schema });
  }
  const url = opts.databaseUrl ?? env.DATABASE_URL!;
  const pool = new Pool({ connectionString: url, max: 10 });
  return drizzlePg(pool, { schema });
}

export async function getDb(): Promise<DB> {
  if (!_db) _db = await createDb();
  return _db;
}
