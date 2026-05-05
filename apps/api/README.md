# @cantina/api

API REST em Hono + Drizzle + Postgres pro app cantina FIAP. Roda em Node 20+, deploy em Render.

## Stack

- **Hono 4** — framework HTTP minimalista (Express-compatible)
- **Drizzle ORM** + **drizzle-kit** — schema-first ORM com migrations
- **Postgres** (Neon em prod, **pglite** in-memory em dev/test)
- **Zod** — validacao (request body + JWT payload + env vars)
- **jose** — JWT HS256
- **`@node-rs/argon2`** — password hashing (OWASP 2024 params)
- **pino** — JSON logs em prod, pretty em dev
- **tsup** — build
- **vitest** + pattern via `app.request()`

## Endpoints

| Metodo | Path | Auth | Descricao |
|---|---|---|---|
| GET | `/api/v1/health` | — | uptime + env |
| POST | `/api/v1/auth/register` | — | cria user + retorna JWT |
| POST | `/api/v1/auth/login` | — | autentica + retorna JWT |
| GET | `/api/v1/auth/me` | ok | user atual |
| GET | `/api/v1/items` | ok | lista items disponiveis (filtro `?categoria=`) |
| GET | `/api/v1/items/:id` | ok | item por ID |
| POST | `/api/v1/orders` | ok | cria pedido (server gera senha + estimativa) |
| GET | `/api/v1/orders` | ok | pedidos do user |
| GET | `/api/v1/orders/:id` | ok | pedido por ID (404 se for de outro user) |
| PATCH | `/api/v1/orders/:id/status` | ok | so `cancelado` (em pedidos pendentes) |
| GET | `/api/v1/favorites` | ok | lista items favoritados |
| POST | `/api/v1/favorites/:itemId` | ok | adiciona (idempotente) |
| DELETE | `/api/v1/favorites/:itemId` | ok | remove |

Auth via header `Authorization: Bearer <jwt>`.

## Background jobs

- **`startPromoteJob(db)`** (`src/jobs/promote-orders.ts`): a cada 30s promove pedidos `pendente -> pronto` quando `prontoEmEstimado <= now`. Reentrancy guard interno. Iniciado em `src/index.ts` no boot.

## Dev

```powershell
$env:USE_PGLITE="true"
$env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm db:migrate
pnpm db:seed
pnpm dev   # http://localhost:8787
```

## Tests

```powershell
pnpm test            # vitest
pnpm test:watch
```

## Build prod

```powershell
pnpm build           # gera dist/index.js via tsup
pnpm start           # node dist/index.js
```

## Env vars

Ver `.env.example`. Criticas:

- `DATABASE_URL` (Postgres) — required em prod (`USE_PGLITE=false`)
- `JWT_SECRET` — min 32 chars, fail-fast no boot
- `ALLOWED_ORIGINS` — required em prod, `*` rejeitado
- `USE_PGLITE=true` em dev/test — bypassa DATABASE_URL e usa pglite in-memory

## Deploy

Ver `../../docs/DEPLOY.md` (Neon + Render).
