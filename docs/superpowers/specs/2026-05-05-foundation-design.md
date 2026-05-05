# Sub-projeto 1: Foundation — Design Document

> **Escopo:** primeiro de 3 sub-projetos do refactor pós-CP2. Cobre toda a base técnica (backend separado + banco + monorepo + auditoria + dark mode premium) que destrava os sub-projetos 2 (Cantina admin) e 3 (Customer flows v2).
>
> **Status:** brainstorm aprovado em 2026-05-05. Pendente: spec review pelo usuário, depois geração do plano de implementação via skill `writing-plans`.

## 1. Contexto

App Cantina FIAP (CP2) já entregue ao professor. Stack atual: monorepo single-package Expo + TypeScript strict + 6 contexts persistidos em AsyncStorage + i18n PT/EN/ES. ~16.660 linhas em 93 arquivos, 116 commits.

A entrega acabou e o usuário quer evoluir o projeto pra "outro patamar" como portfólio: backend de verdade, banco real, persona de operador da cantina (admin), pagamentos, agendamento, calendário e validação de retirada.

Pra evitar spec gigante e plano impossível de revisar, o escopo total foi decomposto em 3 sub-projetos sequenciais:

1. **Foundation** (este doc) — base técnica
2. **Cantina admin** (futuro) — multi-tenant, estoque, fornecedores, vitrine
3. **Customer flows v2** (futuro) — calendário, filtros, kitchen-flow, validação retirada, recorrentes, Stripe

Cada sub-projeto terá seu próprio ciclo `spec → plano → execução → auditoria`.

## 2. Goals

1. Migrar de "app monolítico com AsyncStorage" pra arquitetura cliente-servidor com API HTTP + banco Postgres.
2. Reorganizar repo como monorepo `pnpm` com `apps/api`, `apps/mobile`, `packages/shared`.
3. Trocar `data/cardapio.ts` mockado por seed em DB consultado via API.
4. Substituir hashing client-side por argon2 server-side com JWT pra sessão.
5. Refresh do dark mode pra direção neutro near-black ("premium").
6. Trocar os `.mjs` Node tests por Vitest type-safe + Jest pra componentes RN.
7. Deixar o serviço deploy-ready dia 1 em Render (API) + Neon (DB) sem custo recorrente.
8. Criar pipeline de auditoria (`docs/AUDITORIA.md` + scripts) pra manter `CLAUDE.md`/`HANDOFF.md`/`ROADMAP.md`/memória sincronizados conforme o projeto evolui.

## 3. Non-goals (Foundation)

Estas features são **conhecidas, planejadas, mas explicitamente fora deste sub-projeto**:

- Stripe / pagamento (sub 3, última etapa)
- Multi-tenant ativo (campo `tenant_id` existe no schema, mas só `default` populado)
- Estoque, fornecedores, perfil cantina (sub 2)
- Calendário, filtros avançados, pedidos recorrentes (sub 3)
- Lógica "cozinha preparando → pronto" server-side controlada por operador (sub 2/3)
- Validação de retirada via QR/PIN (sub 3)
- SSE/realtime push (entra em sub 2 quando admin precisar)
- Refresh do light mode (deixar pra polish futuro)
- Auth social (Google, Apple, etc.)

## 4. Stack técnica

| Camada | Decisão | Razão |
|---|---|---|
| Banco | **Postgres** via Drizzle ORM | Concorrência real (FOR UPDATE pra estoque sub 2), `generate_series` pra recorrentes sub 3, branching no Neon, padrão de mercado |
| DB dev | Neon free tier (cloud) ou pglite (Postgres em WASM, file-based) | Zero install local; pglite usado em testes sempre |
| Backend | **Hono** sobre Node 20 | TypeScript-first, ~20kb, runtime-agnóstico, cara de stack 2025 |
| Auth | JWT HS256 + argon2 (`@node-rs/argon2`) | argon2 é state-of-the-art pra password; JWT em SecureStore no cliente |
| Validação | **Zod** (compartilhado API+mobile via `packages/shared`) | Schema-first, tipos derivados via `z.infer<>` |
| ORM | Drizzle + drizzle-kit | Sem query engine binário (Prisma é pesado), SQL-like, educacional |
| Cliente HTTP mobile | **TanStack Query (React Query) v5** + `fetch` puro | Mata loading/retry/cache/invalidation, persiste cache em AsyncStorage |
| Logs API | `pino` | Estruturado, rápido, integra com Render dashboard |
| Testes API | Vitest + supertest + pglite efêmero | Zero Docker em CI, mesmo dialeto SQL do prod |
| Testes mobile | Jest (já configurado pelo Expo SDK 55) + `@testing-library/react-native` | Padrão Expo |
| Testes shared | Vitest puro | Migra os 4 `.mjs` atuais |
| Empacotamento | pnpm workspaces (não Turborepo) | Suficiente pra 2 apps + 1 package |
| Build API | `tsup` ou `esbuild` (decidir no plano) | Output `dist/` consumível pelo Render |

