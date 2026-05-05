import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().url().optional(),
  // NOTE: z.coerce.boolean() trata QUALQUER string nao-vazia como true (incluindo 'false').
  // Parse explicito: 'true' -> true, qualquer outra coisa -> false.
  USE_PGLITE: z.string().optional().transform((s) => s === 'true'),
  PGLITE_PATH: z.string().default('./dev.db'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ALLOWED_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

const DEV_DEFAULT_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:8082',
  'http://10.0.2.2:8081',
];

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
export const isTest = env.NODE_ENV === 'test';
export const isProd = env.NODE_ENV === 'production';

function resolveAllowedOrigins(): string[] {
  if (env.ALLOWED_ORIGINS) {
    const list = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
    if (list.includes('*')) {
      if (isProd) {
        console.error('❌ ALLOWED_ORIGINS contains "*" — not allowed in production. Provide explicit origins.');
        process.exit(1);
      }
      console.warn('⚠️  ALLOWED_ORIGINS contains "*" — accepted in dev/test only.');
    }
    return list;
  }
  if (isDev || isTest) return DEV_DEFAULT_ORIGINS;
  console.error('❌ ALLOWED_ORIGINS must be set in production (no wildcard fallback).');
  process.exit(1);
}

export const allowedOrigins: string[] = resolveAllowedOrigins();
