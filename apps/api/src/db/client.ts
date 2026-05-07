import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { drizzle as drizzlePgliteType } from 'drizzle-orm/pglite';
import { env, isProd } from '../env.js';
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
  // SSL explicito em prod: garante TLS mesmo se a URL nao trouxer sslmode.
  // Em dev (Neon via tethering, etc), respeitamos a URL — pglite ja tratado acima.
  const pool = new Pool({
    connectionString: url,
    max: 10,
    ssl: isProd ? { rejectUnauthorized: true } : undefined,
  });
  return drizzlePg(pool, { schema });
}

export async function getDb(): Promise<DB> {
  if (!_db) _db = await createDb();
  return _db;
}
