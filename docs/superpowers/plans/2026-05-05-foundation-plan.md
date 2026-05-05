# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o app cantina de monolítico (Expo + AsyncStorage) pra arquitetura cliente-servidor (monorepo pnpm + Hono API + Postgres Neon + React Query) com dark mode premium e pipeline de auditoria, deploy-ready em Render.

**Architecture:** Monorepo `pnpm` com `apps/api` (Hono + Drizzle + Postgres), `apps/mobile` (Expo + React Query consumindo API), `packages/shared` (Zod schemas + types + i18n + validation). Strangler pattern: contexts no mobile viram facades sobre React Query. JWT em SecureStore, argon2 server-side. Dark mode B (neutro near-black). Vitest+pglite na API/shared, Jest+RTL no mobile.

**Tech Stack:** pnpm workspaces · Hono 4 · Drizzle ORM + drizzle-kit · Postgres (Neon prod, pglite tests) · `@node-rs/argon2` · jose (JWT) · Zod · pino · tsup · TanStack Query v5 · `@tanstack/query-async-storage-persister` · Vitest + supertest + `@electric-sql/pglite` · Jest + `@testing-library/react-native` · concurrently · GitHub Actions.

---

## Decisões fechadas (resolve §16 open questions do spec)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Concurrent dev runner | `concurrently` + script `pnpm dev` na raiz |
| 2 | Build API | `tsup` |
| 3 | IDs no DB | cuid2 (`@paralleldrive/cuid2`) |
| 4 | RQ persist | `@tanstack/query-async-storage-persister` |
| 5 | argon2 binding | `@node-rs/argon2` (Rust nativo, sem node-gyp) |
| 6 | Pino transports | JSON em prod, `pino-pretty` em dev only |
| 7 | CI | GitHub Actions na Foundation (typecheck + test + lint em PR) |
| 8 | JWT claims | inclui `locale` pra API responder no idioma |
| 9 | README | raiz (meta-monorepo) + `apps/mobile/README.md` + `apps/api/README.md` |
| 10 | Senha sequencial | reset por dia + tenant_id (futuro-proof) |

## Pré-requisitos (rodar 1x antes da Phase 1)

- [ ] Confirmar Node 20+ instalado: `node -v` (esperado: `v20.x.x` ou `v22.x.x`)
- [ ] Habilitar corepack: `corepack enable && corepack prepare pnpm@9 --activate`
- [ ] Verificar git author: `git config user.name` (esperado: `jota0802`)
- [ ] Confirmar que tudo está commitado: `git status` (esperado: `nothing to commit, working tree clean`)
- [ ] Criar branch de trabalho: `git checkout -b feat/foundation`
- [ ] Conta Neon criada (já confirmado em conversa prévia)
- [ ] Conta Render criada (já confirmado em conversa prévia)

---

## Phase 1 — Monorepo skeleton

### Task 1.1: Criar pnpm-workspace.yaml e mover configurações pra raiz

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Modify: `package.json` (vira root meta-package)
- Create: `.npmrc`

- [ ] **Step 1: Criar `pnpm-workspace.yaml` na raiz**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: Criar `.npmrc` na raiz**

```
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 3: Criar `tsconfig.base.json` na raiz**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 4: Verificar — pnpm reconhece workspace**

Run: `pnpm install`
Expected: roda sem erro, cria `node_modules` na raiz e em `apps/mobile` quando os apps existirem (nessa task ainda não, mas o comando não falha).

### Task 1.2: Mover Expo app para apps/mobile preservando histórico

**Files:**
- Create: `apps/mobile/` (diretório)
- Move: tudo do Expo app exceto `docs/`, `screenshots/`, `CLAUDE.md`, `.gitignore`, `eslint.config.js`, `.git/`, `.claude/`

- [ ] **Step 1: Criar diretório `apps/`**

```powershell
mkdir apps
mkdir apps\mobile
```

- [ ] **Step 2: Listar arquivos a mover (verificação manual)**

A mover (via `git mv` num único commit):
- `app/` `components/` `context/` `hooks/` `constants/` `lib/` `data/` `assets/` `types/` `test/` `screenshots/` (não — fica raiz)
- `app.json` `index.js` `metro.config.js` `package.json` `package-lock.json` `tsconfig.json` `expo-env.d.ts` `App.test.tsx` (se existir)

A NÃO mover:
- `docs/` `screenshots/` `CLAUDE.md` `.gitignore` `eslint.config.js` (vai ser refatorado depois) `.claude/` `.git/` `README.md` (vai ser reescrito)

- [ ] **Step 3: git mv arquivos pro apps/mobile**

```powershell
git mv app apps/mobile/app
git mv components apps/mobile/components
git mv context apps/mobile/context
git mv hooks apps/mobile/hooks
git mv constants apps/mobile/constants
git mv lib apps/mobile/lib
git mv data apps/mobile/data
git mv assets apps/mobile/assets
git mv types apps/mobile/types
git mv test apps/mobile/test
git mv app.json apps/mobile/app.json
git mv index.js apps/mobile/index.js
git mv metro.config.js apps/mobile/metro.config.js
git mv package.json apps/mobile/package.json
git mv package-lock.json apps/mobile/package-lock.json
git mv tsconfig.json apps/mobile/tsconfig.json
git mv expo-env.d.ts apps/mobile/expo-env.d.ts
```

- [ ] **Step 4: Atualizar `apps/mobile/tsconfig.json` pra estender base**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "lib": ["DOM", "ESNext"],
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "paths": {
      "@/*": ["./*"],
      "@cantina/shared": ["../../packages/shared/src/index.ts"],
      "@cantina/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Atualizar `apps/mobile/metro.config.js` pra resolver workspace deps**

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

- [ ] **Step 6: Criar root `package.json` (meta)**

```json
{
  "name": "cantina-monorepo",
  "private": true,
  "version": "0.0.0",
  "engines": { "node": ">=20" },
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "mobile:start": "pnpm --filter @cantina/mobile start",
    "mobile:web": "pnpm --filter @cantina/mobile web",
    "api:dev": "pnpm --filter @cantina/api dev",
    "api:build": "pnpm --filter @cantina/api build",
    "api:start": "pnpm --filter @cantina/api start",
    "api:db:generate": "pnpm --filter @cantina/api db:generate",
    "api:db:push": "pnpm --filter @cantina/api db:push",
    "api:db:migrate": "pnpm --filter @cantina/api db:migrate",
    "api:db:seed": "pnpm --filter @cantina/api db:seed",
    "api:db:studio": "pnpm --filter @cantina/api db:studio",
    "api:db:reset": "pnpm --filter @cantina/api db:reset",
    "dev": "concurrently -n api,mobile -c yellow,cyan \"pnpm api:dev\" \"pnpm mobile:start\"",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "format": "prettier --write \"**/*.{ts,tsx,md,json,yml,yaml}\" --ignore-path .gitignore",
    "audit:run": "tsx scripts/audit-commit-stats.ts && tsx scripts/audit-recent-commits.ts && tsx scripts/audit-grep-stale.ts && tsx scripts/audit-readme-features.ts"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "concurrently": "^9.1.0",
    "prettier": "^3.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 7: Atualizar `apps/mobile/package.json`**

Editar o `name` field pra `@cantina/mobile`. Adicionar script `typecheck` e `lint`.

```json
{
  "name": "@cantina/mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "jest",
    "doctor": "expo-doctor"
  }
}
```

(Manter `dependencies` e `devDependencies` que já existem.)

- [ ] **Step 8: Verificar que o app ainda funciona**

```powershell
pnpm install
pnpm --filter @cantina/mobile typecheck
```

Expected: `pnpm install` completa sem erro. `typecheck` retorna 0 erros (pode reclamar de imports `@cantina/shared` ainda não criados — isso resolve na Task 1.3).

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "refactor(monorepo): move Expo app pra apps/mobile e cria pnpm workspace

- Cria pnpm-workspace.yaml + .npmrc + tsconfig.base.json na raiz
- Move app/ components/ context/ hooks/ constants/ lib/ data/ assets/ types/ test/ + configs Expo pra apps/mobile/
- Atualiza tsconfig.json do mobile pra estender base + path alias @cantina/shared
- Atualiza metro.config.js pra resolver workspace deps
- Cria root package.json com scripts pnpm -r e concurrently
- Mantém docs/, screenshots/, .git/, CLAUDE.md, .claude/ na raiz"
```

### Task 1.3: Criar packages/shared scaffold

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/vitest.config.ts`

- [ ] **Step 1: Criar `packages/shared/package.json`**

```json
{
  "name": "@cantina/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./validation": "./src/validation/index.ts",
    "./i18n": "./src/i18n/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Criar `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ESNext"],
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Criar `packages/shared/src/index.ts` (re-exports placeholder)**

```ts
export * from './types/index.js';
export * from './schemas/index.js';
export * as validation from './validation/index.js';
export * as i18n from './i18n/index.js';
```

- [ ] **Step 4: Criar diretórios e arquivos índice vazios**

```ts
// packages/shared/src/types/index.ts
export {};
```

```ts
// packages/shared/src/schemas/index.ts
export {};
```

```ts
// packages/shared/src/validation/index.ts
export {};
```

```ts
// packages/shared/src/i18n/index.ts
export {};
```

- [ ] **Step 5: Criar `packages/shared/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
    },
  },
});
```

- [ ] **Step 6: Verificar que typecheck passa**

```powershell
pnpm install
pnpm --filter @cantina/shared typecheck
pnpm --filter @cantina/shared test
```

Expected: typecheck 0 erros. Test: "No tests found" (sem testes ainda — aceitável). Pode dar erro fatal no vitest se `test.include` não casar — adicionar `passWithNoTests: true`:

Editar `packages/shared/vitest.config.ts`:
```ts
test: { passWithNoTests: true, ... }
```

- [ ] **Step 7: Commit**

```powershell
git add packages/
git commit -m "feat(shared): cria packages/shared scaffold (zod + vitest)"
```

---

## Phase 2 — API skeleton (Hono + Drizzle + Postgres)

### Task 2.1: Scaffold apps/api

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/env.ts`
- Create: `apps/api/.env.example`
- Create: `apps/api/tsup.config.ts`
- Create: `apps/api/vitest.config.ts`

- [ ] **Step 1: Criar `apps/api/package.json`**

```json
{
  "name": "@cantina/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch --env-file=.env src/index.ts",
    "build": "tsup",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src",
    "db:generate": "drizzle-kit generate",
    "db:push": "tsx --env-file=.env node_modules/drizzle-kit/bin.cjs push",
    "db:migrate": "tsx --env-file=.env src/db/migrate.ts",
    "db:seed": "tsx --env-file=.env src/db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "db:reset": "tsx --env-file=.env src/db/reset.ts"
  },
  "dependencies": {
    "@cantina/shared": "workspace:*",
    "@hono/node-server": "^1.13.0",
    "@hono/zod-validator": "^0.4.0",
    "@node-rs/argon2": "^2.0.0",
    "@paralleldrive/cuid2": "^2.2.0",
    "drizzle-orm": "^0.36.0",
    "hono": "^4.6.0",
    "jose": "^5.9.0",
    "pg": "^8.13.0",
    "pino": "^9.5.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@electric-sql/pglite": "^0.2.0",
    "@types/node": "^22.10.0",
    "@types/pg": "^8.11.0",
    "drizzle-kit": "^0.28.0",
    "pino-pretty": "^11.3.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.0",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Criar `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ESNext"],
    "types": ["node"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "drizzle.config.ts", "tsup.config.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Criar `apps/api/.env.example`**

```
DATABASE_URL=postgresql://user:pass@localhost:5432/cantina
JWT_SECRET=changeme-min-32-chars-please-use-openssl
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=8787
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
USE_PGLITE=false
PGLITE_PATH=./dev.db
```

- [ ] **Step 4: Criar `apps/api/src/env.ts` com validação Zod**

```ts
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
export const allowedOrigins = env.ALLOWED_ORIGINS === '*'
  ? true
  : env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
```

- [ ] **Step 5: Criar `apps/api/src/lib/logger.ts`**

```ts
import pino from 'pino';
import { env, isDev } from '../env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
});
```

- [ ] **Step 6: Criar `apps/api/src/app.ts` (Hono instance)**

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { allowedOrigins, env } from './env.js';
import { logger } from './lib/logger.js';

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

  app.onError((err, c) => {
    logger.error({ err }, 'unhandled error');
    return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500);
  });

  return app;
}
```