### 4.1. AsyncStorage no mobile (papel reduzido)

Pós-Foundation, AsyncStorage carrega **só**:

- Token JWT (primário em SecureStore, fallback AsyncStorage com prefix `__secure__:` no web — código atual)
- Locale, theme, onboarded flag, último tenant selecionado (UI-only)
- Cache persistido do React Query (key: `@cantina:rq-cache`)
- Favoritos local (sync com server quando online — cliente é fonte da verdade temporariamente; conflito = server vence ao re-fetch)

Tudo que é dado real (users, items, orders, stock, suppliers) sai de AsyncStorage e vira API.

## 5. Arquitetura

```
                        ┌──────────────────┐
                        │  Neon Postgres   │  branching por PR
                        │  (free tier)     │
                        └────────▲─────────┘
                                 │ DATABASE_URL
                                 │
        Mobile (Expo)     ┌──────┴──────────┐
        ──────────►       │  Render Web     │
        EXPO_PUBLIC_      │  cantina-api    │
        API_URL           │  Hono on Node 20│
                          │  /auth /items   │
                          │  /orders /favs  │
                          │  /health        │
                          └─────────────────┘

Local dev: pglite (file:./dev.db) OU Neon dev branch via DATABASE_URL
```

## 6. Estrutura do repositório (alvo)

```
fiap-mdi-cp2-cantina-app/                     ← raiz do monorepo
├── apps/
│   ├── mobile/                               ← Expo app (movido da raiz)
│   │   ├── app/ components/ context/ hooks/ constants/ assets/
│   │   ├── lib/                              (mantém: secure-store, notifications, image-picker, haptics, confirm)
│   │   ├── lib/api/                          (NOVO: client, hooks RQ, helpers)
│   │   ├── package.json
│   │   ├── metro.config.js                   (+ watchFolders pra workspace)
│   │   └── tsconfig.json
│   └── api/                                  ← Hono + Drizzle
│       ├── src/
│       │   ├── index.ts                      (bootstrap + listen + sigterm)
│       │   ├── app.ts                        (Hono instance + middleware chain)
│       │   ├── env.ts                        (Zod-validated process.env)
│       │   ├── routes/
│       │   │   ├── auth.ts                   (register, login, logout, me)
│       │   │   ├── items.ts                  (list, get)
│       │   │   ├── orders.ts                 (list, get, create, status)
│       │   │   ├── favorites.ts              (list, add, remove)
│       │   │   └── health.ts
│       │   ├── db/
│       │   │   ├── client.ts                 (factory: Postgres OR pglite por env)
│       │   │   ├── schema.ts                 (drizzle: users, items, orders, order_items, favorites)
│       │   │   └── seed.ts                   (popula 12 itens iniciais via @cantina/shared)
│       │   ├── lib/
│       │   │   ├── jwt.ts                    (sign, verify, types)
│       │   │   ├── password.ts               (argon2 wrapper)
│       │   │   ├── errors.ts                 (HTTPError class + toResponse helper)
│       │   │   └── ids.ts                    (cuid2 ou nanoid)
│       │   └── middleware/
│       │       ├── auth.ts                   (Bearer JWT → c.set('user', user))
│       │       ├── error-handler.ts
│       │       ├── request-id.ts
│       │       └── logger.ts                 (pino)
│       ├── drizzle/                          (migrations geradas)
│       ├── drizzle.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/                               ← @cantina/shared
│       ├── src/
│       │   ├── index.ts                      (re-exports)
│       │   ├── types/                        (Order, User, ItemCardapio, Tag, OrderStatus, Categoria...)
│       │   ├── schemas/                      (Zod — fonte da verdade, types derivados)
│       │   │   ├── user.ts
│       │   │   ├── item.ts
│       │   │   ├── order.ts
│       │   │   └── auth.ts
│       │   ├── validation/                   (regras: email, senha, nome — usadas no mobile e API)
│       │   ├── i18n/                         (dicionários PT/EN/ES, sem React)
│       │   └── estimativa.ts                 (lib/estimativa.ts movido pra cá)
│       ├── package.json
│       └── tsconfig.json
├── scripts/                                  ← helpers de auditoria
│   ├── audit-commit-stats.ts
│   ├── audit-recent-commits.ts
│   ├── audit-grep-stale.ts
│   └── audit-readme-features.ts
├── docs/
│   ├── superpowers/
│   │   ├── specs/                            ← este doc fica aqui
│   │   ├── plans/                            ← gerados por writing-plans
│   │   └── audits/                           ← reports de auditoria
│   ├── HANDOFF.md                            ← evergreen
│   ├── ROADMAP.md                            ← evergreen
│   ├── AUDITORIA.md                          ← NOVO: como rodar auditoria
│   └── ... (aulas, prints, PDF spec CP2)
├── screenshots/                              ← raiz, mantém
├── .github/                                  ← (futuro) CI workflow
├── render.yaml                               ← IaC do deploy API
├── package.json                              (workspaces + dev tooling: tsx, vitest, eslint, typescript)
├── pnpm-workspace.yaml
├── tsconfig.base.json                        (compartilhado)
├── eslint.config.js                          (flat config aplicada a tudo)
├── .npmrc                                    (node-linker=hoisted se Expo reclamar)
├── CLAUDE.md                                 (atualizado: monorepo, pnpm, dev DX Win/PowerShell, novas pegadinhas)
└── README.md                                 (atualizado pós-Foundation)
```

