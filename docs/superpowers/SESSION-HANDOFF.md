# Session Handoff — Foundation execution

> **Para retomar em outra sessão:** este doc é o ponto de entrada. Lê isso → lê os 3 abaixo → prossegue.

**Última sessão:** 2026-05-05
**Branch:** `feat/foundation` (10 commits à frente de `main`)
**Stage:** Phases 1 e 2 do plano executadas; pausa antes da Phase 3.

## 📚 Docs prioritários (ler nesta ordem)

1. [docs/superpowers/specs/2026-05-05-foundation-design.md](specs/2026-05-05-foundation-design.md) — spec aprovado (estado-alvo)
2. [docs/superpowers/plans/2026-05-05-foundation-plan.md](plans/2026-05-05-foundation-plan.md) — plano executável (~50 tasks em 10 phases)
3. [CLAUDE.md](../../CLAUDE.md) — convenções do projeto + autor único `jota0802`
4. **Memória persistente** em `C:\Users\jotin\.claude\projects\c--Users-jotin-Documents-fiap-mdi-cp2-cantina-app\memory\` — feedback, project status, paths

## ✅ O que está feito (10 commits em `feat/foundation`)

```
884d1e4 fix(api): items com name/descricao raw + nameKey/descricaoKey nullable
00f96f2 feat(api): seed inicial com 12 itens (referencia keys i18n existentes)
96709c5 feat(api): schema drizzle (users, items, orders, order_items, favorites)
be0599f fix(api): bloqueia ALLOWED_ORIGINS=* em production e remove default permissivo
ab2210a feat(api): drizzle config + DB factory (Postgres ou pglite por env)
6cc51c1 feat(api): scaffold apps/api com Hono + tsup + vitest + pino + env validation
53eec97 feat(shared): cria packages/shared scaffold (zod + vitest)
262a6f9 chore(monorepo): remove npm lockfile e corrige script check pos-review
c9f680a refactor(monorepo): move Expo app pra apps/mobile e cria root package.json meta
6e51824 chore(monorepo): adiciona pnpm-workspace.yaml + .npmrc + tsconfig.base.json
```

### Phase 1 — Monorepo skeleton ✅
- `pnpm-workspace.yaml`, `.npmrc`, `tsconfig.base.json` na raiz
- Expo app movido pra `apps/mobile/` via `git mv` (preserva histórico)
- `packages/shared/` scaffold com Zod + Vitest (vazio, populado em Phase 3)
- Root `package.json` (cantina-monorepo) com scripts `pnpm -r`, `concurrently`, `audit:run`
- pnpm 10.30.3 funcionando (instalado standalone — `C:\Users\jotin\AppData\Local\pnpm\`)

### Phase 2 — API skeleton ✅
- `apps/api/` com Hono 4 + tsup + vitest + pino + env Zod-validated
- DB factory (`apps/api/src/db/client.ts`) com switch Postgres ↔ pglite por env
- Drizzle schema completo (users, items, orders, order_items, favorites)
- Migration 0000_initial + 0001_items_name_descricao_raw aplicadas em pglite local
- Seed dos 12 itens (espelha `apps/mobile/data/cardapio.ts`)
- `dev.db/` (pglite) gitignored

### Fixes load-bearing (não estavam no plano)
- **`be0599f` security CORS:** removido default `'*'` em ALLOWED_ORIGINS, fail-fast no boot prod, dev fallback é lista Expo explícita
- **`884d1e4` schema items:** spec assumia todos com nameKey notNull, mas 6 dos 12 itens (pratos brasileiros: Cappuccino, Pão de Queijo, Coxinha, Açaí, Brigadeiro, Croissant) não têm tradução. Schema agora tem `name + descricao` raw notNull e `nameKey + descricaoKey` nullable. Seed populou conforme.

## ⏳ O que falta — começar por aqui na próxima sessão

### Phase 3 — Shared schemas + auth helpers (4 tasks)
Plano §3 a §3.4. Detalhes verbatim em [docs/superpowers/plans/2026-05-05-foundation-plan.md](plans/2026-05-05-foundation-plan.md):

- **Task 3.1** Zod schemas em `packages/shared/src/schemas/` (auth, user, item, order) + tipos derivados + teste em `auth.test.ts`
- **Task 3.2** `apps/api/src/lib/password.ts` (argon2) + `jwt.ts` (jose HS256) com TDD completo
- **Task 3.3** Middleware `requireAuth` + `errorHandler` (refactor de `app.ts` pra usar handler centralizado)
- **Task 3.4** Test fixtures (`apps/api/src/test/db.ts` createTestDb pglite + fixtures createTestUser/createTestItem)

### Phase 4 — Auth endpoints (1 task complex, TDD denso)
- **Task 4.1** `/auth/register`, `/auth/login`, `/auth/me` com 9+ testes TDD. Mount em `app.ts` com DI do db.

### Phase 5 — Items + Orders + Favorites endpoints (4 tasks)
- 5.1 Items (list + get com filtro categoria)
- 5.2 Orders (list/get/create/cancel) com senha sequencial e estimativa
- 5.3 Auto-promote pendente→pronto job (setInterval 30s)
- 5.4 Favorites (list/add/remove idempotente)

### Phase 6 — Mobile React Query + AuthContext (2 tasks)
- 6.1 Instalar RQ + persister + criar `apps/mobile/lib/api/client.ts`
- 6.2 Reescrever `AuthContext.tsx` consumindo API

### Phase 7 — Mobile migration (3 tasks)
- 7.1 useItems + cardapio screen consome /items
- 7.2 useOrders + OrdersContext facade
- 7.3 useFavorites + FavoritesContext facade

### Phase 8 — Dark mode B (2 tasks)
- 8.1 Tokens novos em `theme.ts` (neutro near-black) + elevation system dual
- 8.2 Validar shadows hardcoded fora do theme

### Phase 9 — Cleanup + audit + deploy (4 tasks)
- 9.1 Cleanup hash.ts legado, migrar `validation.test.mjs` pra Vitest em shared
- 9.2 `docs/AUDITORIA.md` + 4 scripts em `scripts/`
- 9.3 `render.yaml` + GitHub Actions CI
- 9.4 Provisionar Neon + Render — primeiro deploy

### Phase 10 — Docs final + audit full (3 tasks)
- 10.1 README raiz + per-app
- 10.2 HANDOFF.md + ROADMAP.md atualizados
- 10.3 Auditoria full + report em `docs/superpowers/audits/`

## 🎯 Como retomar — instrução pro próximo agente

1. **Leia este SESSION-HANDOFF.md inteiro**
2. Leia memória em `~/.claude/projects/c--*/memory/MEMORY.md` + entradas relevantes
3. Confirme estado:
   ```powershell
   git status                              # esperado: clean
   git branch --show-current              # esperado: feat/foundation
   git log --oneline ^main HEAD | wc -l   # esperado: 10
   pnpm --filter @cantina/api typecheck   # exit 0
   pnpm --filter @cantina/shared typecheck # exit 0
   pnpm --filter @cantina/mobile typecheck # exit 0
   ```
4. Confirme com o usuário "Vamos retomar Phase 3?" antes de dispatchar nada
5. Use **subagent-driven-development** com **modular complexity** (regra do user):
   - Tasks scaffold/config → implementer + spot-check (sem reviewers formais)
   - Tasks com lógica/TDD → impl + spec review + code quality review
   - Tasks de cleanup → impl + spec review
6. **NUNCA** subverter regra de autor — todo commit como `jota0802`. Se algum subagent tentar trocar autor (consultando HANDOFF.md velho), AMEND com `--reset-author` imediatamente.

## ⚠️ Lições aprendidas nesta sessão (importantes)

1. **Subagents leem HANDOFF.md velho** que ainda mencionava distribuição entre 4 RMs. Resultado: 1 commit foi feito como `lucksza` antes de eu pegar e amendear. **No próximo dispatch, ser MUITO explícito no prompt: "use o git config atual, NÃO use --author flag, NÃO consulte distribuição em HANDOFF.md"**.

2. **`pnpm install --frozen-lockfile`** vai falhar até atualizar a tag `packageManager` em `package.json` raiz pra `pnpm@10.30.3` (já feito; o plano dizia 9.15.0 mas implementer corrigiu).

3. **pglite armazena DB como diretório**, não arquivo. Pra resetar: `rm -rf apps/api/dev.db` (pasta inteira). `.gitignore` `apps/api/dev.db*` cobre.

4. **Migrations destrutivas em pglite local:** se schema muda em coluna NOT NULL, pglite reclama dos dados existentes. Reset = `rm -rf apps/api/dev.db && pnpm api:db:migrate && pnpm api:db:seed`.

5. **`tsx --env-file=.env`** funciona, mas se `.env` não existe ainda, **falha**. Garantir que `apps/api/.env` exista antes de rodar `db:migrate` etc.

6. **CORS security:** `ALLOWED_ORIGINS=*` é tentador como default mas é vulnerabilidade. Sempre fail-fast em prod sem allowlist explícito. (Fixado em `be0599f`).

7. **Schema do plano nem sempre bate com o data real do mobile** — o plano assumiu todos os items com nameKey, realidade tem 6 sem. Sempre cross-check com `apps/mobile/data/` antes de gerar migration final.

8. **Subagent dispatch é caro em context** — cada um custa ~30-50K tokens. Modular por complexidade (skip reviewers em tasks triviais) é essencial pra plano de 50 tasks.

## 🧠 Memória persistente — o que está salvo

Em `C:\Users\jotin\.claude\projects\c--Users-jotin-Documents-fiap-mdi-cp2-cantina-app\memory\`:

- `MEMORY.md` — index
- `user_profile.md` — quem é o usuário, contexto FIAP→portfolio
- `feedback_solo_author.md` — autor único jota0802
- `feedback_deploy_render_neon.md` — escolha Render+Neon
- `feedback_dark_mode_b.md` — direção B (neutro near-black)
- `feedback_collaboration_style.md` — momentum + delega + auditoria
- `project_subproject_decomposition.md` — Foundation→Admin→Customer v2
- `project_foundation_status.md` — atualizar com Phase 1+2 done
- `reference_paths.md` — locais canônicos

## 🚀 Quick start dev (sanidade)

```powershell
# Subir API local com pglite (sem precisar de Neon)
$env:USE_PGLITE="true"
$env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm api:dev
# → http://localhost:8787/api/v1/health retorna { status: 'ok' }

