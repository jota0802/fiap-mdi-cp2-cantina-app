# Session Handoff — Foundation execution

> **Para retomar em outra sessão:** este doc é o ponto de entrada. Lê isso → lê os 3 abaixo → prossegue.

**Última sessão:** 2026-05-05 (sessão 3 — Phases 3, 4 e 5 no mesmo dia)
**Branch:** `feat/foundation` (26 commits à frente de `main`)
**Stage:** Phases 1-5 do plano executadas; pausa antes da Phase 6 (mobile React Query + AuthContext rewrite).

## 📚 Docs prioritários (ler nesta ordem)

1. [docs/superpowers/specs/2026-05-05-foundation-design.md](specs/2026-05-05-foundation-design.md) — spec aprovado (estado-alvo)
2. [docs/superpowers/plans/2026-05-05-foundation-plan.md](plans/2026-05-05-foundation-plan.md) — plano executável (~50 tasks em 10 phases)
3. [CLAUDE.md](../../CLAUDE.md) — convenções do projeto + autor único `jota0802`
4. **Memória persistente** em `C:\Users\jotin\.claude\projects\c--Users-jotin-Documents-fiap-mdi-cp2-cantina-app\memory\` — feedback, project status, paths

## ✅ O que está feito (26 commits em `feat/foundation`)

```
c411637 fix(api): hardenings Phase 5 pos code-review
5c58184 feat(api): rotas /favorites (list/add/remove) idempotentes com allowlist reusado
524e111 feat(api): job auto-promote pedidos pendente->pronto via prontoEmEstimado
99dec5e feat(api): rotas /orders (CRUD + cancel) com senha sequencial UTC e estimativa
dd38bee feat(api): rotas /items (list + get) com filtro categoria validado e allowlist
cd5f6cb docs(handoff): salva estado pos-Phase 4 + limpa spec legacy 4-RMs
00eed1e fix(api): hardening auth endpoints pos code-review
11ac0e1 feat(api): rotas /auth/register, /auth/login, /auth/me com testes (TDD)
2a70466 docs(handoff): salva estado da sessao apos Phase 3 do Foundation
d9303db test(api): fixtures (createTestDb pglite, createTestUser, createTestItem)
0c59e05 feat(api): middleware auth (Bearer JWT) + error-handler centralizado
5234c21 fix(api): observabilidade no verifyPassword e zod parse no verifyJwt
a33ad53 feat(api): password (argon2) + jwt (jose HS256) helpers com testes
1cf5aba feat(shared): zod schemas (auth, user, item, order) + tipos derivados + testes
c272113 docs(handoff): salva estado da sessao apos Phases 1-2 do Foundation
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
- **`5234c21` observabilidade + segurança JWT:** code-review do Task 3.2 apontou (a) `verifyPassword` silenciava todos os erros (incluindo native binding broken → silent lockout em prod) — agora loga via pino antes de retornar false; (b) `verifyJwt` usava `as string` casts unsafe que escondiam claims ausentes — agora valida via `JwtPayloadSchema.parse(payload)` (Zod). Token com claims faltando agora throwa ZodError handled pelo errorHandler.

### Phase 3 — Shared schemas + auth helpers ✅
- Zod schemas em `packages/shared/src/schemas/` (auth, user, item, order) — `ItemSchema` ajustado pro drift do schema (nameKey/descricaoKey nullable, name/descricao raw notNull)
- 6 testes de schema em `packages/shared/src/schemas/auth.test.ts`
- `apps/api/src/lib/password.ts` (argon2) + `jwt.ts` (jose HS256) com TDD completo (3 + 3 testes)
- `apps/api/src/lib/errors.ts` — `HTTPError` class + 6 factory helpers (conflict, unauthorized, forbidden, notFound, badRequest, validationError)
- `apps/api/src/middleware/auth.ts` — `requireAuth` Bearer JWT + `ContextVariableMap` augmentation (`c.get('user'): JwtPayload`)
- `apps/api/src/middleware/error-handler.ts` — handler centralizado tratando `HTTPError` + `ZodError` + fallback INTERNAL
- `apps/api/src/test/db.ts` — `createTestDb` (pglite efêmero por teste) + migrate
- `apps/api/src/test/fixtures.ts` — `createTestUser` (retorna `{user, password, token}`) + `createTestItem` (com defaults pra `name`/`descricao` notNull)