### 6.1. Comandos workspace

Da raiz, via pnpm:

```powershell
# Setup
corepack enable
corepack prepare pnpm@latest --activate
pnpm install

# Dev (2 terminais)
pnpm api:dev                   # tsx watch src/index.ts → http://localhost:8787
pnpm mobile:start              # expo start → tunnel se quiser

# DB
pnpm api:db:generate           # drizzle-kit generate (cria migration de mudança no schema)
pnpm api:db:push               # drizzle-kit push (aplica direto no DB — só dev)
pnpm api:db:migrate            # drizzle-kit migrate (aplica migrations geradas — prod/CI)
pnpm api:db:seed               # roda seed.ts
pnpm api:db:studio             # drizzle-kit studio (UI web pra inspecionar dados)
pnpm api:db:reset              # drop all + push + seed

# Qualidade
pnpm typecheck                 # tsc --noEmit em todo workspace
pnpm test                      # roda vitest em api+shared, jest em mobile
pnpm test:watch
pnpm lint                      # eslint em tudo
pnpm format                    # prettier write

# Auditoria
pnpm audit:run                 # roda os 4 scripts/audit-*.ts
```

`apps/mobile` mantém seus próprios scripts Expo (`expo start`, `expo install`, etc.) acessíveis via `pnpm --filter mobile <comando>`.

### 6.2. Path aliases

- `apps/mobile/`: `@/*` mapeia pra `./` (mantém o atual)
- `apps/api/`: `@/*` mapeia pra `./src/*` (independente)
- Cross-package: `@cantina/shared` (workspace dep, importado em ambos)

### 6.3. Configuração Metro (mobile)

`apps/mobile/metro.config.js`:

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

Com `.npmrc` na raiz contendo `node-linker=hoisted` se houver problemas de resolução.

## 7. Schema do banco (Foundation inicial)

Drizzle schema (esboço, refinar no plano):

```ts
// users
{
  id: text('id').primaryKey(),                 // cuid2
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  tenantId: text('tenant_id'),                 // nullable na Foundation
  role: text('role').notNull().default('customer'), // 'customer' | 'staff' (sub 2 usa)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}

// items
{
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),       // 'misto-quente'
  nameKey: text('name_key').notNull(),         // chave i18n: 'item.misto.nome'
  descricaoKey: text('descricao_key').notNull(),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
  categoria: text('categoria').notNull(),      // 'lanches' | 'bebidas' | 'sobremesas'
  tags: text('tags').array().notNull().default([]),
  imagem: text('imagem'),
  disponivel: boolean('disponivel').notNull().default(true),  // sub 2 muda
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}

// orders
{
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull(),            // 'pendente' | 'pronto' | 'retirado' | 'cancelado'
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  senha: integer('senha').notNull(),           // número da senha sequencial por dia/tenant
  prontoEmEstimado: timestamp('pronto_em_estimado'),
  prontoEm: timestamp('pronto_em'),
  retiradoEm: timestamp('retirado_em'),
  canceladoEm: timestamp('cancelado_em'),
  tenantId: text('tenant_id'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
}

// order_items
{
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id),
  nameSnapshot: text('name_snapshot').notNull(),  // freeze no momento do pedido
  precoSnapshot: numeric('preco_snapshot', { precision: 10, scale: 2 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  observacoes: text('observacoes'),
}

// favorites
{
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  // PK composta (user_id, item_id)
}
```