- [ ] **Step 7: Criar `apps/api/src/index.ts` (bootstrap)**

```ts
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';

const app = createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`🌶️  Hono running on http://localhost:${info.port} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

- [ ] **Step 8: Criar `apps/api/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  noExternal: ['@cantina/shared'],
});
```

- [ ] **Step 9: Criar `apps/api/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    passWithNoTests: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});
```

- [ ] **Step 10: Criar `apps/api/src/test/setup.ts` (placeholder)**

```ts
// Configurações globais de teste — DB efêmero é setado em fixtures
import { vi } from 'vitest';

// JWT_SECRET de teste pra evitar exit(1) no env.ts
process.env.JWT_SECRET ||= 'test-secret-min-32-chars-for-vitest!!';
process.env.NODE_ENV = 'test';
process.env.USE_PGLITE = 'true';

vi.setConfig({ testTimeout: 10_000 });
```

- [ ] **Step 11: Criar `apps/api/.env` (local dev)**

```
DATABASE_URL=postgresql://USER:PASS@HOST/cantina?sslmode=require
JWT_SECRET=local-dev-secret-min-32-chars-please-rotate
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=8787
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://10.0.2.2:8081
USE_PGLITE=false
```

(`.env` está no `.gitignore` raiz — ver Task 1.1. Substituir `USER/PASS/HOST` pelos valores do Neon quando criar o projeto. Pode usar `USE_PGLITE=true` enquanto não tem Neon.)

- [ ] **Step 12: Instalar deps e rodar smoke**

```powershell
pnpm install
pnpm --filter @cantina/api typecheck
```

Expected: 0 erros. Vai reclamar dos imports `@/db` etc — comente as linhas relevantes ou skip db por enquanto. Se faltar algum dep, rodar `pnpm install` de novo.

- [ ] **Step 13: Smoke test bootstrap**

```powershell
$env:USE_PGLITE="true"
$env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm api:dev
```

Expected: `🌶️  Hono running on http://localhost:8787 (development)` no terminal.

Em outro terminal:
```powershell
curl http://localhost:8787/api/v1/health
```
Expected: `{"status":"ok","uptime":N,"version":"0.0.0","env":"development"}`

Encerrar o servidor com `Ctrl+C`.

- [ ] **Step 14: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): scaffold apps/api com Hono + tsup + vitest + pino + env validation"
```

### Task 2.2: Drizzle config + DB client factory (Postgres OR pglite)

**Files:**
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/src/db/client.ts`
- Create: `apps/api/src/db/migrate.ts`
- Create: `apps/api/src/db/reset.ts`

- [ ] **Step 1: Criar `apps/api/drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost/placeholder',
  },
  verbose: true,
  strict: true,
});
```

(Adicionar `dotenv` aos devDeps do api se ainda não tiver: `pnpm --filter @cantina/api add -D dotenv`.)

- [ ] **Step 2: Criar `apps/api/src/db/client.ts` (factory Postgres ou pglite)**

```ts
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { env } from '../env.js';
import * as schema from './schema.js';

export type DB = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let _db: DB | null = null;

export async function createDb(opts: { pglitePath?: string; databaseUrl?: string } = {}): Promise<DB> {
  if (env.USE_PGLITE || opts.pglitePath !== undefined) {
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
```

- [ ] **Step 3: Criar `apps/api/src/db/schema.ts` (placeholder vazio por enquanto)**

```ts
// Schemas reais ficam em Task 2.3
export const _placeholder = 'schemas em apps/api/src/db/schema.ts';
```

- [ ] **Step 4: Criar `apps/api/src/db/migrate.ts`**

```ts
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
```

- [ ] **Step 5: Criar `apps/api/src/db/reset.ts` (drop + push + seed)**

```ts
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
```

- [ ] **Step 6: Verificar typecheck**

```powershell
pnpm --filter @cantina/api typecheck
```

Expected: 0 erros (assumindo `dotenv` instalado).

- [ ] **Step 7: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): drizzle config + DB factory (Postgres ou pglite por env)"
```

### Task 2.3: Schema completo (users, items, orders, order_items, favorites)

**Files:**
- Modify: `apps/api/src/db/schema.ts` (substitui placeholder)

- [ ] **Step 1: Criar schema completo**

```ts
import { pgTable, text, integer, numeric, boolean, timestamp, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  locale: text('locale').notNull().default('pt'),
  role: text('role').notNull().default('customer'),
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email),
  tenantIdx: index('users_tenant_idx').on(t.tenantId),
}));

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  nameKey: text('name_key').notNull(),
  descricaoKey: text('descricao_key').notNull(),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
  categoria: text('categoria').notNull(),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  imagem: text('imagem'),
  disponivel: boolean('disponivel').notNull().default(true),
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUnique: uniqueIndex('items_slug_unique').on(t.slug),
  catIdx: index('items_categoria_idx').on(t.categoria),
}));

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  senha: integer('senha').notNull(),
  prontoEmEstimado: timestamp('pronto_em_estimado', { withTimezone: true }),
  prontoEm: timestamp('pronto_em', { withTimezone: true }),
  retiradoEm: timestamp('retirado_em', { withTimezone: true }),
  canceladoEm: timestamp('cancelado_em', { withTimezone: true }),
  tenantId: text('tenant_id'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status),
  tenantDayIdx: index('orders_tenant_day_idx').on(t.tenantId, t.criadoEm),
}));

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id),
  nameSnapshot: text('name_snapshot').notNull(),
  precoSnapshot: numeric('preco_snapshot', { precision: 10, scale: 2 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  observacoes: text('observacoes'),
}, (t) => ({
  orderIdx: index('order_items_order_idx').on(t.orderId),
}));

export const favorites = pgTable('favorites', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.itemId] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
```

- [ ] **Step 2: Gerar migration inicial**

```powershell
pnpm api:db:generate
```

Expected: cria `apps/api/drizzle/0000_<random_name>.sql` com `CREATE TABLE` para todas as tabelas.

- [ ] **Step 3: Aplicar migration localmente (pglite primeiro pra evitar dependência do Neon ainda)**

```powershell
$env:USE_PGLITE="true"
$env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm api:db:migrate
```

Expected: log `Migrations done ✅`. Cria arquivo `apps/api/dev.db` (pglite local).

- [ ] **Step 4: Commit**

```powershell
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(api): schema drizzle (users, items, orders, order_items, favorites)"
```

### Task 2.4: Seed inicial (12 itens do cardápio atual)

**Files:**
- Create: `apps/api/src/db/seed.ts`

- [ ] **Step 1: Localizar dados do cardápio atual em `apps/mobile/data/cardapio.ts`**

```powershell
cat apps/mobile/data/cardapio.ts | head -50
```

Confirmar shape: items com `id`, `nome` (ou `nomeKey`), `descricao` (ou `descricaoKey`), `preco`, `categoria`, `tags`, `imagem`.

- [ ] **Step 2: Criar `apps/api/src/db/seed.ts`**

```ts
import { createId } from '@paralleldrive/cuid2';
import { createDb } from './client.js';
import { items } from './schema.js';
import { logger } from '../lib/logger.js';