### Phase 4 — Auth endpoints ✅
- `apps/api/src/routes/auth.ts` exporta `createAuthRoutes(db)` (async — DUMMY_HASH computado no startup)
- 3 endpoints: `POST /register`, `POST /login`, `GET /me` (todas montadas em `/api/v1/auth`)
- 9 testes TDD em `auth.test.ts` (3 register + 3 login + 3 me) — total da API agora 15/15
- `app.ts` refatorado pra `async createApp(injected?: { db?: DB })` com DI — `index.ts` faz `await createApp()`
- `validateJson()` helper que re-throwa ZodError pra errorHandler responder 422 (não o 400 default do zValidator)
- `toPublicUser()` allowlist explícito tipado como `PublicUser` de `@cantina/shared` — protege contra leak de novos campos
- `assertValidRole()` runtime guard substitui cast inseguro `as 'customer' | 'staff'`
- **Fix de timing oracle:** login sempre roda argon2 verify (contra hash real ou DUMMY_HASH constante) → não dá mais pra enumerar emails registrados

### Phase 5 — Items + Orders + Favorites endpoints ✅
- `apps/api/src/lib/zod-hono.ts` — `validateJson()` extraído de auth.ts pra ser reusado (auth + orders agora compartilham)
- `apps/api/src/lib/estimativa.ts` — `calcularEstimativa(pendingCount): number` (90s base + 60s/pendente, cap 600s)
- **Items** (`/items`, `/items/:id`): `categoria` query param validado contra `CategoriaSchema` (400 em valor inválido); `toPublicItem` allowlist exportado pra reuso
- **Orders** (`/orders` POST/GET/list, `/orders/:id` GET, `/orders/:id/status` PATCH): `nextSenha` UTC-deterministic, `nameSnapshot: item.name` (raw notNull, não nameKey), allowlist `toPublicOrder` + `toPublicOrderItem`, conditional `canceladoEm` stamp só quando status='cancelado'
- **Promote-orders job** (`apps/api/src/jobs/promote-orders.ts`): `tickOnce(db)` exportado pra teste determinístico; `startPromoteJob(db)` envolve em setInterval 30s com reentrancy guard; integrado em `index.ts` com graceful shutdown
- **Favorites** (`/favorites` GET, `/favorites/:itemId` POST/DELETE): preflight check de item existência (404 limpo em vez de FK violation 500); reuso do `toPublicItem` de items.ts
- 35 testes total (5 items + 7 orders + 4 promote-orders job + 2 favorites + 9 auth + 6 jwt/password + 6 outros antigos)

## ⏳ O que falta — começar por aqui na próxima sessão

### Phase 6 — Mobile API client + React Query + AuthContext rewrite (2 tasks)

### Phase 6 — Mobile React Query + AuthContext (2 tasks) ← retomar aqui
- 6.1 Instalar RQ + persister + criar `apps/mobile/lib/api/client.ts`
- 6.2 Reescrever `AuthContext.tsx` consumindo API

## 🐛 Issues conhecidas (deferidas, documentar antes de produção)

Phase 5 code review identificou 4 issues que NÃO foram fixadas agora porque o ROI ou a urgência não justificavam atraso:

- **C1 — `nextSenha` race condition:** dois POST /orders simultâneos no mesmo segundo podem gerar a mesma senha. Sem unique constraint no `(tenantId, DATE(criadoEm), senha)`. Cantina FIAP é low-traffic (single instance Render free tier), então o risco prático é baixo. **Fix antes de sub-projeto 2 (Cantina admin)** que aumenta concorrência. Solução: unique index + retry on 23505 OR `INSERT ... RETURNING` com sub-select.
- **I2 — `GET /favorites` retorna items unavailable:** sem filtro `disponivel: true`. UX-ambíguo por design (mostrar item favoritado mesmo unavailable vs filtrar silenciosamente). Decisão fica pra Phase 6 quando o mobile consumir.
- **I4 — N+1 em `GET /orders`:** `fetchOrderWithItems` re-fetch o order + itens por iteração; lista com 30 pedidos = 61 round-trips. Acceptable hoje; refator pra `inArray(orderItems.orderId, orderIds)` na Phase 6 pass quando o mobile carregar listas grandes.
- **M2 — `createTestItem` double-spread brittle:** o pattern `{ slug: overrides.slug ?? default, ...overrides }` permite override mas é confuso. Defer pra próxima vez que tocar fixtures.

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

## ⚠️ Lições aprendidas (acumuladas das sessões 1-3)

1. **Subagents leem HANDOFF.md velho** que ainda mencionava distribuição entre 4 RMs. Resultado: 1 commit foi feito como `lucksza` antes de eu pegar e amendear. **Em todo dispatch, ser MUITO explícito no prompt: "use o git config atual, NÃO use --author flag, NÃO consulte distribuição em HANDOFF.md"**. Funcionou bem na sessão 3 — todos os 5 commits da Phase 3 saíram como `jota0802` direto.

2. **`pnpm install --frozen-lockfile`** vai falhar até atualizar a tag `packageManager` em `package.json` raiz pra `pnpm@10.30.3` (já feito; o plano dizia 9.15.0 mas implementer corrigiu).

3. **pglite armazena DB como diretório**, não arquivo. Pra resetar: `rm -rf apps/api/dev.db` (pasta inteira). `.gitignore` `apps/api/dev.db*` cobre.

4. **Migrations destrutivas em pglite local:** se schema muda em coluna NOT NULL, pglite reclama dos dados existentes. Reset = `rm -rf apps/api/dev.db && pnpm api:db:migrate && pnpm api:db:seed`.

5. **`tsx --env-file=.env`** funciona, mas se `.env` não existe ainda, **falha**. Garantir que `apps/api/.env` exista antes de rodar `db:migrate` etc.

6. **CORS security:** `ALLOWED_ORIGINS=*` é tentador como default mas é vulnerabilidade. Sempre fail-fast em prod sem allowlist explícito. (Fixado em `be0599f`).

7. **Schema do plano nem sempre bate com o data real do mobile** — o plano assumiu todos os items com nameKey, realidade tem 6 sem. Sempre cross-check com `apps/mobile/data/` antes de gerar migration final. **Sessão 3 reconfirmou:** Task 3.1 ItemSchema (Zod) e Task 3.4 createTestItem (fixture) precisaram dos campos `name`/`descricao` adicionados manualmente — o plano só tinha `nameKey`/`descricaoKey`.

8. **Subagent dispatch é caro em context** — cada um custa ~30-50K tokens. Modular por complexidade (skip reviewers em tasks triviais) é essencial pra plano de 50 tasks. **Aplicado na sessão 3:** Tasks 3.1 e 3.3 (schemas + middleware com exact-code) usaram spot-check direto; Task 3.2 (segurança/TDD) usou impl + spec review + code quality review formal — código ficou melhor por causa do review (2 issues importantes pegos: silenciamento de erros, cast unsafe).

9. **Code review apanhou bugs reais** mesmo em código com exact-code do plano. O reviewer da Task 3.2 sugeriu logger no `verifyPassword` (silent lockout em prod) e Zod parse no `verifyJwt` (claims ausentes silently undefined). Ambos foram aceitos e implementados em `5234c21`. **Lição:** code review formal vale o custo em tasks de segurança, mesmo quando o plano traz exact-code.