**Migrations:** geradas por `drizzle-kit generate` a cada mudança no schema. Aplicadas em deploy via `drizzle-kit migrate` no buildCommand do Render.

## 8. API surface (Foundation)

Todos endpoints com prefix `/api/v1` e content-type `application/json`. Auth via header `Authorization: Bearer <jwt>`. Erros via `{ error: { code, message, details? } }` com HTTP status apropriado.

### 8.1. Auth (público)

| Método | Path | Body | Responde |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `{ user, token }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, token }` |
| POST | `/auth/logout` | — | `204` |
| GET | `/auth/me` | — | `{ user }` (requer auth) |

### 8.2. Items (autenticado, leitura)

| Método | Path | Query | Responde |
|---|---|---|---|
| GET | `/items` | `?categoria=&tag=&disponivel=true` | `{ items: Item[] }` |
| GET | `/items/:id` | — | `{ item }` |

### 8.3. Orders (autenticado, scope = own)

| Método | Path | Body | Responde |
|---|---|---|---|
| GET | `/orders` | — | `{ orders: Order[] }` (do usuário) |
| GET | `/orders/:id` | — | `{ order }` |
| POST | `/orders` | `{ items: [{ itemId, quantidade, observacoes? }] }` | `{ order }` |
| PATCH | `/orders/:id/status` | `{ status: 'cancelado' }` | `{ order }` (apenas cliente cancela; transições `pendente→pronto→retirado` mudam em sub 2/3) |

Auto-promoção `pendente → pronto` após 3min: implementada server-side via job simples (poll por orders pendentes vencidos a cada 30s). Em sub 2, isso vira controle do operador.

### 8.4. Favorites (autenticado)

| Método | Path | Body | Responde |
|---|---|---|---|
| GET | `/favorites` | — | `{ items: Item[] }` |
| POST | `/favorites/:itemId` | — | `204` |
| DELETE | `/favorites/:itemId` | — | `204` |

### 8.5. Health

| Método | Path | Responde |
|---|---|---|
| GET | `/health` | `{ status: 'ok', db: 'ok'|'down', uptime, version }` |

## 9. Migração dos 6 contexts (strangler pattern)

**Princípio:** contexts continuam como facades — as 15 telas seguem usando `useAuth()`, `useOrders()`, etc. Só os internals mudam.

### 9.1. Por context

| Context | Status atual | Ação |
|---|---|---|
| ThemeContext | AsyncStorage UI-only | Mantém. Só atualiza tokens pro dark mode B. |
| LocaleContext | AsyncStorage UI-only | Mantém. Dicionários movem pra `@cantina/shared/i18n`. |
| AuthContext | SecureStore + SHA-256 client | Reescreve: chama `/auth/*`, guarda JWT em SecureStore, `useUser()` retorna o claim do JWT. Hash client deletado. |
| OrdersContext | AsyncStorage por usuário | Vira wrapper de React Query: `useOrders()` retorna `useQuery(['orders'], fetchOrders)`. Auto-promoção sai do cliente. |
| FavoritesContext | AsyncStorage por usuário | Vira RQ + sync optimistic: toggle local imediato + mutation pra API + invalidação. |
| CartContext | AsyncStorage por usuário | **Mantém local.** Sem sync. Checkout (`POST /orders`) chama API. |

### 9.2. Ordem de execução (cada item = 1 fase, agrupando vários commits)

1. **API up + Auth migrado**: login/cadastro funcionam end-to-end via API. JWT em SecureStore. AuthContext reescrito.
2. **Items migrado**: `data/cardapio.ts` → seed; mobile consulta `/items` via RQ. `useItems()` novo.
3. **Orders migrado**: histórico vem de `/orders`. Auto-promoção `pendente→pronto` server-side.
4. **Favorites migrado**: optimistic toggle + sync.
5. **Cart cleanup**: confirma que cart segue local; checkout via `POST /orders`.
6. **Hash legado deletado**: remove `lib/hash.ts` e `test/hash.test.mjs` quando ninguém mais consumir.