const SEED_ITEMS = [
  { slug: 'misto-quente', nameKey: 'item.misto.nome', descricaoKey: 'item.misto.desc', preco: '8.50', categoria: 'lanches', tags: ['quente', 'bestseller'], imagem: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800' },
  { slug: 'cafe-coado', nameKey: 'item.cafe.nome', descricaoKey: 'item.cafe.desc', preco: '4.00', categoria: 'bebidas', tags: ['quente'], imagem: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
  { slug: 'pao-de-queijo', nameKey: 'item.paodequeijo.nome', descricaoKey: 'item.paodequeijo.desc', preco: '5.00', categoria: 'lanches', tags: ['quente', 'sem-gluten'], imagem: 'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=800' },
  { slug: 'suco-laranja', nameKey: 'item.sucolaranja.nome', descricaoKey: 'item.sucolaranja.desc', preco: '7.00', categoria: 'bebidas', tags: ['gelado', 'natural'], imagem: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800' },
  { slug: 'salgado-frango', nameKey: 'item.salgadofrango.nome', descricaoKey: 'item.salgadofrango.desc', preco: '6.50', categoria: 'lanches', tags: ['frito'], imagem: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800' },
  { slug: 'agua-mineral', nameKey: 'item.agua.nome', descricaoKey: 'item.agua.desc', preco: '3.00', categoria: 'bebidas', tags: ['gelado'], imagem: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800' },
  { slug: 'bolo-cenoura', nameKey: 'item.bolocenoura.nome', descricaoKey: 'item.bolocenoura.desc', preco: '9.00', categoria: 'sobremesas', tags: ['doce'], imagem: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800' },
  { slug: 'sanduiche-natural', nameKey: 'item.sanduiche.nome', descricaoKey: 'item.sanduiche.desc', preco: '12.00', categoria: 'lanches', tags: ['frio', 'saudavel'], imagem: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800' },
  { slug: 'brigadeiro', nameKey: 'item.brigadeiro.nome', descricaoKey: 'item.brigadeiro.desc', preco: '4.50', categoria: 'sobremesas', tags: ['doce'], imagem: 'https://images.unsplash.com/photo-1631206753348-db44968fd440?w=800' },
  { slug: 'salada-caesar', nameKey: 'item.caesar.nome', descricaoKey: 'item.caesar.desc', preco: '15.00', categoria: 'lanches', tags: ['saudavel', 'frio'], imagem: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800' },
  { slug: 'refrigerante', nameKey: 'item.refri.nome', descricaoKey: 'item.refri.desc', preco: '6.00', categoria: 'bebidas', tags: ['gelado'], imagem: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800' },
  { slug: 'croissant', nameKey: 'item.croissant.nome', descricaoKey: 'item.croissant.desc', preco: '7.50', categoria: 'lanches', tags: ['quente'], imagem: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' },
];

async function main() {
  const db = await createDb();
  logger.info('Seeding items...');
  const rows = SEED_ITEMS.map(s => ({ id: createId(), ...s }));
  await db.insert(items).values(rows).onConflictDoNothing();
  logger.info(`Inserted ${rows.length} items ✅`);
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
```

(Os `nameKey`/`descricaoKey` referenciam o sistema i18n existente. Se os keys reais no `apps/mobile/data/cardapio.ts` forem diferentes, ajustar pra bater. Validar manualmente.)

- [ ] **Step 2.1: Confirmar keys do cardápio atual**

Comparar SEED_ITEMS com `apps/mobile/data/cardapio.ts`. Se divergir, alinhar pros keys reais. Esta é a única dependência cross-package nessa task.

- [ ] **Step 3: Rodar seed**

```powershell
pnpm api:db:seed
```

Expected: `Inserted 12 items ✅`.

- [ ] **Step 4: Verificar com drizzle studio (opcional)**

```powershell
pnpm api:db:studio
```

Expected: abre browser em `https://local.drizzle.studio` com tabela `items` populada.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/db/seed.ts
git commit -m "feat(api): seed inicial com 12 itens (referencia keys i18n existentes)"
```

---

## Phase 3 — Shared schemas + auth (Zod, argon2, JWT)

### Task 3.1: Shared Zod schemas + types

**Files:**
- Create: `packages/shared/src/schemas/auth.ts`
- Create: `packages/shared/src/schemas/user.ts`
- Create: `packages/shared/src/schemas/item.ts`
- Create: `packages/shared/src/schemas/order.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Criar `packages/shared/src/schemas/auth.ts`**

```ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'auth.register.name_too_short').max(80, 'auth.register.name_too_long'),
  email: z.string().trim().toLowerCase().email('auth.register.email_invalid'),
  password: z.string().min(6, 'auth.register.password_too_short').max(128, 'auth.register.password_too_long'),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('auth.login.email_invalid'),
  password: z.string().min(1, 'auth.login.password_required'),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    locale: z.string(),
    role: z.enum(['customer', 'staff']),
    createdAt: z.string(),
  }),
  token: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
```

- [ ] **Step 2: Criar `packages/shared/src/schemas/user.ts`**

```ts
import { z } from 'zod';

export const PublicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  locale: z.string(),
  role: z.enum(['customer', 'staff']),
  createdAt: z.string(),
});

export type PublicUser = z.infer<typeof PublicUserSchema>;
```

- [ ] **Step 3: Criar `packages/shared/src/schemas/item.ts`**

```ts
import { z } from 'zod';

export const CategoriaSchema = z.enum(['lanches', 'bebidas', 'sobremesas']);
export type Categoria = z.infer<typeof CategoriaSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameKey: z.string(),
  descricaoKey: z.string(),
  preco: z.string(),
  categoria: CategoriaSchema,
  tags: z.array(z.string()),
  imagem: z.string().nullable(),
  disponivel: z.boolean(),
});

export type Item = z.infer<typeof ItemSchema>;

export const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema),
});
```

- [ ] **Step 4: Criar `packages/shared/src/schemas/order.ts`**

```ts
import { z } from 'zod';

export const OrderStatusSchema = z.enum(['pendente', 'pronto', 'retirado', 'cancelado']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  nameSnapshot: z.string(),
  precoSnapshot: z.string(),
  quantidade: z.number().int().positive(),
  observacoes: z.string().nullable(),
});

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  total: z.string(),
  senha: z.number().int(),
  prontoEmEstimado: z.string().nullable(),
  prontoEm: z.string().nullable(),
  retiradoEm: z.string().nullable(),
  canceladoEm: z.string().nullable(),
  criadoEm: z.string(),
  itens: z.array(OrderItemSchema),
});

export const CreateOrderSchema = z.object({
  itens: z.array(z.object({
    itemId: z.string().min(1),
    quantidade: z.number().int().positive().max(99),
    observacoes: z.string().max(200).optional(),
  })).min(1, 'order.create.empty_cart'),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.literal('cancelado'),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItemDto = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
```

- [ ] **Step 5: Atualizar `packages/shared/src/schemas/index.ts`**

```ts
export * from './auth.js';
export * from './user.js';
export * from './item.js';
export * from './order.js';
```

- [ ] **Step 6: Atualizar `packages/shared/src/types/index.ts`**

```ts
export type { PublicUser } from '../schemas/user.js';
export type { Item, Categoria } from '../schemas/item.js';
export type { Order, OrderStatus, OrderItemDto, CreateOrderInput } from '../schemas/order.js';
export type { RegisterInput, LoginInput, AuthResponse } from '../schemas/auth.js';
```

- [ ] **Step 7: Validar via teste**

Criar `packages/shared/src/schemas/auth.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema } from './auth.js';

describe('RegisterSchema', () => {
  it('aceita input valido', () => {
    const result = RegisterSchema.safeParse({ name: 'João', email: 'JOAO@FIAP.COM.BR ', password: '123456' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('joao@fiap.com.br'); // trim+lowercase
      expect(result.data.name).toBe('João');
    }
  });

  it('rejeita nome curto', () => {
    const result = RegisterSchema.safeParse({ name: 'J', email: 'a@b.com', password: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('auth.register.name_too_short');
    }
  });

  it('rejeita email invalido', () => {
    const result = RegisterSchema.safeParse({ name: 'João', email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha curta', () => {
    const result = RegisterSchema.safeParse({ name: 'João', email: 'a@b.com', password: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('aceita email + senha minimal', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejeita senha vazia', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 8: Rodar teste — esperado passar**

```powershell
pnpm --filter @cantina/shared test
```

Expected: `8 passed`. Se falhar, ajustar mensagens de erro nos schemas pra bater.

- [ ] **Step 9: Commit**

```powershell
git add packages/shared/
git commit -m "feat(shared): zod schemas (auth, user, item, order) + tipos derivados + testes"
```

### Task 3.2: API — argon2 + JWT helpers (com testes)

**Files:**
- Create: `apps/api/src/lib/password.ts`
- Create: `apps/api/src/lib/password.test.ts`
- Create: `apps/api/src/lib/jwt.ts`
- Create: `apps/api/src/lib/jwt.test.ts`
- Create: `apps/api/src/lib/errors.ts`

- [ ] **Step 1: Criar `apps/api/src/lib/errors.ts`**

```ts
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL';

export class HTTPError extends Error {
  status: number;
  code: ErrorCode;
  details?: unknown;
  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const conflict = (msg: string, details?: unknown) => new HTTPError(409, 'CONFLICT', msg, details);
export const unauthorized = (msg = 'Unauthorized') => new HTTPError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = 'Forbidden') => new HTTPError(403, 'FORBIDDEN', msg);
export const notFound = (msg = 'Not found') => new HTTPError(404, 'NOT_FOUND', msg);
export const badRequest = (msg: string, details?: unknown) => new HTTPError(400, 'BAD_REQUEST', msg, details);
export const validationError = (details: unknown) => new HTTPError(422, 'VALIDATION_ERROR', 'Validation failed', details);
```

- [ ] **Step 2: Criar `apps/api/src/lib/password.test.ts` (RED)**

```ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('hashes uma senha e verifica corretamente', async () => {
    const hash = await hashPassword('s3nha-forte');
    expect(hash).not.toBe('s3nha-forte');
    expect(hash.length).toBeGreaterThan(50);
    expect(await verifyPassword('s3nha-forte', hash)).toBe(true);
  });

  it('falha em senha errada', async () => {
    const hash = await hashPassword('correta');
    expect(await verifyPassword('errada', hash)).toBe(false);
  });

  it('hashes diferentes pra mesma senha (salt random)', async () => {
    const a = await hashPassword('mesma');
    const b = await hashPassword('mesma');
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 3: Rodar teste — esperado falhar**

```powershell
pnpm --filter @cantina/api test password
```

Expected: FAIL — `password.ts` not found.

- [ ] **Step 4: Criar `apps/api/src/lib/password.ts` (GREEN)**

```ts
import { hash, verify } from '@node-rs/argon2';

const ARGON2_OPTS = {
  memoryCost: 19456, // 19 MiB — OWASP 2024 recommendation
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(plain: string, hashStr: string): Promise<boolean> {
  try {
    return await verify(hashStr, plain);
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Rodar teste — esperado passar**

```powershell
pnpm --filter @cantina/api test password
```

Expected: `3 passed`.

- [ ] **Step 6: Criar `apps/api/src/lib/jwt.test.ts` (RED)**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { signJwt, verifyJwt, type JwtPayload } from './jwt.js';

const PAYLOAD: JwtPayload = {
  sub: 'user_abc123',
  email: 'a@b.com',
  role: 'customer',
  locale: 'pt',
};

describe('jwt', () => {
  it('assina e verifica payload', async () => {
    const token = await signJwt(PAYLOAD);
    expect(token.split('.')).toHaveLength(3); // header.payload.signature

    const verified = await verifyJwt(token);
    expect(verified.sub).toBe('user_abc123');
    expect(verified.email).toBe('a@b.com');
    expect(verified.role).toBe('customer');
    expect(verified.locale).toBe('pt');
  });

  it('rejeita token adulterado', async () => {
    const token = await signJwt(PAYLOAD);
    const tampered = token.slice(0, -2) + 'XX';
    await expect(verifyJwt(tampered)).rejects.toThrow();
  });

  it('rejeita token vazio', async () => {
    await expect(verifyJwt('')).rejects.toThrow();
  });
});
```

- [ ] **Step 7: Rodar teste — esperado falhar**

```powershell
pnpm --filter @cantina/api test jwt
```

Expected: FAIL — `jwt.ts` not found.

- [ ] **Step 8: Criar `apps/api/src/lib/jwt.ts` (GREEN)**

```ts
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'staff';
  locale: string;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setSubject(payload.sub)
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .setIssuer('cantina-api')
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer: 'cantina-api' });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as 'customer' | 'staff',
    locale: payload.locale as string,
  };
}
```

- [ ] **Step 9: Rodar teste — esperado passar**

```powershell
pnpm --filter @cantina/api test jwt
```

Expected: `3 passed`.

- [ ] **Step 10: Commit**

```powershell
git add apps/api/src/lib/
git commit -m "feat(api): password (argon2) + jwt (jose HS256) helpers com testes"
```

### Task 3.3: Auth middleware

**Files:**
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/middleware/error-handler.ts`
- Modify: `apps/api/src/app.ts` (registrar error-handler)

- [ ] **Step 1: Criar `apps/api/src/middleware/auth.ts`**

```ts
import type { MiddlewareHandler } from 'hono';
import { verifyJwt, type JwtPayload } from '../lib/jwt.js';
import { unauthorized } from '../lib/errors.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw unauthorized('Missing Bearer token');
  }
  const token = auth.slice(7).trim();
  if (!token) throw unauthorized('Empty token');
  try {
    const payload = await verifyJwt(token);
    c.set('user', payload);
    await next();
  } catch {
    throw unauthorized('Invalid token');
  }
};
```

- [ ] **Step 2: Criar `apps/api/src/middleware/error-handler.ts`**

```ts
import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { HTTPError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status as 400);
  }
  if (err instanceof ZodError) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.flatten() } }, 422);
  }
  logger.error({ err }, 'Unhandled error');
  return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500);
};
```

- [ ] **Step 3: Atualizar `apps/api/src/app.ts` pra usar errorHandler**

Substituir o `app.onError(...)` inline pelo handler centralizado:

```ts
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
```

- [ ] **Step 4: Verificar typecheck**

```powershell
pnpm --filter @cantina/api typecheck
```

Expected: 0 erros.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/middleware/ apps/api/src/app.ts
git commit -m "feat(api): middleware auth (Bearer JWT) + error-handler centralizado"
```

### Task 3.4: Test fixtures (DB efêmero por teste)

**Files:**
- Create: `apps/api/src/test/db.ts`
- Create: `apps/api/src/test/fixtures.ts`

- [ ] **Step 1: Criar `apps/api/src/test/db.ts`**

```ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../db/schema.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

export async function createTestDb(): Promise<{ db: TestDb; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return {
    db,
    close: async () => { await client.close(); },
  };
}
```

- [ ] **Step 2: Criar `apps/api/src/test/fixtures.ts`**

```ts
import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';
import { users, items } from '../db/schema.js';
import type { TestDb } from './db.js';

export async function createTestUser(
  db: TestDb,
  overrides: Partial<{ email: string; name: string; password: string; role: 'customer' | 'staff' }> = {},
) {
  const id = createId();
  const password = overrides.password ?? 'senha-teste';
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    id,
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `${id}@test.com`,
    passwordHash,
    role: overrides.role ?? 'customer',
    locale: 'pt',
  }).returning();
  if (!user) throw new Error('failed to create user');
  const token = await signJwt({ sub: user.id, email: user.email, role: user.role as 'customer' | 'staff', locale: user.locale });
  return { user, password, token };
}

export async function createTestItem(db: TestDb, overrides: Partial<typeof items.$inferInsert> = {}) {
  const id = createId();
  const [item] = await db.insert(items).values({
    id,
    slug: overrides.slug ?? `slug-${id.slice(0, 6)}`,
    nameKey: overrides.nameKey ?? 'item.test.nome',
    descricaoKey: overrides.descricaoKey ?? 'item.test.desc',
    preco: overrides.preco ?? '10.00',
    categoria: overrides.categoria ?? 'lanches',
    tags: overrides.tags ?? [],
    imagem: overrides.imagem ?? null,
    disponivel: overrides.disponivel ?? true,
    ...overrides,
  }).returning();
  if (!item) throw new Error('failed to create item');
  return item;
}
```

- [ ] **Step 3: Commit**

```powershell
git add apps/api/src/test/
git commit -m "test(api): fixtures (createTestDb pglite, createTestUser, createTestItem)"
```

---

## Phase 4 — Auth endpoints (register, login, me)

### Task 4.1: POST /auth/register (TDD completo)

**Files:**
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/routes/auth.test.ts`
- Modify: `apps/api/src/app.ts` (mount auth routes)

- [ ] **Step 1: Criar `apps/api/src/routes/auth.test.ts` com primeiros testes (RED)**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDb } from '../test/db.js';
import { createAuthRoutes } from './auth.js';
import { Hono } from 'hono';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;

beforeEach(async () => {
  const fixture = await createTestDb();
  testDb = fixture.db;
  close = fixture.close;
  app = new Hono();
  app.route('/api/v1/auth', createAuthRoutes(testDb));
  app.onError(errorHandler);
});

afterEach(async () => { await close(); });

const VALID = { name: 'João', email: 'joao@fiap.com', password: '123456' };

describe('POST /auth/register', () => {
  it('cria usuário e retorna user + token', async () => {
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { user: { email: string; name: string }; token: string };
    expect(json.user.email).toBe('joao@fiap.com');
    expect(json.user.name).toBe('João');
    expect(json.token).toMatch(/^eyJ/); // JWT
    expect((json as any).user.passwordHash).toBeUndefined(); // não vaza hash
  });

  it('rejeita email duplicado com 409', async () => {
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    const res = await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    expect(res.status).toBe(409);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe('CONFLICT');
  });

  it('rejeita payload invalido com 422', async () => {
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', email: 'not-email', password: '1' }),
    });
    expect(res.status).toBe(422);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});
```

- [ ] **Step 2: Rodar — esperado falhar (auth.ts não existe)**

```powershell
pnpm --filter @cantina/api test auth
```

Expected: FAIL — `Cannot find module './auth.js'`.

- [ ] **Step 3: Criar `apps/api/src/routes/auth.ts` (GREEN — só register)**

```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { RegisterSchema, LoginSchema } from '@cantina/shared';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { users } from '../db/schema.js';
import type { TestDb } from '../test/db.js';
import type { DB } from '../db/client.js';

function toPublicUser(u: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = u;
  return {
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
  };
}

export function createAuthRoutes(db: DB | TestDb) {
  const app = new Hono();

  app.post('/register', zValidator('json', RegisterSchema), async (c) => {
    const { name, email, password } = c.req.valid('json');

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw conflict('Email já cadastrado');

    const passwordHash = await hashPassword(password);
    const id = createId();
    const [user] = await db.insert(users).values({ id, name, email, passwordHash, locale: 'pt' }).returning();
    if (!user) throw new Error('failed to create user');

    const token = await signJwt({ sub: user.id, email: user.email, role: user.role as 'customer' | 'staff', locale: user.locale });
    return c.json({ user: toPublicUser(user), token }, 201);
  });

  return app;
}
```

- [ ] **Step 4: Rodar — esperado passar register, login não existe ainda**

```powershell
pnpm --filter @cantina/api test auth
```

Expected: `3 passed` para os 3 testes de register.

- [ ] **Step 5: Adicionar testes de login no `auth.test.ts`**

Append:

```ts
describe('POST /auth/login', () => {
  it('autentica com credenciais corretas', async () => {
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VALID.email, password: VALID.password }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { email: string }; token: string };
    expect(json.user.email).toBe(VALID.email);
    expect(json.token).toMatch(/^eyJ/);
  });

  it('rejeita senha errada com 401', async () => {
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VALID.email, password: 'errada' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejeita email não cadastrado com 401', async () => {
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nao-existe@x.com', password: 'qualquer' }),
    });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 6: Rodar — login deve falhar (rota não existe)**

```powershell
pnpm --filter @cantina/api test auth
```

Expected: 3 testes de login FALHAM com 404.

- [ ] **Step 7: Adicionar `/login` ao `auth.ts`**

Antes do `return app;`:

```ts
  app.post('/login', zValidator('json', LoginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw unauthorized('Credenciais inválidas');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized('Credenciais inválidas');
    const token = await signJwt({ sub: user.id, email: user.email, role: user.role as 'customer' | 'staff', locale: user.locale });
    return c.json({ user: toPublicUser(user), token }, 200);
  });
```

- [ ] **Step 8: Rodar — todos passam**

```powershell
pnpm --filter @cantina/api test auth
```

Expected: `6 passed`.

- [ ] **Step 9: Adicionar testes de `/auth/me`**

Append em `auth.test.ts`:

```ts
import { createTestUser } from '../test/fixtures.js';

describe('GET /auth/me', () => {
  it('retorna usuario autenticado', async () => {
    const { user, token } = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { email: string } };
    expect(json.user.email).toBe(user.email);
  });

  it('rejeita sem token com 401', async () => {
    const res = await app.request('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejeita token invalido com 401', async () => {
    const res = await app.request('/api/v1/auth/me', { headers: { Authorization: 'Bearer trash' } });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 10: Adicionar `/me` em `auth.ts`**

```ts
import { requireAuth } from '../middleware/auth.js';
// ...
  app.get('/me', requireAuth, async (c) => {
    const claim = c.get('user');
    const [user] = await db.select().from(users).where(eq(users.id, claim.sub)).limit(1);
    if (!user) throw unauthorized('User not found');
    return c.json({ user: toPublicUser(user) }, 200);
  });
```

- [ ] **Step 11: Rodar todos**

```powershell
pnpm --filter @cantina/api test
```

Expected: `9 passed`.

- [ ] **Step 12: Mount auth routes em `app.ts`**

Editar `apps/api/src/app.ts` — adicionar dependency injection do db. Refatorar `createApp` pra aceitar db opcional:

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { allowedOrigins, env } from './env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRoutes } from './routes/auth.js';
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

  app.route('/api/v1/auth', createAuthRoutes(db));

  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));
  app.onError(errorHandler);

  return app;
}
```

Atualizar `apps/api/src/index.ts` pra `await createApp()`:

```ts
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';

const app = await createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`🌶️  Hono running on http://localhost:${info.port} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

- [ ] **Step 13: Smoke test end-to-end**

```powershell
$env:USE_PGLITE="true"
$env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm api:dev
```

Em outro terminal:

```powershell
curl -X POST http://localhost:8787/api/v1/auth/register -H "Content-Type: application/json" -d '{\"name\":\"Joao\",\"email\":\"j@x.com\",\"password\":\"123456\"}'
```

Expected: HTTP 201 com `{ "user": {...}, "token": "eyJ..." }`.

- [ ] **Step 14: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): rotas /auth/register, /auth/login, /auth/me com testes (TDD)"
```

---

## Phase 5 — Items + Orders + Favorites endpoints

### Task 5.1: Items endpoints

**Files:**
- Create: `apps/api/src/routes/items.ts`
- Create: `apps/api/src/routes/items.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Criar `apps/api/src/routes/items.test.ts` (RED)**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createItemsRoutes } from './items.js';
import { createTestItem, createTestUser } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb; let close: () => Promise<void>; let app: Hono; let token: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/items', createItemsRoutes(testDb));
  app.onError(errorHandler);
  const u = await createTestUser(testDb);
  token = u.token;
});

afterEach(async () => { await close(); });

describe('GET /items', () => {
  it('lista itens disponiveis', async () => {
    await createTestItem(testDb, { slug: 'a' });
    await createTestItem(testDb, { slug: 'b' });
    await createTestItem(testDb, { slug: 'c', disponivel: false });

    const res = await app.request('/api/v1/items', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const json = await res.json() as { items: Array<{ slug: string; disponivel: boolean }> };
    expect(json.items).toHaveLength(2); // só os 2 disponíveis
    expect(json.items.every(i => i.disponivel)).toBe(true);
  });

  it('filtra por categoria', async () => {
    await createTestItem(testDb, { slug: 'a', categoria: 'lanches' });
    await createTestItem(testDb, { slug: 'b', categoria: 'bebidas' });

    const res = await app.request('/api/v1/items?categoria=bebidas', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json() as { items: Array<{ slug: string }> };
    expect(json.items).toHaveLength(1);
    expect(json.items[0]?.slug).toBe('b');
  });

  it('rejeita sem auth', async () => {
    const res = await app.request('/api/v1/items');
    expect(res.status).toBe(401);
  });
});

describe('GET /items/:id', () => {
  it('retorna item por id', async () => {
    const item = await createTestItem(testDb, { slug: 'x' });
    const res = await app.request(`/api/v1/items/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const json = await res.json() as { item: { slug: string } };
    expect(json.item.slug).toBe('x');
  });

  it('404 quando nao existe', async () => {
    const res = await app.request('/api/v1/items/nope', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Rodar — esperado falhar**

```powershell
pnpm --filter @cantina/api test items
```

Expected: FAIL — items.ts not found.

- [ ] **Step 3: Criar `apps/api/src/routes/items.ts` (GREEN)**

```ts
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createItemsRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const categoria = c.req.query('categoria');
    const conditions = [eq(items.disponivel, true)];
    if (categoria) conditions.push(eq(items.categoria, categoria));
    const list = await db.select().from(items).where(and(...conditions));
    return c.json({ items: list }, 200);
  });

  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!item) throw notFound('Item not found');
    return c.json({ item }, 200);
  });

  return app;
}
```

- [ ] **Step 4: Rodar — esperado passar**

```powershell
pnpm --filter @cantina/api test items
```

Expected: `5 passed`.

- [ ] **Step 5: Mount em `app.ts`**

Adicionar import e route:

```ts
import { createItemsRoutes } from './routes/items.js';
// ...
  app.route('/api/v1/items', createItemsRoutes(db));
```

- [ ] **Step 6: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): rotas /items (list + get) com filtro por categoria"
```

### Task 5.2: Orders endpoints (POST/GET/PATCH)

**Files:**
- Create: `apps/api/src/routes/orders.ts`
- Create: `apps/api/src/routes/orders.test.ts`
- Create: `apps/api/src/lib/estimativa.ts` (espelha `apps/mobile/lib/estimativa.ts`)
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Criar `apps/api/src/lib/estimativa.ts`**

```ts
const BASE_SECONDS = 90;
const PER_PENDING_SECONDS = 60;
const CAP_SECONDS = 600;

export function calcularEstimativa(pendingCount: number): number {
  return Math.min(BASE_SECONDS + pendingCount * PER_PENDING_SECONDS, CAP_SECONDS);
}
```

- [ ] **Step 2: Criar `apps/api/src/routes/orders.test.ts` (RED — happy path primeiro)**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createOrdersRoutes } from './orders.js';
import { createTestUser, createTestItem } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb; let close: () => Promise<void>; let app: Hono; let token: string; let userId: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/orders', createOrdersRoutes(testDb));
  app.onError(errorHandler);
  const u = await createTestUser(testDb);
  token = u.token;
  userId = u.user.id;
});

afterEach(async () => { await close(); });

describe('POST /orders', () => {
  it('cria pedido com itens e calcula total', async () => {
    const a = await createTestItem(testDb, { preco: '10.00' });
    const b = await createTestItem(testDb, { preco: '5.50' });

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: [
        { itemId: a.id, quantidade: 2 },
        { itemId: b.id, quantidade: 1, observacoes: 'sem cebola' },
      ]}),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { order: { status: string; total: string; itens: Array<{ quantidade: number; observacoes: string | null }>; senha: number } };
    expect(json.order.status).toBe('pendente');
    expect(parseFloat(json.order.total)).toBe(25.50);
    expect(json.order.itens).toHaveLength(2);
    expect(json.order.senha).toBeGreaterThan(0);
  });

  it('rejeita item inexistente com 422', async () => {
    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: [{ itemId: 'nope', quantidade: 1 }] }),
    });
    expect([404, 422]).toContain(res.status);
  });

  it('rejeita carrinho vazio', async () => {
    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: [] }),
    });
    expect(res.status).toBe(422);
  });
});

describe('GET /orders', () => {
  it('lista apenas pedidos do usuario', async () => {
    const item = await createTestItem(testDb);
    await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });

    const res = await app.request('/api/v1/orders', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const json = await res.json() as { orders: Array<{ userId: string }> };
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0]?.userId).toBe(userId);
  });
});

describe('GET /orders/:id', () => {
  it('retorna pedido com itens', async () => {
    const item = await createTestItem(testDb);
    const create = await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });
    const created = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${created.order.id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
  });

  it('404 pra pedido de outro usuario', async () => {
    const item = await createTestItem(testDb);
    const create = await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });
    const created = await create.json() as { order: { id: string } };

    const other = await createTestUser(testDb, { email: 'other@x.com' });
    const res = await app.request(`/api/v1/orders/${created.order.id}`, { headers: { Authorization: `Bearer ${other.token}` } });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /orders/:id/status', () => {
  it('cliente cancela pedido pendente', async () => {
    const item = await createTestItem(testDb);
    const create = await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });
    const created = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${created.order.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'cancelado' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { order: { status: string; canceladoEm: string | null } };
    expect(json.order.status).toBe('cancelado');
    expect(json.order.canceladoEm).toBeTruthy();
  });
});
```

- [ ] **Step 3: Rodar — esperado falhar**

```powershell
pnpm --filter @cantina/api test orders
```

Expected: FAIL — orders.ts not found.

- [ ] **Step 4: Criar `apps/api/src/routes/orders.ts` (GREEN)**

```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { CreateOrderSchema, UpdateOrderStatusSchema } from '@cantina/shared';
import { orders, orderItems, items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, badRequest } from '../lib/errors.js';
import { calcularEstimativa } from '../lib/estimativa.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

async function nextSenha(db: DB | TestDb, tenantId: string | null): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(and(
      tenantId ? eq(orders.tenantId, tenantId) : sql`${orders.tenantId} IS NULL`,
      gte(orders.criadoEm, startOfDay),
    ));
  return (Number(result[0]?.count ?? 0)) + 1;
}

async function fetchOrderWithItems(db: DB | TestDb, orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  const itens = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return {
    ...order,
    criadoEm: order.criadoEm.toISOString(),
    prontoEmEstimado: order.prontoEmEstimado?.toISOString() ?? null,
    prontoEm: order.prontoEm?.toISOString() ?? null,
    retiradoEm: order.retiradoEm?.toISOString() ?? null,
    canceladoEm: order.canceladoEm?.toISOString() ?? null,
    itens,
  };
}

export function createOrdersRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const claim = c.get('user');
    const list = await db.select().from(orders).where(eq(orders.userId, claim.sub)).orderBy(desc(orders.criadoEm));
    const enriched = await Promise.all(list.map(o => fetchOrderWithItems(db, o.id)));
    return c.json({ orders: enriched.filter(Boolean) }, 200);
  });

  app.get('/:id', async (c) => {
    const claim = c.get('user');
    const id = c.req.param('id');
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || order.userId !== claim.sub) throw notFound('Order not found');
    const enriched = await fetchOrderWithItems(db, id);
    return c.json({ order: enriched }, 200);
  });

  app.post('/', zValidator('json', CreateOrderSchema), async (c) => {
    const claim = c.get('user');
    const { itens } = c.req.valid('json');

    const itemIds = itens.map(i => i.itemId);
    const dbItems = await db.select().from(items).where(sql`${items.id} = ANY(${itemIds})`);
    if (dbItems.length !== new Set(itemIds).size) throw notFound('Item(s) not found');

    const itemMap = new Map(dbItems.map(i => [i.id, i]));
    let total = 0;
    const orderItemRows: typeof orderItems.$inferInsert[] = [];
    const orderId = createId();

    for (const reqItem of itens) {
      const item = itemMap.get(reqItem.itemId);
      if (!item) throw notFound('Item not found');
      if (!item.disponivel) throw badRequest(`Item indisponivel: ${item.slug}`);
      const subtotal = parseFloat(item.preco) * reqItem.quantidade;
      total += subtotal;
      orderItemRows.push({
        id: createId(),
        orderId,
        itemId: item.id,
        nameSnapshot: item.nameKey,
        precoSnapshot: item.preco,
        quantidade: reqItem.quantidade,
        observacoes: reqItem.observacoes ?? null,
      });
    }

    // count pendentes pra estimativa
    const pendingResult = await db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(eq(orders.status, 'pendente'));
    const pendingCount = Number(pendingResult[0]?.count ?? 0);
    const estimadoSec = calcularEstimativa(pendingCount);
    const prontoEmEstimado = new Date(Date.now() + estimadoSec * 1000);

    const senha = await nextSenha(db, null);

    await db.insert(orders).values({
      id: orderId,
      userId: claim.sub,
      status: 'pendente',
      total: total.toFixed(2),
      senha,
      prontoEmEstimado,
    });
    await db.insert(orderItems).values(orderItemRows);

    const enriched = await fetchOrderWithItems(db, orderId);
    return c.json({ order: enriched }, 201);
  });

  app.patch('/:id/status', zValidator('json', UpdateOrderStatusSchema), async (c) => {
    const claim = c.get('user');
    const id = c.req.param('id');
    const { status } = c.req.valid('json');

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || order.userId !== claim.sub) throw notFound('Order not found');
    if (order.status !== 'pendente') throw badRequest('Só pedidos pendentes podem ser cancelados');

    await db.update(orders).set({ status, canceladoEm: new Date() }).where(eq(orders.id, id));
    const enriched = await fetchOrderWithItems(db, id);
    return c.json({ order: enriched }, 200);
  });

  return app;
}
```

- [ ] **Step 5: Rodar — esperado passar**

```powershell
pnpm --filter @cantina/api test orders
```

Expected: `6 passed`.

- [ ] **Step 6: Mount em `app.ts`**

```ts
import { createOrdersRoutes } from './routes/orders.js';
// ...
  app.route('/api/v1/orders', createOrdersRoutes(db));
```

- [ ] **Step 7: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): rotas /orders (list/get/create/cancel) com senha sequencial e estimativa"
```

### Task 5.3: Auto-promote pendente→pronto job

**Files:**
- Create: `apps/api/src/jobs/promote-orders.ts`
- Modify: `apps/api/src/index.ts` (start job)

- [ ] **Step 1: Criar `apps/api/src/jobs/promote-orders.ts`**

```ts
import { eq, and, lte } from 'drizzle-orm';
import type { DB } from '../db/client.js';
import { orders } from '../db/schema.js';
import { logger } from '../lib/logger.js';

const POLL_INTERVAL_MS = 30_000;

export function startPromoteJob(db: DB) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await db
        .update(orders)
        .set({ status: 'pronto', prontoEm: new Date() })
        .where(and(
          eq(orders.status, 'pendente'),
          lte(orders.prontoEmEstimado, new Date()),
        ))
        .returning({ id: orders.id });
      if (result.length > 0) {
        logger.info({ promoted: result.length }, 'orders auto-promoted to pronto');
      }
    } catch (err) {
      logger.error({ err }, 'promote-orders tick failed');
    } finally {
      running = false;
    }
  };

  const interval = setInterval(tick, POLL_INTERVAL_MS);
  void tick();
  return () => clearInterval(interval);
}
```

- [ ] **Step 2: Wire em `apps/api/src/index.ts`**

```ts
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { getDb } from './db/client.js';
import { startPromoteJob } from './jobs/promote-orders.js';

const db = await getDb();
const app = await createApp({ db });
const stopJob = startPromoteJob(db as Parameters<typeof startPromoteJob>[0]);

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
```

- [ ] **Step 3: Smoke test manual**

Subir API com `pnpm api:dev`. Criar pedido via curl. Esperar ~2min (estimativa min: 90s). Consultar pedido — deve estar `pronto`.

- [ ] **Step 4: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): job auto-promote pedidos pendente->pronto via prontoEmEstimado"
```

### Task 5.4: Favorites endpoints

**Files:**
- Create: `apps/api/src/routes/favorites.ts`
- Create: `apps/api/src/routes/favorites.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Criar `apps/api/src/routes/favorites.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createFavoritesRoutes } from './favorites.js';
import { createTestUser, createTestItem } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb; let close: () => Promise<void>; let app: Hono; let token: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/favorites', createFavoritesRoutes(testDb));
  app.onError(errorHandler);
  const u = await createTestUser(testDb);
  token = u.token;
});