# Em outro terminal, mobile
pnpm mobile:start
```

Mobile ainda usa AsyncStorage — backend só entra a partir da Phase 6.

## 📦 Estrutura atual do repo

```
fiap-mdi-cp2-cantina-app/
├── apps/
│   ├── api/                                    # Hono + Drizzle + Postgres/pglite
│   │   ├── src/
│   │   │   ├── env.ts                          # Zod-validated env (CORS hardened)
│   │   │   ├── lib/logger.ts                   # pino
│   │   │   ├── app.ts                          # Hono instance + middleware + /health
│   │   │   ├── index.ts                        # bootstrap + graceful shutdown
│   │   │   ├── db/
│   │   │   │   ├── client.ts                   # factory: pglite OR pg
│   │   │   │   ├── schema.ts                   # users/items/orders/order_items/favorites
│   │   │   │   ├── seed.ts                     # 12 itens
│   │   │   │   ├── migrate.ts
│   │   │   │   └── reset.ts
│   │   │   └── test/setup.ts
│   │   ├── drizzle/
│   │   │   ├── 0000_initial.sql
│   │   │   ├── 0001_items_name_descricao_raw.sql
│   │   │   └── meta/{0000,0001}_snapshot.json
│   │   ├── package.json (dotenv, hono, drizzle-orm, jose, argon2, etc.)
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── vitest.config.ts
│   │   ├── drizzle.config.ts
│   │   ├── .env.example
│   │   └── .env (gitignored, USE_PGLITE=true)
│   └── mobile/                                 # Expo app (inalterado funcionalmente)
│       ├── (todas as 15 telas, 11 components, 6 contexts, etc.)
│       ├── package.json (@cantina/mobile)
│       ├── tsconfig.json (estende ../../tsconfig.base.json + paths @cantina/shared)
│       └── metro.config.js (workspace-aware)
├── packages/
│   └── shared/                                 # @cantina/shared
│       ├── src/{index,types,schemas,validation,i18n}/.../  (vazio até Phase 3)
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── docs/
│   ├── superpowers/
│   │   ├── specs/2026-05-05-foundation-design.md
│   │   ├── plans/2026-05-05-foundation-plan.md
│   │   └── SESSION-HANDOFF.md                  ← este doc
│   ├── HANDOFF.md (legado CP2)
│   ├── ROADMAP.md (legado CP2)
│   └── ... (aulas, prints, PDF)
├── scripts/                                    # vazio (criado em Phase 9)
├── package.json                                # cantina-monorepo (root meta)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── .npmrc                                      # node-linker=hoisted
├── .gitignore                                  # + pnpm-debug.log* + apps/api/dev.db*
├── eslint.config.js (legado, será dividido em Phase 9)
├── CLAUDE.md (atualizado)
└── README.md (legado, será reescrito Phase 10)
```

## 🟢 Veredicto

Foundation tá com **20% executado** (2 de 10 phases). Phase 3-5 (auth + endpoints + jobs) é o coração — uma vez feito, mobile pode começar a consumir API (Phase 6+). Estimo **2-3 sessões** mais pra fechar Foundation completo.