Cada fase tem auditoria quick no fim (§13.1). Entre fases o app continua funcional porque os facades absorvem.

## 10. Dark mode premium — direção B (neutro near-black)

Atualizar `apps/mobile/constants/theme.ts`. Direção: Vercel/Cursor/Apple TV — neutro, focado em conteúdo.

### 10.1. Tokens dark (substitui valores atuais)

```ts
darkTheme: {
  bg:               '#08080B',
  bgElevated:       '#0B0B0E',           // sheet/modal background
  surface:          '#111114',
  surfaceElevated:  '#18181C',
  surfaceHover:     '#1D1D22',
  border:           'rgba(255,255,255,0.06)',
  borderStrong:     'rgba(255,255,255,0.10)',
  divider:          'rgba(255,255,255,0.04)',
  separator:        'rgba(255,255,255,0.05)',

  // texto
  text:             '#F2F2F5',           // não pure-white
  textMuted:        '#A8A8B0',           // sobe contraste de #8B8B95 atual (a11y)
  textSubtle:       '#6B6B72',
  textInverse:      '#08080B',

  // primary desaturado 10% pra menos glare
  primary:          '#6B6BE8',           // era ~#7C7CFF
  primarySoft:      'rgba(107,107,232,0.16)',
  primaryDeep:      '#5454C7',
  primaryContrast:  '#FFFFFF',

  // status (mantém semântico)
  success:          '#34D399',
  warning:          '#F59E0B',
  danger:           '#F87171',
  errorSoft:        'rgba(248,113,113,0.14)',

  // sem shadows em dark — vira "highlight no topo"
}
```

### 10.2. Elevation system (dark vs light)

```ts
elevation: {
  // light: shadow normal
  light: {
    sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    md: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    lg: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  },
  // dark: highlight no topo da card simulando luz vinda de cima
  dark: {
    sm: { borderTopColor: 'rgba(255,255,255,0.04)', borderTopWidth: 1 },
    md: { borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1 },
    lg: { borderTopColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1 },
  },
}
```

`useTheme()` retorna `elevation` já no shape correto pro tema atual — telas usam `...elevation.md`.

### 10.3. Light mode

Não altera nesta Foundation. Pequenos ajustes (tokens novos `border` alpha, `textSubtle`) são adicionados em valores compatíveis pra não quebrar.

### 10.4. Risco

- Pressables em dark precisam de feedback mais forte sem shadow → confirmar `pressedSoft` (opacity 0.85 + scale 0.98) ainda lê bem nessa paleta. Validar empiricamente no piloto.
- Status colors mantêm contraste. Validar com a11y simulator (sub 2 ou polish posterior).

## 11. Deploy (Render + Neon)

### 11.1. Topologia

```
Render Web (cantina-api)         Neon Postgres (cantina-db)
├ free plan, sleep 15min idle    ├ free tier, autoscale-to-zero
├ Node 20, Hono, dist/           ├ DB branching habilitado
└ healthcheck /health            └ region: us-east-2 (mais perto do Render Oregon)
```

### 11.2. `render.yaml` (raiz)

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
        sync: false                 # cole manual no dashboard, do Neon
      - key: JWT_SECRET
        generateValue: true         # Render gera 1x
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8787
      - key: ALLOWED_ORIGINS
        sync: false                 # cole manual: URLs do web build + Expo dev (NUNCA "*" em prod)
      - key: LOG_LEVEL
        value: info