afterEach(async () => { await close(); });

describe('Favorites', () => {
  it('add + list + remove', async () => {
    const item = await createTestItem(testDb);

    let res = await app.request(`/api/v1/favorites/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(204);

    res = await app.request('/api/v1/favorites', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const list = await res.json() as { items: Array<{ id: string }> };
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.id).toBe(item.id);

    res = await app.request(`/api/v1/favorites/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(204);

    res = await app.request('/api/v1/favorites', { headers: { Authorization: `Bearer ${token}` } });
    const empty = await res.json() as { items: unknown[] };
    expect(empty.items).toHaveLength(0);
  });

  it('add idempotente', async () => {
    const item = await createTestItem(testDb);
    await app.request(`/api/v1/favorites/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const res = await app.request(`/api/v1/favorites/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Criar `apps/api/src/routes/favorites.ts`**

```ts
import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { favorites, items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createFavoritesRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const claim = c.get('user');
    const favs = await db.select({ itemId: favorites.itemId }).from(favorites).where(eq(favorites.userId, claim.sub));
    if (favs.length === 0) return c.json({ items: [] }, 200);
    const list = await db.select().from(items).where(inArray(items.id, favs.map(f => f.itemId)));
    return c.json({ items: list }, 200);
  });

  app.post('/:itemId', async (c) => {
    const claim = c.get('user');
    const itemId = c.req.param('itemId');
    await db.insert(favorites)
      .values({ userId: claim.sub, itemId })
      .onConflictDoNothing();
    return c.body(null, 204);
  });

  app.delete('/:itemId', async (c) => {
    const claim = c.get('user');
    const itemId = c.req.param('itemId');
    await db.delete(favorites).where(and(eq(favorites.userId, claim.sub), eq(favorites.itemId, itemId)));
    return c.body(null, 204);
  });

  return app;
}
```

- [ ] **Step 3: Mount + run tests**

`apps/api/src/app.ts`:
```ts
import { createFavoritesRoutes } from './routes/favorites.js';
// ...
  app.route('/api/v1/favorites', createFavoritesRoutes(db));
```

```powershell
pnpm --filter @cantina/api test
```

Expected: todos os testes passam (auth: 9, items: 5, orders: 6, favorites: 2 = 22).

- [ ] **Step 4: Commit**

```powershell
git add apps/api/
git commit -m "feat(api): rotas /favorites (list/add/remove) idempotentes"
```

---

## Phase 6 — Mobile API client + React Query + AuthContext rewrite

### Task 6.1: Instalar React Query + persistor + criar API client

**Files:**
- Modify: `apps/mobile/package.json` (deps)
- Create: `apps/mobile/lib/api/client.ts`
- Create: `apps/mobile/lib/api/query-client.tsx`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Adicionar deps**

```powershell
pnpm --filter @cantina/mobile add @tanstack/react-query @tanstack/query-async-storage-persister @tanstack/react-query-persist-client @cantina/shared
```

- [ ] **Step 2: Criar `apps/mobile/lib/api/client.ts`**

```ts
import { getSecureItem } from '../secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
const API_BASE = `${API_URL}/api/v1`;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> ?? {}),
  };
  if (auth) {
    const token = await getSecureItem('auth_token');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = json?.error ?? { code: 'UNKNOWN', message: `HTTP ${res.status}` };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return json as T;
}
```

(Esta task assume `lib/secure-store.ts` exporta `getSecureItem` — confirmar e ajustar nome se necessário.)

- [ ] **Step 3: Criar `apps/mobile/lib/api/query-client.tsx`**

```tsx
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@cantina:rq-cache',
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}>
      {children}
    </PersistQueryClientProvider>
  );
}
```

- [ ] **Step 4: Wrappar `apps/mobile/app/_layout.tsx`**

Procurar onde `ThemeProvider` envolve o app. Adicionar `QueryProvider` por fora:

```tsx
import { QueryProvider } from '@/lib/api/query-client';
// ...
<QueryProvider>
  <ThemeProvider>
    {/* ... outros providers ... */}
  </ThemeProvider>
</QueryProvider>
```

- [ ] **Step 5: Verificar typecheck mobile**

```powershell
pnpm --filter @cantina/mobile typecheck
```

Expected: 0 erros.

- [ ] **Step 6: Commit**

```powershell
git add apps/mobile/
git commit -m "feat(mobile): React Query + AsyncStorage persister + lib/api/client"
```

### Task 6.2: AuthContext rewrite (delegando à API)

**Files:**
- Modify: `apps/mobile/context/AuthContext.tsx`
- Create: `apps/mobile/lib/api/auth.ts`
- Delete: `apps/mobile/lib/hash.ts` (deferido pra cleanup phase, comentar uso por agora)

- [ ] **Step 1: Criar `apps/mobile/lib/api/auth.ts`**

```ts
import { apiFetch } from './client';
import type { AuthResponse, LoginInput, RegisterInput, PublicUser } from '@cantina/shared';

export async function apiRegister(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false });
}

export async function apiLogin(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: input, auth: false });
}

export async function apiMe(): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/auth/me');
}
```

- [ ] **Step 2: Reescrever `AuthContext.tsx` mantendo a API publica idêntica**

Localizar exports atuais (`useAuth`, `AuthProvider`, etc.) — preservar nomes e shape. Substituir lógica interna:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiLogin, apiRegister, apiMe } from '@/lib/api/auth';
import { setSecureItem, getSecureItem, deleteSecureItem } from '@/lib/secure-store';
import { ApiError } from '@/lib/api/client';
import type { PublicUser, RegisterInput, LoginInput } from '@cantina/shared';

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getSecureItem('auth_token');
        if (token) {
          const { user } = await apiMe();
          setUser(user);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await deleteSecureItem('auth_token');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (input: LoginInput) => {
    const res = await apiLogin(input);
    await setSecureItem('auth_token', res.token);
    setUser(res.user);
  };

  const signUp = async (input: RegisterInput) => {
    const res = await apiRegister(input);
    await setSecureItem('auth_token', res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await deleteSecureItem('auth_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

(Confirmar nomes do `secure-store`: a API atual pode ser `setItem`/`getItem`/`deleteItem` — alinhar.)

- [ ] **Step 3: Atualizar telas que dependem do shape antigo**

`(auth)/login.tsx`, `(auth)/cadastro.tsx`, `perfil.tsx`, etc. — provavelmente já usam `useAuth().signIn(...)`. Se chamavam métodos diferentes (`login`, `register`), renomear pra `signIn`/`signUp` OU manter aliases nos exports.

Buscar ocorrências:

```powershell
pnpm --filter @cantina/mobile lint -- --rule "no-unused-vars:off"
# Ou grep manual:
```

Procurar `useAuth()` no diretório `apps/mobile/app/`.

- [ ] **Step 4: Smoke test**

Subir API + mobile:

```powershell
# Terminal 1
$env:USE_PGLITE="true"; $env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"; pnpm api:dev

# Terminal 2
pnpm mobile:start
```

Abrir no Expo Go ou web. Tentar:
1. Cadastro novo — sucesso
2. Logout
3. Login com mesmas credenciais — sucesso
4. Reabrir app — sessão persiste (via JWT em SecureStore)

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile/
git commit -m "feat(mobile): AuthContext consome API (/auth/*) com JWT em SecureStore"
```

---

## Phase 7 — Migrar Items, Orders, Favorites no mobile

### Task 7.1: useItems() + cardapio screen consome API

**Files:**
- Create: `apps/mobile/lib/api/items.ts`
- Create: `apps/mobile/lib/api/hooks/use-items.ts`
- Modify: `apps/mobile/app/(tabs)/cardapio.tsx`

- [ ] **Step 1: `apps/mobile/lib/api/items.ts`**

```ts
import { apiFetch } from './client';
import type { Item } from '@cantina/shared';

export async function listItems(filter?: { categoria?: string }): Promise<{ items: Item[] }> {
  const qs = filter?.categoria ? `?categoria=${encodeURIComponent(filter.categoria)}` : '';
  return apiFetch<{ items: Item[] }>(`/items${qs}`);
}
```

- [ ] **Step 2: `apps/mobile/lib/api/hooks/use-items.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { listItems } from '../items';

export function useItems(filter?: { categoria?: string }) {
  return useQuery({
    queryKey: ['items', filter ?? {}],
    queryFn: () => listItems(filter),
    staleTime: 1000 * 60 * 5,
  });
}
```

- [ ] **Step 3: Refatorar `apps/mobile/app/(tabs)/cardapio.tsx`**

Substituir importação de `data/cardapio.ts` por hook RQ. Mostrar Skeleton enquanto `isPending`, EmptyState em erro.

```tsx
// no topo:
import { useItems } from '@/lib/api/hooks/use-items';
// dentro do componente:
const { data, isPending, isError } = useItems({ categoria: selectedCategoria === 'todas' ? undefined : selectedCategoria });
const items = data?.items ?? [];
if (isPending) return <SkeletonList />;
if (isError) return <EmptyState ... />;
// renderizar items normalmente
```

(O componente real é maior — adaptar mantendo lógica de busca, chips, badge animado.)

- [ ] **Step 4: Smoke**

Subir api + mobile, navegar pro cardápio. Itens vêm da API (do seed).

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile/
git commit -m "feat(mobile): cardapio consome /items via React Query (data/cardapio fica como fallback)"
```

### Task 7.2: useOrders() + OrdersContext rewrite

**Files:**
- Create: `apps/mobile/lib/api/orders.ts`
- Create: `apps/mobile/lib/api/hooks/use-orders.ts`
- Modify: `apps/mobile/context/OrdersContext.tsx`

- [ ] **Step 1: `apps/mobile/lib/api/orders.ts`**

```ts
import { apiFetch } from './client';
import type { Order, CreateOrderInput, OrderStatus } from '@cantina/shared';

export async function listOrders(): Promise<{ orders: Order[] }> {
  return apiFetch<{ orders: Order[] }>('/orders');
}
export async function getOrder(id: string): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}`);
}
export async function createOrder(input: CreateOrderInput): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>('/orders', { method: 'POST', body: input });
}
export async function updateOrderStatus(id: string, status: 'cancelado'): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
}
```

- [ ] **Step 2: `apps/mobile/lib/api/hooks/use-orders.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOrders, createOrder, updateOrderStatus } from '../orders';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: listOrders,
    refetchInterval: 30_000, // poll pra pegar auto-promote
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'cancelado'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

- [ ] **Step 3: Reescrever `OrdersContext` como facade**

Manter `useOrders()` como hook exposto pelo context (compat). Internamente, delegar pro hook do RQ.

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useOrders as useOrdersQuery, useCreateOrder, useCancelOrder } from '@/lib/api/hooks/use-orders';
import type { Order, CreateOrderInput } from '@cantina/shared';

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  criarPedido: (input: CreateOrderInput) => Promise<Order>;
  cancelarPedido: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersState | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useOrdersQuery();
  const create = useCreateOrder();
  const cancel = useCancelOrder();

  const value: OrdersState = {
    orders: data?.orders ?? [],
    isLoading: isPending,
    criarPedido: async (input) => (await create.mutateAsync(input)).order,
    cancelarPedido: async (id) => { await cancel.mutateAsync(id); },
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrdersContext() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
// se exports antigos forem `useOrders`, exportar com aliasing:
export { useOrdersContext as useOrders };
```

(Confirmar nome real do export do context atual e preservar a API exata.)

- [ ] **Step 4: Smoke test**

- Criar pedido novo via Cardápio→Carrinho→Confirmar
- Ver pedido aparecer em /pedidos
- Esperar 90s → status muda pra `pronto` (via auto-promote + poll)
- Cancelar pedido pendente

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile/
git commit -m "feat(mobile): OrdersContext vira facade sobre React Query (/orders)"
```

### Task 7.3: useFavorites() + FavoritesContext rewrite

**Files:**
- Create: `apps/mobile/lib/api/favorites.ts`
- Create: `apps/mobile/lib/api/hooks/use-favorites.ts`
- Modify: `apps/mobile/context/FavoritesContext.tsx`

- [ ] **Step 1: `apps/mobile/lib/api/favorites.ts`**

```ts
import { apiFetch } from './client';
import type { Item } from '@cantina/shared';

export async function listFavorites(): Promise<{ items: Item[] }> {
  return apiFetch<{ items: Item[] }>('/favorites');
}
export async function addFavorite(itemId: string): Promise<void> {
  await apiFetch(`/favorites/${itemId}`, { method: 'POST' });
}
export async function removeFavorite(itemId: string): Promise<void> {
  await apiFetch(`/favorites/${itemId}`, { method: 'DELETE' });
}
```

- [ ] **Step 2: `apps/mobile/lib/api/hooks/use-favorites.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFavorites, addFavorite, removeFavorite } from '../favorites';
import type { Item } from '@cantina/shared';

export function useFavorites() {
  return useQuery({ queryKey: ['favorites'], queryFn: listFavorites });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, isFav }: { itemId: string; isFav: boolean }) => {
      if (isFav) await removeFavorite(itemId);
      else await addFavorite(itemId);
    },
    onMutate: async ({ itemId, isFav }) => {
      await qc.cancelQueries({ queryKey: ['favorites'] });
      const prev = qc.getQueryData<{ items: Item[] }>(['favorites']);
      qc.setQueryData<{ items: Item[] }>(['favorites'], (old) => {
        if (!old) return { items: [] };
        if (isFav) return { items: old.items.filter(i => i.id !== itemId) };
        // for add: we don't know full item — let server reconcile on success
        return old;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['favorites'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
```

- [ ] **Step 3: Reescrever `FavoritesContext` como facade**

Igual padrão do `OrdersContext` — preservar API publica.

- [ ] **Step 4: Commit**

```powershell
git add apps/mobile/
git commit -m "feat(mobile): FavoritesContext vira facade sobre React Query com optimistic toggle"
```

---

## Phase 8 — Dark mode B refresh

### Task 8.1: Atualizar tokens em theme.ts

**Files:**
- Modify: `apps/mobile/constants/theme.ts`

- [ ] **Step 1: Localizar bloco `darkTheme`/`darkColors` em `theme.ts`**

```powershell
# Confirmar que existe e qual o nome
```

- [ ] **Step 2: Substituir tokens dark pelo conjunto da direção B**

Aplicar (mantendo nome do objeto que já existe):

```ts
const darkColors = {
  bg:               '#08080B',
  bgElevated:       '#0B0B0E',
  surface:          '#111114',
  surfaceElevated:  '#18181C',
  surfaceHover:     '#1D1D22',
  border:           'rgba(255,255,255,0.06)',
  borderStrong:     'rgba(255,255,255,0.10)',
  divider:          'rgba(255,255,255,0.04)',
  separator:        'rgba(255,255,255,0.05)',

  text:             '#F2F2F5',
  textMuted:        '#A8A8B0',
  textSubtle:       '#6B6B72',
  textInverse:      '#08080B',

  primary:          '#6B6BE8',
  primarySoft:      'rgba(107,107,232,0.16)',
  primaryDeep:      '#5454C7',
  primaryContrast:  '#FFFFFF',

  success:          '#34D399',
  warning:          '#F59E0B',
  danger:           '#F87171',
  errorSoft:        'rgba(248,113,113,0.14)',

  // mantém aliases pra compat:
  card:             '#111114',
  cardElevated:     '#18181C',
};
```

(Se o objeto se chamar diferente — `theme.dark`, `palettes.dark` etc. — adaptar nome. Aliases `card` e `cardElevated` ficam pra não quebrar telas legadas.)

- [ ] **Step 3: Adicionar elevation system com highlight pra dark**

Localizar onde `shadow` é exportado em `theme.ts`. Atualizar pra escolher por tema. Se hoje há um único `shadow` com shadowColor, adicionar variante:

```ts
export const elevationLight = {
  sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  md: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  lg: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
};
export const elevationDark = {
  sm: { borderTopColor: 'rgba(255,255,255,0.04)', borderTopWidth: 1, shadowOpacity: 0 },
  md: { borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, shadowOpacity: 0 },
  lg: { borderTopColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1, shadowOpacity: 0 },
};
```

E expor via `useTheme()`:

```ts
const elevation = isDark ? elevationDark : elevationLight;
```

(Adaptar pra estrutura real do `ThemeContext` atual.)

- [ ] **Step 4: Smoke visual**

```powershell
pnpm mobile:start
```

Abrir 3 telas no dark mode: Home, Cardápio, Confirmação. Comparar lado a lado com pré-Foundation. Esperado: paleta visivelmente mais escura/neutra, sem perda de identidade catastrófica.

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile/constants/theme.ts
git commit -m "feat(mobile): dark mode direção B (neutro near-black) com elevation highlight"
```

### Task 8.2: Validar componentes com novos tokens

**Files:**
- (potencial) Modify: `apps/mobile/components/Button.tsx`, `Toast.tsx`, etc., onde shadow está hardcoded

- [ ] **Step 1: Grep por shadows hardcoded fora do theme**

```powershell
grep -r "shadowColor" apps/mobile --include="*.tsx" --include="*.ts" | grep -v constants/theme.ts
```

- [ ] **Step 2: Trocar por `useTheme().elevation`**

Onde fizer sentido. Componentes que dependem só de tema já vão herdar.

- [ ] **Step 3: Smoke + Commit (se houver mudança)**

```powershell
pnpm --filter @cantina/mobile typecheck
git add apps/mobile/
git commit -m "refactor(mobile): substitui shadows hardcoded por useTheme().elevation"
```

(Se não houver, skip o commit.)

---

## Phase 9 — Cleanup + Audit pipeline + Deploy

### Task 9.1: Cleanup do código legado

**Files:**
- Delete: `apps/mobile/lib/hash.ts`
- Delete: `apps/mobile/test/hash.test.mjs`
- Modify: `apps/mobile/data/cardapio.ts` (manter como fallback ou deletar?)

- [ ] **Step 1: Verificar que nada importa `hash.ts`**

```powershell
grep -r "lib/hash" apps/mobile --include="*.ts" --include="*.tsx"
```

Expected: 0 ocorrências (auth migrado pra API).

- [ ] **Step 2: Deletar arquivos legados**

```powershell
git rm apps/mobile/lib/hash.ts apps/mobile/test/hash.test.mjs
```

- [ ] **Step 3: Migrar testes `.mjs` restantes pra Vitest em `packages/shared`**

Para `validation.test.mjs`: criar `packages/shared/src/validation/validation.test.ts` com mesmo conteúdo (ajustando imports). Deletar `.mjs`.

Para `cart.test.mjs`: mover lógica testada pra `apps/mobile/context/__tests__/CartContext.test.tsx` com Jest (Expo já tem preset). Se preferir minimal: manter cart como AsyncStorage local, deletar teste e re-adicionar com Jest depois.

Para `recomendacao.test.mjs`: se a lib mover pra shared, criar test em `packages/shared`. Senão, fica em mobile com Jest.

(Decisão pragmática: mover só `validation` agora; `cart` e `recomendacao` ficam num followup separado, criar TODO em `docs/ROADMAP.md`.)

- [ ] **Step 4: Atualizar/remover scripts npm test legados em `apps/mobile/package.json`**

`apps/mobile/test/` tem `.mjs` rodados como `npm test`. Atualizar pra rodar Jest:

```json
"scripts": {
  ...
  "test": "jest"
}
```

(Se Jest config ausente, criar `apps/mobile/jest.config.js` mínimo:)

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['@testing-library/jest-native/extend-expect'],
};
```

(Adicionar deps se faltarem: `pnpm --filter @cantina/mobile add -D jest jest-expo @testing-library/react-native @testing-library/jest-native`.)

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile/ packages/shared/
git commit -m "refactor: deleta hash.ts (legado), migra validation.test.mjs pra Vitest em shared"
```

### Task 9.2: Audit pipeline — docs/AUDITORIA.md + scripts

**Files:**
- Create: `docs/AUDITORIA.md`
- Create: `scripts/audit-commit-stats.ts`
- Create: `scripts/audit-recent-commits.ts`
- Create: `scripts/audit-grep-stale.ts`
- Create: `scripts/audit-readme-features.ts`

- [ ] **Step 1: Criar `docs/AUDITORIA.md`**

```markdown
# Auditoria — Pipeline & Checklist

Pipeline de manutenção pra garantir que `CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md`, `MEMORY` e `README.md` continuem refletindo a realidade do código.

## Triggers

| Trigger | Tipo | Frequência esperada |
|---|---|---|
| Fim de fase do sub-projeto | Quick | ~1x/semana durante execução |
| Fim de sub-projeto | Full | 3x no projeto inteiro |
| Decisão técnica grande muda | Targeted | Ad-hoc |
| Antes de PR pra main | Smoke | A cada PR |

## Quick audit (fim de fase)

- [ ] CLAUDE.md "Comandos críticos" ainda funcionam? (rodar à mão)
- [ ] CLAUDE.md "Convenções inegociáveis" cobre regras dessa fase?
- [ ] CLAUDE.md "Pegadinhas" tem gotchas dessa fase?
- [ ] HANDOFF.md "Estrutura" mapeia repo atual? (`tree -L 2 -I node_modules`)
- [ ] HANDOFF.md "Comandos essenciais" atualizado?
- [ ] HANDOFF.md "Histórico de commits (últimos 15)" — `pnpm tsx scripts/audit-recent-commits.ts >> ...`
- [ ] HANDOFF.md "Distribuição atual" — `pnpm tsx scripts/audit-commit-stats.ts`

## Full audit (fim de sub-projeto)

Quick + adiciona:

- [ ] ROADMAP itens da fase marcados ✅
- [ ] ROADMAP novo backlog do que ficou pra trás
- [ ] memory/ sem entradas obsoletas (referências a código deletado)
- [ ] memory/ tem entradas novas pra padrões load-bearing dessa fase
- [ ] README.md atualizado se features visíveis pro usuário mudaram
- [ ] AUDIT report salvo em `docs/superpowers/audits/YYYY-MM-DD-<phase>.md`
- [ ] Spec do próximo sub-projeto identificado (ou trigger pra brainstorm)

## Como rodar

```powershell
pnpm audit:run            # roda os 4 scripts e produz relatório
```

Output esperado:
- Top commiters dos últimos 30 dias
- Últimos 15 commits formatados (cole em HANDOFF.md)
- Strings stale encontradas (ex: `data/cardapio` em código pós-migração)
- Cruzamento ROADMAP ✅ vs README

## Quem invoca

- Você (usuário): "claude, audita fim de fase" / "audita full"
- Claude proativo: ao detectar mudança que dispara auditoria, abrir prompt sugerindo
```

- [ ] **Step 2: Criar `scripts/audit-commit-stats.ts`**

```ts
import { execSync } from 'node:child_process';

const out = execSync('git shortlog -sn --no-merges', { encoding: 'utf8' });
console.log('## 📊 Distribuição de commits\n');
console.log('```');
console.log(out.trim());
console.log('```\n');
```

- [ ] **Step 3: Criar `scripts/audit-recent-commits.ts`**

```ts
import { execSync } from 'node:child_process';

const out = execSync('git log -15 --pretty=format:"%h %s" --no-color', { encoding: 'utf8' });
console.log('## 📜 Últimos 15 commits\n');
console.log('```');
console.log(out);
console.log('```\n');
```

- [ ] **Step 4: Criar `scripts/audit-grep-stale.ts`**

```ts
import { execSync } from 'node:child_process';

const STALE_PATTERNS = [
  { pattern: 'data/cardapio', context: 'apps/mobile (deveria consumir API agora)' },
  { pattern: '/Users/johnny', context: 'CLAUDE.md/docs (deveria ser Windows path)' },
  { pattern: 'lib/hash', context: '(deletado em Foundation)' },
];

console.log('## 🔍 Stale strings\n');
for (const { pattern, context } of STALE_PATTERNS) {
  try {
    const out = execSync(`git grep -l "${pattern}"`, { encoding: 'utf8' }).trim();
    if (out) {
      console.log(`### \`${pattern}\` ${context}\n`);
      console.log('```');
      console.log(out);
      console.log('```\n');
    }
  } catch {
    // git grep exits non-zero quando não acha — silenciar
  }
}
```

- [ ] **Step 5: Criar `scripts/audit-readme-features.ts`**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const roadmap = readFileSync(join(root, 'docs/ROADMAP.md'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');

console.log('## 📚 ROADMAP ✅ vs README\n');
const checks = roadmap.match(/^\| \d+ \| \*\*([^*]+)\*\* \|/gm) ?? [];
const completed = checks.filter(line => line.includes('✅'));
const completedNames = completed.map(l => l.match(/\*\*([^*]+)\*\*/)?.[1] ?? '').filter(Boolean);

const missingInReadme = completedNames.filter(name => !readme.toLowerCase().includes(name.toLowerCase()));
if (missingInReadme.length) {
  console.log('Concluído no ROADMAP mas não mencionado no README:');
  missingInReadme.forEach(n => console.log(`- ${n}`));
} else {
  console.log('✅ README cobre todas as features ✅ do ROADMAP.\n');
}
```

- [ ] **Step 6: Verificar typecheck**

```powershell
pnpm tsx scripts/audit-commit-stats.ts
pnpm tsx scripts/audit-recent-commits.ts
pnpm tsx scripts/audit-grep-stale.ts
pnpm tsx scripts/audit-readme-features.ts
```

Cada um deve produzir output sem erro.

- [ ] **Step 7: Commit**

```powershell
git add docs/AUDITORIA.md scripts/
git commit -m "feat(audit): pipeline de auditoria com 4 scripts + checklist em docs/AUDITORIA.md"
```

### Task 9.3: render.yaml + GitHub Actions CI

**Files:**
- Create: `render.yaml`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Criar `render.yaml` na raiz**

```yaml
services:
  - type: web
    name: cantina-api
    runtime: node
    region: oregon
    plan: free
    rootDir: apps/api
    buildCommand: corepack enable && pnpm install --frozen-lockfile && pnpm db:migrate && pnpm build
    startCommand: pnpm start
    healthCheckPath: /api/v1/health
    autoDeploy: true
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8787
      - key: ALLOWED_ORIGINS
        sync: false
      - key: LOG_LEVEL
        value: info
      - key: USE_PGLITE
        value: "false"
```

- [ ] **Step 2: Criar `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - env: { JWT_SECRET: 'ci-secret-min-32-chars-please-rotate', USE_PGLITE: 'true' }
        run: pnpm test
      - run: pnpm lint
```

- [ ] **Step 3: Commit**

```powershell
git add render.yaml .github/
git commit -m "ci: adiciona render.yaml + GitHub Actions (typecheck + test + lint em PR/main)"
```

### Task 9.4: Provisionar Neon + Render — primeiro deploy

**Files:** (nenhum — só configuração externa)

- [ ] **Step 1: Neon — criar projeto**

1. Login em https://console.neon.tech
2. New Project: name `cantina`, region `US East (Ohio)` (mais perto do Render Oregon)
3. Copiar `DATABASE_URL` da connection string

- [ ] **Step 2: Aplicar schema no Neon**

Localmente, com `DATABASE_URL` apontando pro Neon:

```powershell
$env:DATABASE_URL="postgresql://...neon..."
$env:JWT_SECRET="any-secret-min-32-chars-for-cli"
$env:USE_PGLITE="false"
pnpm api:db:migrate
pnpm api:db:seed
```

- [ ] **Step 3: Render — criar Web Service**

1. https://dashboard.render.com → New → Web Service
2. Connect repo `fiap-mdi-cp2-cantina-app`
3. Render lê `render.yaml` automaticamente
4. Pre-deploy: ir em Environment e setar:
   - `DATABASE_URL` = (cola do Neon)
   - `ALLOWED_ORIGINS` = (deixa em branco até ter URL do mobile web — em dev pode ser `*` mas trocar antes de demo)
5. Save & Deploy

- [ ] **Step 4: Verificar saúde**

```powershell
curl https://cantina-api.onrender.com/api/v1/health
```

Expected: `{"status":"ok",...}` (após ~2-3 min do primeiro deploy).

Pode demorar pelo cold start na primeira chamada.

- [ ] **Step 5: Configurar UptimeRobot (opcional mas recomendado)**

1. https://uptimerobot.com → Add Monitor
2. Type: HTTP(s)
3. URL: `https://cantina-api.onrender.com/api/v1/health`
4. Interval: 5 minutes
5. Save

- [ ] **Step 6: Atualizar mobile env de produção**

Criar `apps/mobile/.env.production`:
```
EXPO_PUBLIC_API_URL=https://cantina-api.onrender.com
```

- [ ] **Step 7: Commit**

```powershell
git add apps/mobile/.env.production
git commit -m "chore: adiciona .env.production apontando pro Render"
```

(Decidir caso-a-caso se `.env.production` deve ser commitado. Se contém só URL pública, OK. Se URLs forem sensíveis, gitignore + documentar.)

---

## Phase 10 — Documentação final + auditoria full

### Task 10.1: Reescrever README raiz pra explicar monorepo

**Files:**
- Modify: `README.md` (raiz)
- Create: `apps/api/README.md`
- Create: `apps/mobile/README.md` (se README atual estava mais focado no app, podemos mover)

- [ ] **Step 1: Reescrever `README.md` raiz**

Estrutura sugerida:
- Header + badge build status
- O que é (1 parágrafo)
- Quick start (`corepack enable && pnpm install && pnpm dev`)
- Stack visual (tabela ou lista)
- Estrutura do monorepo
- Onde está cada coisa (links pra apps/api/README, apps/mobile/README, docs/superpowers/specs/)
- Comandos principais
- Deploy (Render + Neon)
- Próximos passos (sub-projetos 2 e 3)

(O README real anterior era detalhado — mover detalhes específicos do app pra `apps/mobile/README.md` e a versão raiz fica meta.)

- [ ] **Step 2: Criar `apps/api/README.md`**

Curto: o que é o servidor, como rodar, como adicionar rota, como adicionar migration, link pro spec.

- [ ] **Step 3: Criar `apps/mobile/README.md`**

(ou mover conteúdo do README atual pra cá) — mantém todas as features do CP2 documentadas, prints, etc.

- [ ] **Step 4: Commit**

```powershell
git add README.md apps/
git commit -m "docs: reescreve README raiz pra monorepo + READMEs por app"
```

### Task 10.2: Atualizar HANDOFF.md + ROADMAP.md

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Atualizar `docs/HANDOFF.md`**

- Estrutura: refletir monorepo
- Comandos essenciais: pnpm
- Distribuição: jota0802 majoritário (mostrar `git shortlog -sn` real)
- Próximos passos: Cantina admin (sub 2)
- Pegadinhas: novas (Render cold start, EXPO_PUBLIC baked-in, Android emulator 10.0.2.2)
- Histórico: adicionar bloco "últimos 15" (rodar `pnpm tsx scripts/audit-recent-commits.ts`)

- [ ] **Step 2: Atualizar `docs/ROADMAP.md`**

- Marcar Foundation como ✅
- Adicionar nova seção "Sub-projetos restantes" apontando pro brainstorm de cada um
- Mover backlog técnico que apareceu durante Foundation (cart sync, light mode, etc.)

- [ ] **Step 3: Commit**

```powershell
git add docs/
git commit -m "docs: atualiza HANDOFF e ROADMAP pos-Foundation"
```

### Task 10.3: Auditoria full + report

**Files:**
- Create: `docs/superpowers/audits/2026-MM-DD-foundation-completo.md`

- [ ] **Step 1: Rodar audit:run**

```powershell
pnpm audit:run > audit-output.txt
```

- [ ] **Step 2: Criar audit report**

Em `docs/superpowers/audits/2026-MM-DD-foundation-completo.md` (substituir data):

```markdown
# Auditoria — Foundation completo

**Data:** 2026-MM-DD
**Tipo:** Full audit (fim de sub-projeto)
**Sub-projeto auditado:** 1 (Foundation)

## ✅ Quick audit
- [x] CLAUDE.md comandos críticos passam (`pnpm typecheck && pnpm test && pnpm lint`)
- [x] CLAUDE.md convenções incluem nova: argon2, JWT, RQ, monorepo
- [x] CLAUDE.md pegadinhas tem cold start Render, EXPO_PUBLIC baked, 10.0.2.2 Android
- [x] HANDOFF estrutura mapeia monorepo
- [x] HANDOFF comandos: pnpm
- [x] HANDOFF últimos 15 atualizado

## ✅ Full audit
- [x] ROADMAP Foundation ✅
- [x] memory entradas: project_foundation_status atualizada
- [x] memory entradas novas: padrões React Query, padrão facade contexts
- [x] README raiz reescrito (monorepo)

## 📊 Stats
[output do audit:run colado]

## 🚧 Stale strings encontradas
[output do audit-grep-stale colado, ou "nenhuma"]

## 📝 Notas pra próximo sub-projeto (Cantina admin)
- Multi-tenant: tenant_id já no schema, falta endpoint pra criar tenant + scope queries
- Role: 'staff' já no enum users.role, falta UI + role-based middleware
- (outras notas que surgirem)
```

- [ ] **Step 3: Atualizar memória**

Salvar entrada nova em `memory/project_foundation_status.md` mudando status pra ✅ concluído + apontar pro audit report.

- [ ] **Step 4: Commit**

```powershell
git add docs/superpowers/audits/
git commit -m "docs(audit): report Foundation completo + checklist auditado"
```

---

## Definition of Done — Foundation

- [ ] `pnpm install && pnpm typecheck && pnpm test && pnpm lint` passa zero erros do raiz
- [ ] `pnpm api:dev` sobe Hono em http://localhost:8787 com `/api/v1/health` → `{ status: 'ok' }`
- [ ] `pnpm mobile:start` conecta ao API local e login/cadastro/cardapio/pedidos funcionam end-to-end
- [ ] As 15 telas atuais continuam funcionando (smoke manual em dark + light)
- [ ] Dark mode mostra paleta B (Vercel/Cursor neutro) — print Home + Pedidos + Confirmação
- [ ] Deploy Render passa (`git push origin main`, build verde, `/health` 200 público)
- [ ] DB Neon populado com seed (12 itens)
- [ ] `docs/AUDITORIA.md` existe com checklist
- [ ] `pnpm audit:run` roda os 4 helpers e produz output legível
- [ ] `CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md` atualizados com nova realidade monorepo
- [ ] `README.md` raiz reescrito explicando monorepo
- [ ] Audit report em `docs/superpowers/audits/`
- [ ] Memória atualizada (`project_foundation_status` ✅)

---

## Self-Review Notes

**Spec coverage:**
- §4 Stack técnica → Tasks 1.1, 2.1, 3.1, 3.2, 4.1, 6.1
- §5 Arquitetura → Tasks 2.1 + Phase 9
- §6 Estrutura monorepo → Phase 1
- §7 Schema DB → Tasks 2.3, 2.4
- §8 API surface → Phase 4 + Phase 5
- §9 Migração contexts → Phase 6 + Phase 7
- §10 Dark mode B → Phase 8
- §11 Deploy → Tasks 9.3, 9.4
- §12 Testes → embutido em cada task TDD + Task 9.1 cleanup mjs
- §13 Pipeline auditoria → Task 9.2 + 10.3
- §14 Distribuição commits → não aplicável (autor único jota0802 conforme memória)
- §15 Riscos → mitigações inline em tasks
- §16 Open questions → resolvidas no topo deste plano
- §17 DoD → §"Definition of Done" deste plano

**Placeholder scan:** zero TBD/TODO. Onde há "(adaptar)" sempre vem com ponteiro pra arquivo ou seção pra checar.

**Type consistency:** `useAuth().signIn`/`signUp`/`signOut` definido na Task 6.2 — telas que chamam outros nomes precisam alinhar (sinalizado no Step 3 da 6.2). `useOrders()` muda do antigo (Task 7.2 — facade preserva nome). `nextSenha`, `fetchOrderWithItems` definidos uma vez na Task 5.2.

---

*Foundation plan — 2026-05-05 — fiap-mdi-cp2-cantina-app*
