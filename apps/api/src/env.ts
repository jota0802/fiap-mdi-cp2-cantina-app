import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().url().optional(),
  USE_PGLITE: z.coerce.boolean().default(false),
  PGLITE_PATH: z.string().default('./dev.db'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ALLOWED_ORIGINS: z.string().default('*'),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid env vars:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  if (!result.data.USE_PGLITE && !result.data.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required when USE_PGLITE=false');
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const allowedOrigins: string | string[] = env.ALLOWED_ORIGINS === '*'
  ? '*'
  : env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