```

### 11.3. Mobile env

```
apps/mobile/.env.development        EXPO_PUBLIC_API_URL=http://localhost:8787
apps/mobile/.env.production         EXPO_PUBLIC_API_URL=https://cantina-api.onrender.com
```

EAS profiles (`apps/mobile/eas.json`) mapeiam env por profile. Documentado em `CLAUDE.md`.

**Pegadinha:** `EXPO_PUBLIC_*` é baked-in no bundle. Trocar URL exige rebuild via EAS.

### 11.4. Cold start

Render free dorme em 15min idle. Mitigações:

1. UptimeRobot pingando `/api/v1/health` a cada 10min (free, sem CC) — recomendado
2. `apps/mobile/lib/api/client.ts` mostra Toast "Acordando o servidor..." se primeira request demora >5s
3. Skeleton loading (já existe) absorve a percepção

### 11.5. Stripe

Não entra em Foundation. Quando entrar (sub 3), `render.yaml` ganha rota `/webhooks/stripe` e env `STRIPE_*`. Sem trabalho preparatório agora.

## 12. Testes

### 12.1. Estratégia por package

| Package | Runner | Foco | Cobertura alvo |
|---|---|---|---|
| `apps/api` | Vitest + supertest + pglite | Endpoints, validação, auth, DB queries | 50% endpoints, 80% lib/ |
| `apps/mobile` | Jest (Expo preset) + RTL | Componentes, contexts, hooks | best-effort, sem hard cap |
| `packages/shared` | Vitest puro | Validation, schemas, estimativa, i18n keys | 80%+ |

### 12.2. Migração dos `.mjs` atuais

| Arquivo atual | Novo lugar | Runner |
|---|---|---|
| `test/validation.test.mjs` | `packages/shared/src/validation/__tests__/*.test.ts` | Vitest |
| `test/cart.test.mjs` | `apps/mobile/context/__tests__/CartContext.test.tsx` | Jest |
| `test/hash.test.mjs` | **deletado** quando hash client morre | — |
| `test/recomendacao.test.mjs` | `packages/shared/src/recomendacao.test.ts` (se mover lib) ou `apps/mobile/lib/__tests__/recomendacao.test.ts` | Vitest ou Jest dependendo de onde a lib mora |

### 12.3. pglite efêmero

```ts
// apps/api/src/test/db.ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle' });
  return { db, client };
}
```

Cada suite cria sua DB efêmera, drop ao fim. Zero contaminação entre testes.

## 13. Pipeline de auditoria

### 13.1. Triggers

| Trigger | O que roda |
|---|---|
| Fim de fase (~1x/semana, ex: "Auth migrado") | Quick audit: CLAUDE.md + HANDOFF |
| Fim de sub-projeto (3x no projeto inteiro) | Full audit: + ROADMAP + memória + README |
| Decisão técnica grande muda (ad-hoc) | Targeted: arquivos afetados pela decisão |
| Antes de PR pra main | Quick smoke: docs ainda batem? |

### 13.2. Checklist canônico

Salvo em `docs/AUDITORIA.md`. Cada auditoria gera report em `docs/superpowers/audits/YYYY-MM-DD-<phase>.md`.

```markdown
## Quick audit (fim de fase)
- [ ] CLAUDE.md "Comandos críticos" ainda funcionam?
- [ ] CLAUDE.md "Convenções inegociáveis" cobre regras dessa fase?
- [ ] CLAUDE.md "Pegadinhas" tem gotchas dessa fase?
- [ ] HANDOFF "Estrutura" mapeia repo atual?
- [ ] HANDOFF "Comandos essenciais" atualizado?
- [ ] HANDOFF "Histórico de commits" — auto-gerado por `pnpm audit:run`
- [ ] HANDOFF "Distribuição atual" entre 4 RMs — auto-gerado

## Full audit (fim de sub-projeto, adiciona)
- [ ] ROADMAP itens da fase marcados ✅
- [ ] ROADMAP novo backlog do que ficou pra trás
- [ ] memory/ sem entradas obsoletas (referências a código deletado)
- [ ] memory/ tem entradas novas pra padrões load-bearing
- [ ] README.md atualizado se features visíveis pro usuário mudaram
- [ ] AUDIT report salvo em `docs/superpowers/audits/`
```

### 13.3. Helpers automatizados (`scripts/`)

| Script | Função |
|---|---|
| `audit-commit-stats.ts` | `git shortlog -sn` + checa balance entre 4 RMs, alerta desvio >5 |
| `audit-recent-commits.ts` | Gera bloco "últimos 15 commits" formatado pra HANDOFF.md |
| `audit-grep-stale.ts` | Procura strings obsoletas (ex: "AsyncStorage" em código que devia chamar API) |
| `audit-readme-features.ts` | Cruza features ROADMAP ✅ vs README — flag se README atrasado |

`pnpm audit:run` = roda os 4, output formatado.

### 13.4. Agente proativo

Conforme o agente (Claude) trabalha em features, ele **flagra ativamente**: se mudar `package.json` ou estrutura sem auditoria, abre prompt: "🚨 essa mudança bate uma auditoria CLAUDE.md, quer que eu rode agora?"


## 14. Riscos & mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Metro não resolve `@cantina/shared` | Média | Alto | Configurar `watchFolders` + smoke-test no piloto Auth antes de migrar resto |
| pnpm + Expo conflitam (`require-cycle`, hoisting) | Média | Médio | `.npmrc node-linker=hoisted`, documentar workarounds no CLAUDE.md |
| Cold start Render irrita demo | Alta | Médio | UptimeRobot grátis + Toast "Acordando..." + skeleton |
| Migration drizzle quebra dados existentes | Baixa (dados são mock) | Baixo | `pnpm api:db:reset` regenera tudo |
| Time esquece de subir API antes do mobile | Alta | Baixo | Toast claro + comando único `pnpm dev` (concurrent? decidir no plano) |
| Distribuição commits desbalanceia | Média | Baixo (avaliação) | Plano detalha autor por commit; auditoria flagra |
| Dark mode B fica chato/sem identidade | Baixa | Médio | Validar no piloto (1 tela first); reverter pra A se não convencer |
| `EXPO_PUBLIC_API_URL` baked-in confunde devs | Alta | Médio | Documentar 3x: README, CLAUDE.md, HANDOFF |
| pglite tem incompatibilidade com Postgres real | Baixa | Alto | Smoke test Postgres real (Neon) em CI; pglite só pra unit |
| JWT secret leak em commit | Baixa | Crítico | `.env*` gitignored; checklist pre-commit; auditoria grep |

## 16. Open questions (resolver no plano)

1. **Concurrent dev runner** — `pnpm dev` que sobe API + mobile simultâneo via `concurrently` ou `npm-run-all`? Ou docs só com 2 terminais?
2. **Build API** — `tsup` vs `esbuild` direto? `tsup` mais ergonômico.
3. **CUID2 vs UUID** — IDs no DB. Inclinação: cuid2 (URL-friendly, Prisma usa, mais curto que UUID).
4. **React Query persist** — `@tanstack/query-persist-client-async-storage` ou rolar próprio?
5. **`@node-rs/argon2` vs `argon2`** — primeiro é Rust nativo (rápido), segundo é C++ binding (mais maduro). Render free permite ambos? Verificar no piloto.
6. **Pino transports** — JSON puro pro Render parsear? `pino-pretty` em dev only.
7. **CI inicial** — GitHub Actions com `pnpm typecheck && pnpm test && pnpm lint` em PR? Vale incluir em Foundation ou deixar pra depois?
8. **Locale do JWT claim** — incluir `locale` no token pra API responder mensagens já no idioma certo?
9. **Migrar README pra root** — README atual fala do app inteiro. Criar `apps/mobile/README.md` específico ou manter root global?
10. **Senha sequencial** — escopo do `senha` (counter) é por dia? Por tenant? Por hora? Definir regra antes do schema final.

## 17. Critérios de pronto (Definition of Done — Foundation)

- [ ] `pnpm install && pnpm typecheck && pnpm test && pnpm lint` passa zero erros do raiz
- [ ] `pnpm api:dev` sobe Hono em http://localhost:8787 com `/health` retornando OK e DB OK
- [ ] `pnpm mobile:start` conecta ao API local e login/cadastro funcionam end-to-end
- [ ] As 15 telas atuais continuam funcionando (smoke manual em dark + light)
- [ ] Dark mode mostra paleta B (Vercel/Cursor neutro) — validar print Home + Pedidos + Confirmação
- [ ] Deploy Render passa (manual `git push`, build verde, `/health` 200 público)
- [ ] DB Neon populado com seed (12 itens)
- [ ] `docs/AUDITORIA.md` existe com checklist
- [ ] `pnpm audit:run` roda os 4 helpers e produz output legível
- [ ] `CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md` atualizados com nova realidade monorepo
- [ ] README.md raiz reescrito explicando monorepo, comandos, deploy

## 18. Próximas etapas

1. **Spec self-review** (Claude, antes de pedir review do usuário)
2. **User review do spec** (este documento)
3. **Invocar `superpowers:writing-plans`** pra gerar plano detalhado de execução
4. **Executar Foundation** (subagent-driven OU step-by-step com review)
5. **Auditoria fim de Foundation** (full audit conforme §13)
6. **Iniciar brainstorm sub-projeto 2 (Cantina admin)** com novo spec → plano → execução

---

*Foundation design — 2026-05-05 — fiap-mdi-cp2-cantina-app*