10. **Spec drift — `as string` cast no plano original:** o plano da Task 3.2 instruía `email: payload.email as string` (sem validação). Funcionalmente OK em greenfield, mas defesa em profundidade (Zod parse) é trivial e captura tokens forjados/incompletos. Aplicar Zod parse a qualquer dado externo (req body, JWT payload, env vars) por padrão — já é convenção em `env.ts` e `verifyJwt`.

11. **`zValidator` retorna 400 por default; testes da Phase 4 esperavam 422.** Plano não mencionou. Fix: passar hook `(result) => { if (!result.success) throw result.error; }` pro `zValidator` — ZodError vai pro errorHandler que retorna 422. Helper `validateJson()` em `auth.ts` encapsula isso.

12. **Phase 4 review pegou 2 critical security issues (timing oracle + role cast unsafe) + 1 critical leak (toPublicUser spread).** Mesmo seguindo exact-code do plano, code review formal foi load-bearing. Padrões reaproveitáveis pra Phase 5+:
    - **Allowlist explícito sempre que serializar entity DB pra resposta API.** Nunca `...rest` minus uma coluna — uso lista positiva tipada com schema do shared.
    - **Runtime guard pra qualquer `as` cast em union de literais.** TypeScript não garante valor; DB pode mentir.
    - **Toda operação de auth (login, password change, etc.) deve rodar argon2 unconditionally** — verifyPassword contra DUMMY_HASH se não achou user. Sem timing oracle.
    - **DUMMY_HASH computado no startup**, não per-request. Implica factory async (`async createXxxRoutes(db)`) + `await createXxxRoutes(db)` no mount.

13. **Subagent fez 1 GREEN cycle pros 3 endpoints da Phase 4 ao invés de 3 RED→GREEN cycles separados.** Tests cobrem o estado final corretamente, então não foi regression de qualidade do código — só process gap. Aceitável se exact-code do plano é confiável; menos aceitável se eu estivesse explorando design. Pra próximas tasks, prompt pode ser explícito: "implemente UM grupo de testes/rotas por vez, RED→GREEN, antes de mover pro próximo".

14. **Phase 5 plan tinha 2 drifts vs DB real:** (a) `nameSnapshot: item.nameKey` violaria NOT NULL pra os 6 itens com nameKey null; trocou pra `item.name`. (b) `categoria` query param sem validação (Zod) caía em silent empty result em vez de 400 limpo. Ambos pegos antecipadamente no prompt antes do dispatch.

15. **Code quality review end-of-phase (1 review pra todas as 4 tasks da Phase 5) é mais eficiente que review por task** — pegou issues de integração (race conditions, N+1) que reviews atomicos isolados não veriam. Custo equivalente, melhor cobertura. Pattern pra Phase 5+: phase-end review formal, spot-check direto dentro de cada task.

16. **Concurrent senha generation é unguarded.** `nextSenha` faz SELECT COUNT + INSERT (não atomic). Em low-traffic tudo bem; antes de sub-projeto 2 (Cantina admin com volume real), precisa de unique constraint `(tenantId, DATE(criadoEm), senha)` + retry. Documentado em "Issues conhecidas" no fim do handoff.

17. **Inconsistencies UTC vs tenant-local:** `nextSenha` usa UTC midnight pra reset. Para uma cantina BRT, senhas restartam ~21:00 BRT em vez da meia-noite local. Aceitável MVP; sub-projeto 2 deveria derivar timezone de `tenantId`.

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

Foundation tá com **50% executado** (5 de 10 phases). API toda de pé: auth + items + orders + favorites + auto-promote job. 35/35 testes passando, 0 regressões em todos os fixes. Próximo grande salto é Phase 6: mobile vira cliente da API via React Query (substitui AsyncStorage gradualmente via strangler pattern nos contexts). Estimo **1-2 sessões** mais pra fechar Foundation completo.
