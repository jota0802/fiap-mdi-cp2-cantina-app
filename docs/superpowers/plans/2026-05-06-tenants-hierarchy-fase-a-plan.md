# Sub-projeto 2 / Fase A — Hierarquia de Tenants — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar hierarquia institucional (Unidade → Escola → Cantina), tenant context middleware (criado mas não aplicado nas rotas existentes), endpoint público `/tenants/tree`, CLI `create-staff` com proteções, e proteção em `db:reset`. Deixa o terreno pronto pra Fase B (estoque por cantina) sem quebrar nada existente.

**Architecture:** 3 tabelas separadas (`unidades`, `escolas`, `cantinas`) com FKs explícitas. Tenant resolution via header `X-Cantina-Id` (middleware criado mas não aplicado nesta fase). JWT claim ganha `cantinaId` opcional pra staff. CLI seed só popula hierarquia (zero usuários hardcoded). CLI dedicado `create-staff` cria operadores com senha gerada aleatória, mostrada uma vez. Detecção automática de prod (URL contém `.neon.tech` ou `NODE_ENV=production`) com confirmação interativa por frase exata em comandos destrutivos.

**Tech Stack:** Drizzle ORM 0.36 + drizzle-kit 0.28 (migrations), Postgres (Neon prod) / pglite (dev/test), Hono 4 + jose 5 (JWT), @node-rs/argon2 (hash), @paralleldrive/cuid2 (IDs de usuários — mas tenants têm IDs hardcoded estáveis), Zod 3, Vitest 2, tsx 4, Node `crypto.randomInt` (senha forte).

**Spec:** [`docs/superpowers/specs/2026-05-06-tenants-hierarchy-fase-a-design.md`](../specs/2026-05-06-tenants-hierarchy-fase-a-design.md) (commit `a2e9b08`).

**Pré-requisitos antes de começar:**
- `cd /Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app`
- Branch: `main` (ou crie feature branch se preferir; jota0802 trabalha solo direto em main)
- Banco local OK: `pnpm api:db:migrate && pnpm api:db:seed` aplicáveis
- Baseline verde: `pnpm -r typecheck && pnpm -r test` passando antes de começar
- Git author setado: `git config user.name "jota0802"` e `git config user.email "jvfranco08@gmail.com"`

---

## File Structure

### Arquivos NOVOS (a criar)

| Path | Responsabilidade |
|---|---|
| `apps/api/src/middleware/tenant-context.ts` | Middleware que valida header `X-Cantina-Id`, busca cantina, faz role check pra staff, popula `c.var.cantina` |
| `apps/api/src/middleware/tenant-context.test.ts` | Testes do middleware (cantina inexistente, inativa, staff outra cantina, sem header, customer ok) |
| `apps/api/src/routes/tenants.ts` | Endpoint público `GET /api/v1/tenants/tree` retornando árvore institucional |
| `apps/api/src/routes/tenants.test.ts` | Testes do endpoint (árvore com 6 cantinas, cache header, só ativos) |
| `apps/api/src/scripts/_safety.ts` | Helpers compartilhados: `isProductionTarget`, `confirmInProd`, `gerarSenhaForte` |
| `apps/api/src/scripts/_safety.test.ts` | Testes dos helpers (detecção de prod com casos: `.neon.tech`, `.aws.`, `localhost`, vazio, `NODE_ENV=production`) |
| `apps/api/src/scripts/create-staff.ts` | CLI pra criar staff com senha gerada |
| `apps/api/drizzle/0002_tenants_hierarchy.sql` | Migration nova (gerada e inspecionada) |
| `packages/shared/src/schemas/tenant.ts` | Zod schemas de tenant DTOs (`UnidadeSchema`, `EscolaSchema`, `CantinaSchema`, `TenantTreeSchema`) |

### Arquivos MODIFICADOS

| Path | O que muda |
|---|---|
| `apps/api/src/db/schema.ts` | Adiciona tabelas `unidades`/`escolas`/`cantinas`; em `users` drop `tenant_id`/`tenantIdx`, add `cantina_id` + index + CHECK; rename `tenant_id` → `cantina_id` em items/orders/favorites; add FK em orders |
| `apps/api/src/db/seed.ts` | Reescreve pra popular só hierarquia (2 unidades + 3 escolas + 6 cantinas). Items removidos (vão pra Fase B) |
| `apps/api/src/db/reset.ts` | Adiciona prompt de confirmação interativa quando alvo é prod |
| `apps/api/src/lib/jwt.ts` | `JwtPayloadSchema` ganha `cantinaId: z.string().optional()` |
| `apps/api/src/lib/jwt.test.ts` | Adiciona casos: staff com cantinaId, customer sem cantinaId |
| `apps/api/src/routes/auth.ts` | Em `/login` e `/register` (futuro, mas register cria customer só), passa `cantinaId: user.cantinaId ?? undefined` no `signJwt` |
| `apps/api/src/routes/auth.test.ts` | Adiciona caso: login de staff (criado via fixture) retorna token com `cantinaId` |
| `apps/api/src/test/fixtures.ts` | Adiciona helper `createTestStaff(db, cantinaId, ...)` e `createTestTenants(db)` |
| `apps/api/src/app.ts` | Mount de `createTenantsRoutes(db)` em `/api/v1/tenants` |
| `apps/api/package.json` | Adiciona script `create-staff` |
| `package.json` (raiz) | Adiciona alias `api:create-staff` |
| `packages/shared/src/schemas/index.ts` | Exporta `tenant.js` |
| `apps/api/src/scripts/.eslintrc` (se existir) ou ignore na raiz | Garante que scripts compilam |
| `CLAUDE.md` | Atualiza convenções (mobile-only já tem; adiciona "tenants são hierárquicos") + comandos novos |
| `docs/HANDOFF.md` | Snapshot pós-Fase A: o que está disponível pra Fase B |
| `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md` | Atualiza estado atual com Fase A entregue |
| `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/MEMORY.md` | Adiciona referência a feedback de hierarquia se necessário |

---

## Task 1: Schema + Migration + Seed (DB foundation)

**Goal:** Criar tabelas de hierarquia, ajustar tabelas existentes, gerar migration, atualizar seed pra popular hierarquia, validar end-to-end localmente.

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Modify: `apps/api/src/db/seed.ts`
- Create: `apps/api/drizzle/0002_tenants_hierarchy.sql` (gerada por drizzle-kit)

### Steps

- [ ] **Step 1.1: Atualizar `apps/api/src/db/schema.ts`**

Adicionar imports e tabelas novas no fim do arquivo, antes dos `export type`:

```typescript
import { pgTable, text, integer, numeric, boolean, timestamp, primaryKey, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ... (manter código existente, mudanças marcadas) ...

export const unidades = pgTable('unidades', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  endereco: text('endereco'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const escolas = pgTable('escolas', {
  id: text('id').primaryKey(),
  unidadeId: text('unidade_id').notNull().references(() => unidades.id, { onDelete: 'restrict' }),
  nome: text('nome').notNull(),
  tipo: text('tipo'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unidadeNomeUnique: uniqueIndex('escolas_unidade_nome_unique').on(t.unidadeId, t.nome),
  unidadeIdx: index('escolas_unidade_idx').on(t.unidadeId),
}));

export const cantinas = pgTable('cantinas', {
  id: text('id').primaryKey(),
  escolaId: text('escola_id').notNull().references(() => escolas.id, { onDelete: 'restrict' }),
  nome: text('nome').notNull(),
  andar: text('andar'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  escolaNomeUnique: uniqueIndex('cantinas_escola_nome_unique').on(t.escolaId, t.nome),
  escolaIdx: index('cantinas_escola_idx').on(t.escolaId),
}));
```

Modificar a tabela `users`: remover `tenantId` e `tenantIdx`, adicionar `cantinaId` + `cantinaIdx` + check constraint:

```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  locale: text('locale').notNull().default('pt'),
  role: text('role').notNull().default('customer'),
  cantinaId: text('cantina_id').references(() => cantinas.id, { onDelete: 'restrict' }),  // NOVO (era tenantId)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email),
  cantinaIdx: index('users_cantina_idx').on(t.cantinaId),  // NOVO (era tenantIdx)
  staffMustHaveCantina: check(
    'users_staff_must_have_cantina',
    sql`role != 'staff' OR cantina_id IS NOT NULL`,
  ),
}));
```

Modificar `items`, `orders`, `favorites`: renomear `tenantId` → `cantinaId`. Em `orders` adicionar FK pra cantina e renomear o índice `tenantDayIdx` → `cantinaDayIdx`:

```typescript
// items: renomear tenantId → cantinaId (sem FK ainda — vem na Fase B)
export const items = pgTable('items', {
  // ... outros campos iguais ...
  cantinaId: text('cantina_id'),  // era tenantId, sem FK ainda
  // ...
}, (t) => ({
  slugUnique: uniqueIndex('items_slug_unique').on(t.slug),
  catIdx: index('items_categoria_idx').on(t.categoria),
}));

// orders: renomear + add FK
export const orders = pgTable('orders', {
  // ... outros campos iguais ...
  cantinaId: text('cantina_id').references(() => cantinas.id, { onDelete: 'restrict' }),  // FK nova
  // ...
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status),
  cantinaDayIdx: index('orders_cantina_day_idx').on(t.cantinaId, t.criadoEm),  // renomeado de tenantDayIdx
}));

// favorites: renomear (sem FK ainda)
export const favorites = pgTable('favorites', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  cantinaId: text('cantina_id'),  // era tenantId, sem FK ainda
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.itemId] }),
}));
```

Adicionar exports de tipos no fim:

```typescript
export type Unidade = typeof unidades.$inferSelect;
export type NewUnidade = typeof unidades.$inferInsert;
export type Escola = typeof escolas.$inferSelect;
export type NewEscola = typeof escolas.$inferInsert;
export type Cantina = typeof cantinas.$inferSelect;
export type NewCantina = typeof cantinas.$inferInsert;
```

- [ ] **Step 1.2: Verificar typecheck básico do schema**

Run: `pnpm --filter @cantina/api typecheck`
Expected: PASS (typecheck verifica que os tipos do schema batem; se falhar, geralmente é import faltando — `check` precisa estar no import do drizzle)

- [ ] **Step 1.3: Gerar migration via drizzle-kit**

Pré-condição: `apps/api/.env` tem `DATABASE_URL` válido (Neon ou pglite). Senão, drizzle-kit reclama. Se o `.env` aponta pra Neon e você está sem 5G, troque temporariamente pra `USE_PGLITE=true` (mas drizzle-kit ainda quer URL válida — pode usar `DATABASE_URL=postgresql://localhost/placeholder`).

Run: `pnpm api:db:generate`
Expected: cria `apps/api/drizzle/0002_<nome_auto>.sql` (Drizzle escolhe o sufixo). Output mostra "✓ generated migrations".

- [ ] **Step 1.4: Renomear migration pra nome explícito**

```bash
cd apps/api/drizzle
ls -la 0002_*  # confirma o nome auto-gerado
mv 0002_<sufixo_auto>.sql 0002_tenants_hierarchy.sql
# Atualizar meta/_journal.json (drizzle rastreia o nome lá):
sed -i '' 's/0002_<sufixo_auto>/0002_tenants_hierarchy/' meta/_journal.json
cd ../../..
```

(Em macOS sed precisa do `''` após `-i`. Em Linux é só `-i`.)

- [ ] **Step 1.5: Inspecionar SQL gerada**

Run: `cat apps/api/drizzle/0002_tenants_hierarchy.sql`

**Validar:**
- Tem `CREATE TABLE unidades`, `CREATE TABLE escolas`, `CREATE TABLE cantinas` com FKs
- Tem `ALTER TABLE users ... DROP COLUMN tenant_id` e `... ADD COLUMN cantina_id`
- Tem `CREATE INDEX users_cantina_idx`, `DROP INDEX users_tenant_idx`
- Tem `ALTER TABLE users ADD CONSTRAINT users_staff_must_have_cantina CHECK (role != 'staff' OR cantina_id IS NOT NULL)`
- Em items/orders/favorites: pode aparecer `DROP COLUMN tenant_id` + `ADD COLUMN cantina_id` (Drizzle não detecta rename automaticamente). **Como o banco será resetado, isso não importa pra dado**, mas a SQL fica feia. Se quiser deixar legível, edita manualmente trocando esses pares por `ALTER TABLE items RENAME COLUMN tenant_id TO cantina_id` e similar — mas atenção: indices que referenciam a coluna antiga precisam ser recreados.

**Decisão padrão:** deixar como Drizzle gerou (DROP+ADD). Banco será resetado, então é só estética. Documentar a decisão no commit message.

- [ ] **Step 1.6: Reescrever `apps/api/src/db/seed.ts` pra popular hierarquia**

Substituir conteúdo inteiro:

```typescript
import { createDb } from './client.js';
import { unidades, escolas, cantinas } from './schema.js';
import { logger } from '../lib/logger.js';

const SEED_UNIDADES = [
  { id: 'u_paulista', nome: 'Paulista' },
  { id: 'u_lins',     nome: 'Lins' },
] as const;

const SEED_ESCOLAS = [
  { id: 'e_paulista_main',  unidadeId: 'u_paulista', nome: 'FIAP Paulista',  tipo: 'main' },
  { id: 'e_lins_school',    unidadeId: 'u_lins',     nome: 'FIAP School',    tipo: 'school' },
  { id: 'e_lins_faculdade', unidadeId: 'u_lins',     nome: 'FIAP Faculdade', tipo: 'faculdade' },
] as const;

const SEED_CANTINAS = [
  // Paulista
  { id: 'c_pa_5',       escolaId: 'e_paulista_main',  nome: '5º andar', andar: '5' },
  { id: 'c_pa_7',       escolaId: 'e_paulista_main',  nome: '7º andar', andar: '7' },
  // Lins School
  { id: 'c_lins_sc_1',  escolaId: 'e_lins_school',    nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_sc_2',  escolaId: 'e_lins_school',    nome: '2º andar', andar: '2' },
  // Lins Faculdade
  { id: 'c_lins_fac_1', escolaId: 'e_lins_faculdade', nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_fac_2', escolaId: 'e_lins_faculdade', nome: '3º andar', andar: '3' },
] as const;

async function main() {
  const db = await createDb();
  logger.info('Seeding hierarquia institucional...');

  await db.insert(unidades).values([...SEED_UNIDADES]).onConflictDoNothing({ target: unidades.id });
  logger.info(`  ↳ ${SEED_UNIDADES.length} unidades`);

  await db.insert(escolas).values([...SEED_ESCOLAS]).onConflictDoNothing({ target: escolas.id });
  logger.info(`  ↳ ${SEED_ESCOLAS.length} escolas`);

  await db.insert(cantinas).values([...SEED_CANTINAS]).onConflictDoNothing({ target: cantinas.id });
  logger.info(`  ↳ ${SEED_CANTINAS.length} cantinas`);

  logger.info('Seed completo ✅');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
```

- [ ] **Step 1.7: Validar local com pglite (reset → migrate → seed)**

Trocar `.env` temporariamente pra pglite (se estiver apontando Neon):
```bash
# apps/api/.env — trocar USE_PGLITE=false pra USE_PGLITE=true
sed -i '' 's/^USE_PGLITE=false/USE_PGLITE=true/' apps/api/.env
```

Run:
```bash
rm -f apps/api/dev.db   # pglite usa arquivo local
pnpm api:db:migrate     # aplica 0000 + 0001 + 0002
pnpm api:db:seed
```

Expected output:
```
INFO: Running migrations...
INFO: Migrations done ✅
INFO: Seeding hierarquia institucional...
INFO:   ↳ 2 unidades
INFO:   ↳ 3 escolas
INFO:   ↳ 6 cantinas
INFO: Seed completo ✅
```

Voltar `.env` pro estado anterior (Neon) se mudou:
```bash
sed -i '' 's/^USE_PGLITE=true/USE_PGLITE=false/' apps/api/.env
```

- [ ] **Step 1.8: Verificar testes ainda passam (regressão)**

Run: `pnpm --filter @cantina/api test`

Expected: 35 tests passando (mesmo número de antes — testes existentes usam pglite com migration, então vão re-aplicar 0002 também). **Se alguma test falhar**, geralmente é porque ele usa `tenantId` direto. Procurar e ajustar:

```bash
grep -rn "tenantId\|tenant_id" apps/api/src/ --include="*.ts"
```

Se encontrar referências em código não-test, ajustar pra `cantinaId`/`cantina_id`. Em test files, ajustar pro mesmo nome.

- [ ] **Step 1.9: Typecheck completo**

Run: `pnpm -r typecheck`
Expected: PASS nos 3 workspaces

- [ ] **Step 1.10: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/src/db/seed.ts apps/api/drizzle/0002_tenants_hierarchy.sql apps/api/drizzle/meta/
# Se grep do step 1.8 encontrou mudanças em outros arquivos, adicionar também

git commit -m "$(cat <<'EOF'
feat(db): hierarquia de tenants (unidades/escolas/cantinas)

- Tabelas novas: unidades, escolas, cantinas com FKs e UNIQUE(parent, nome)
- users: drop tenant_id (legado, nunca usado), add cantina_id (FK opcional)
  com CHECK constraint forçando cantina_id quando role='staff'
- items, orders, favorites: rename tenant_id → cantina_id (Drizzle gerou
  como DROP+ADD; banco resetado então sem perda de dado)
- orders ganha FK pra cantinas; items e favorites ficam sem FK até Fase B
  (junction cantina_items)
- Seed reescrito: popula só hierarquia (2 unidades + 3 escolas + 6 cantinas).
  Items removidos — voltam na Fase B associados a cantinas

Migration 0002_tenants_hierarchy.sql idempotente via onConflictDoNothing
no seed; banco será resetado em prod via Task 6.

Spec: docs/superpowers/specs/2026-05-06-tenants-hierarchy-fase-a-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: JWT cantinaId claim + Tenant Context Middleware

**Goal:** JWT de staff inclui `cantinaId`. Middleware `tenantContext` valida header `X-Cantina-Id`, busca cantina, faz role check, popula contexto. **Não aplicar middleware nas rotas existentes** — fica criado só pra Fase B usar.

**Files:**
- Modify: `apps/api/src/lib/jwt.ts`
- Modify: `apps/api/src/lib/jwt.test.ts`
- Modify: `apps/api/src/routes/auth.ts`
- Modify: `apps/api/src/routes/auth.test.ts`
- Modify: `apps/api/src/test/fixtures.ts`
- Create: `apps/api/src/middleware/tenant-context.ts`
- Create: `apps/api/src/middleware/tenant-context.test.ts`

### Steps

- [ ] **Step 2.1: Atualizar `JwtPayloadSchema` em `apps/api/src/lib/jwt.ts`**

Editar o schema pra incluir `cantinaId` opcional:

```typescript
const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.enum(['customer', 'staff']),
  locale: z.string(),
  cantinaId: z.string().optional(),  // NOVO: presente só pra staff
});
```

A função `signJwt` não precisa mudar (já passa o payload todo via spread). `verifyJwt` também não muda.

- [ ] **Step 2.2: Adicionar testes pra JWT em `apps/api/src/lib/jwt.test.ts`**

Adicionar dentro do `describe` existente (ou criar um novo `describe('JWT cantinaId claim')`):

```typescript
import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt } from './jwt.js';

describe('JWT cantinaId claim', () => {
  it('inclui cantinaId quando passado (staff)', async () => {
    const token = await signJwt({
      sub: 'u_test', email: 't@t.com', role: 'staff', locale: 'pt', cantinaId: 'c_pa_5',
    });
    const payload = await verifyJwt(token);
    expect(payload.cantinaId).toBe('c_pa_5');
    expect(payload.role).toBe('staff');
  });

  it('omite cantinaId quando não passado (customer)', async () => {
    const token = await signJwt({
      sub: 'u_test', email: 't@t.com', role: 'customer', locale: 'pt',
    });
    const payload = await verifyJwt(token);
    expect(payload.cantinaId).toBeUndefined();
    expect(payload.role).toBe('customer');
  });
});
```

- [ ] **Step 2.3: Rodar tests do jwt — devem passar (mudança era só schema opcional)**

Run: `pnpm --filter @cantina/api test src/lib/jwt.test.ts`
Expected: PASS (todos os existentes + 2 novos)

- [ ] **Step 2.4: Atualizar `apps/api/src/routes/auth.ts` pra incluir `cantinaId` no token**

Em `/register` e `/login`, ao chamar `signJwt`, passar `cantinaId: user.cantinaId ?? undefined`:

Localizar as 2 chamadas existentes (linhas ~53 e ~63 hoje):

```typescript
// Antes (em ambos register e login):
const token = await signJwt({
  sub: user.id,
  email: user.email,
  role: assertValidRole(user.role),
  locale: user.locale,
});

// Depois:
const token = await signJwt({
  sub: user.id,
  email: user.email,
  role: assertValidRole(user.role),
  locale: user.locale,
  cantinaId: user.cantinaId ?? undefined,  // NOVO
});
```

(Para customer, `user.cantinaId` é `null` no DB → vira `undefined` → não vai pro JWT.)

- [ ] **Step 2.5: Adicionar helper `createTestStaff` em `apps/api/src/test/fixtures.ts`**

**Atualizar o import do schema no topo do arquivo** (já tem `users, items`; adicionar os novos):

```typescript
import { users, items, unidades, escolas, cantinas } from '../db/schema.js';
```

**No fim do arquivo, adicionar:**

```typescript

export async function createTestTenants(db: TestDb) {
  // Cria mínimo pra testes: 1 unidade, 1 escola, 1 cantina
  await db.insert(unidades).values({ id: 'u_test', nome: 'Test Unidade' });
  await db.insert(escolas).values({ id: 'e_test', unidadeId: 'u_test', nome: 'Test Escola', tipo: 'main' });
  await db.insert(cantinas).values({ id: 'c_test', escolaId: 'e_test', nome: 'Test Cantina', andar: '1' });
  return { unidadeId: 'u_test', escolaId: 'e_test', cantinaId: 'c_test' };
}

export async function createTestStaff(
  db: TestDb,
  cantinaId: string,
  overrides: Partial<{ email: string; name: string; password: string }> = {},
) {
  // Reusa createTestUser mas força role='staff' e cantina_id
  const id = createId();
  const password = overrides.password ?? 'senha-teste';
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    id,
    name: overrides.name ?? 'Test Staff',
    email: overrides.email ?? `staff-${id}@test.com`,
    passwordHash,
    role: 'staff',
    locale: 'pt',
    cantinaId,
  }).returning();
  if (!user) throw new Error('failed to create staff');
  const token = await signJwt({
    sub: user.id, email: user.email, role: 'staff', locale: user.locale,
    cantinaId: user.cantinaId ?? undefined,
  });
  return { user, password, token };
}
```

- [ ] **Step 2.6: Adicionar test em `apps/api/src/routes/auth.test.ts` — login de staff inclui cantinaId**

Localizar o `describe('POST /auth/login')` e adicionar caso novo (aos casos existentes):

```typescript
import { createTestTenants, createTestStaff } from '../test/fixtures.js';
import { verifyJwt } from '../lib/jwt.js';

it('login de staff retorna token com cantinaId', async () => {
  const { cantinaId } = await createTestTenants(testDb);
  const staff = await createTestStaff(testDb, cantinaId, { email: 'staff@t.com', password: 'pass123' });

  const res = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@t.com', password: 'pass123' }),
  });
  expect(res.status).toBe(200);
  const json = await res.json() as { token: string };
  const payload = await verifyJwt(json.token);
  expect(payload.cantinaId).toBe(cantinaId);
  expect(payload.role).toBe('staff');
});
```

- [ ] **Step 2.7: Rodar tests de auth — devem passar**

Run: `pnpm --filter @cantina/api test src/routes/auth.test.ts`
Expected: PASS (existentes + 1 novo)

- [ ] **Step 2.8: Criar `apps/api/src/middleware/tenant-context.ts`**

```typescript
import type { MiddlewareHandler } from 'hono';
import { eq, and } from 'drizzle-orm';
import { cantinas } from '../db/schema.js';
import type { Cantina } from '../db/schema.js';
import { badRequest, notFound, forbidden } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

declare module 'hono' {
  interface ContextVariableMap {
    cantina: Cantina;
  }
}

export function tenantContext(db: DB | TestDb): MiddlewareHandler {
  return async (c, next) => {
    const cantinaId = c.req.header('X-Cantina-Id');
    if (!cantinaId) throw badRequest('Header X-Cantina-Id obrigatório nesta rota');

    const [cantina] = await db.select().from(cantinas)
      .where(and(eq(cantinas.id, cantinaId), eq(cantinas.ativo, true)))
      .limit(1);
    if (!cantina) throw notFound('Cantina não existe ou inativa');

    const claim = c.get('user');
    if (claim?.role === 'staff' && claim.cantinaId !== cantinaId) {
      throw forbidden('Staff só pode acessar a própria cantina');
    }

    c.set('cantina', cantina);
    await next();
  };
}
```

Note: factory function que recebe `db` (não usa singleton) — segue o padrão de `createItemsRoutes(db)`. Permite injetar `TestDb` em testes.

- [ ] **Step 2.9: Criar `apps/api/src/middleware/tenant-context.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { tenantContext } from './tenant-context.js';
import { requireAuth } from './auth.js';
import { errorHandler } from './error-handler.js';
import { createTestTenants, createTestStaff, createTestUser } from '../test/fixtures.js';
import { cantinas } from '../db/schema.js';
import { eq } from 'drizzle-orm';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  // Rota dummy protegida por auth + tenantContext, retorna a cantina do contexto
  app.use('/protected', requireAuth);
  app.use('/protected', tenantContext(testDb));
  app.get('/protected', (c) => c.json({ cantina: c.get('cantina') }, 200));
  app.onError(errorHandler);
});

afterEach(async () => { await close(); });

describe('tenantContext middleware', () => {
  it('rejeita request sem header X-Cantina-Id (400)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}` },
    });
    expect(res.status).toBe(400);
  });

  it('rejeita cantina inexistente (404)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}`, 'X-Cantina-Id': 'c_inexistente' },
    });
    expect(res.status).toBe(404);
  });

  it('rejeita cantina inativa (404)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await testDb.update(cantinas).set({ ativo: false }).where(eq(cantinas.id, cantinaId));
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(404);
  });

  it('aceita customer com qualquer cantina ativa', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { cantina: { id: string } };
    expect(json.cantina.id).toBe(cantinaId);
  });

  it('aceita staff acessando a própria cantina', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const s = await createTestStaff(testDb, cantinaId);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${s.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
  });

  it('rejeita staff acessando OUTRA cantina (403)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    // Cria 2a cantina (mesma escola e_test do createTestTenants)
    await testDb.insert(cantinas).values({ id: 'c_outra', escolaId: 'e_test', nome: 'Outra', andar: '2' });
    const s = await createTestStaff(testDb, cantinaId);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${s.token}`, 'X-Cantina-Id': 'c_outra' },
    });
    expect(res.status).toBe(403);
  });
});

describe('CHECK constraint users_staff_must_have_cantina', () => {
  it('rejeita INSERT users com role=staff e cantina_id NULL', async () => {
    // Não usa fixture porque createTestStaff sempre passa cantinaId.
    // Inserção direta pra validar a CHECK constraint do schema.
    const { users } = await import('../db/schema.js');
    const { createId } = await import('@paralleldrive/cuid2');
    const { hashPassword } = await import('../lib/password.js');

    await expect(
      testDb.insert(users).values({
        id: createId(),
        name: 'Bad Staff',
        email: 'bad@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'staff',
        cantinaId: null, // ← CHECK deve barrar
        locale: 'pt',
      })
    ).rejects.toThrow(/users_staff_must_have_cantina|check/i);
  });

  it('aceita INSERT users com role=customer e cantina_id NULL', async () => {
    const { users } = await import('../db/schema.js');
    const { createId } = await import('@paralleldrive/cuid2');
    const { hashPassword } = await import('../lib/password.js');

    const [user] = await testDb.insert(users).values({
      id: createId(),
      name: 'Customer Sem Cantina',
      email: 'c@t.com',
      passwordHash: await hashPassword('senha123'),
      role: 'customer',
      cantinaId: null,
      locale: 'pt',
    }).returning();
    expect(user?.cantinaId).toBeNull();
  });
});
```

- [ ] **Step 2.10: Rodar tests do middleware — devem passar**

Run: `pnpm --filter @cantina/api test src/middleware/tenant-context.test.ts`
Expected: PASS (8 tests = 6 middleware + 2 CHECK constraint)

- [ ] **Step 2.11: Suite completa de tests da API**

Run: `pnpm --filter @cantina/api test`
Expected: 35 (existentes) + 2 (jwt) + 1 (auth) + 8 (middleware + CHECK) = **46 passing**

- [ ] **Step 2.12: Typecheck completo**

Run: `pnpm -r typecheck`
Expected: PASS nos 3 workspaces

- [ ] **Step 2.13: Commit**

```bash
git add apps/api/src/lib/jwt.ts apps/api/src/lib/jwt.test.ts \
        apps/api/src/routes/auth.ts apps/api/src/routes/auth.test.ts \
        apps/api/src/test/fixtures.ts \
        apps/api/src/middleware/tenant-context.ts apps/api/src/middleware/tenant-context.test.ts

git commit -m "$(cat <<'EOF'
feat(api): JWT claim cantinaId + tenant-context middleware

- JwtPayloadSchema: campo opcional cantinaId (Zod optional)
- /auth/register e /auth/login: passa cantinaId no signJwt quando user
  tem cantina_id (staff). Customer continua sem o campo.
- middleware tenant-context.ts: factory(db), valida X-Cantina-Id,
  busca cantina ativa, rejeita 400/404/403 conforme caso, popula
  c.var.cantina pros handlers
- Test fixtures: createTestTenants() + createTestStaff(db, cantinaId)
- 6 testes do middleware cobrindo: sem header, inexistente, inativa,
  customer ok, staff própria cantina, staff outra cantina (403)
- 2 testes de jwt + 1 de auth garantindo claim correto por role

Middleware NAO aplicado nas rotas existentes nesta fase — fica wired
em Fase B junto com cardápio per-cantina pra evitar quebra do mobile
que ainda não envia o header.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Endpoint público GET /tenants/tree

**Goal:** Endpoint sem auth retornando árvore unidades→escolas→cantinas (apenas ativos), com cache 1h. Cliente vai consumir na Fase B.

**Files:**
- Create: `apps/api/src/routes/tenants.ts`
- Create: `apps/api/src/routes/tenants.test.ts`
- Create: `packages/shared/src/schemas/tenant.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Modify: `apps/api/src/app.ts`

### Steps

- [ ] **Step 3.1: Criar `packages/shared/src/schemas/tenant.ts`**

```typescript
import { z } from 'zod';

export const CantinaPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  andar: z.string().nullable(),
});

export const EscolaPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.string().nullable(),
  cantinas: z.array(CantinaPublicSchema),
});

export const UnidadePublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  escolas: z.array(EscolaPublicSchema),
});

export const TenantTreeSchema = z.object({
  unidades: z.array(UnidadePublicSchema),
});

export type CantinaPublic = z.infer<typeof CantinaPublicSchema>;
export type EscolaPublic = z.infer<typeof EscolaPublicSchema>;
export type UnidadePublic = z.infer<typeof UnidadePublicSchema>;
export type TenantTree = z.infer<typeof TenantTreeSchema>;
```

- [ ] **Step 3.2: Atualizar `packages/shared/src/schemas/index.ts`**

```typescript
export * from './auth.js';
export * from './user.js';
export * from './item.js';
export * from './order.js';
export * from './tenant.js';   // NOVO
```

- [ ] **Step 3.3: Verificar typecheck do shared**

Run: `pnpm --filter @cantina/shared typecheck`
Expected: PASS

- [ ] **Step 3.4: Criar `apps/api/src/routes/tenants.ts`**

```typescript
import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { unidades, escolas, cantinas } from '../db/schema.js';
import type { TenantTree } from '@cantina/shared';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createTenantsRoutes(db: DB | TestDb) {
  const app = new Hono();

  app.get('/tree', async (c) => {
    const us = await db.select().from(unidades)
      .where(eq(unidades.ativo, true))
      .orderBy(asc(unidades.nome));
    const es = await db.select().from(escolas)
      .where(eq(escolas.ativo, true))
      .orderBy(asc(escolas.nome));
    const cs = await db.select().from(cantinas)
      .where(eq(cantinas.ativo, true))
      .orderBy(asc(cantinas.andar));

    const tree: TenantTree = {
      unidades: us.map((u) => ({
        id: u.id,
        nome: u.nome,
        escolas: es
          .filter((e) => e.unidadeId === u.id)
          .map((e) => ({
            id: e.id,
            nome: e.nome,
            tipo: e.tipo,
            cantinas: cs
              .filter((cn) => cn.escolaId === e.id)
              .map((cn) => ({ id: cn.id, nome: cn.nome, andar: cn.andar })),
          })),
      })),
    };

    c.header('Cache-Control', 'public, max-age=3600');
    return c.json(tree, 200);
  });

  return app;
}
```

- [ ] **Step 3.5: Mount no `apps/api/src/app.ts`**

Adicionar import e route:

```typescript
// Adicionar import junto dos outros createXRoutes:
import { createTenantsRoutes } from './routes/tenants.js';

// Dentro de createApp, adicionar route ANTES das outras (público vem antes):
app.route('/api/v1/tenants', createTenantsRoutes(db));
app.route('/api/v1/auth', await createAuthRoutes(db));
// ... resto inalterado ...
```

- [ ] **Step 3.6: Criar `apps/api/src/routes/tenants.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createTenantsRoutes } from './tenants.js';
import { errorHandler } from '../middleware/error-handler.js';
import { unidades, escolas, cantinas } from '../db/schema.js';
import { eq } from 'drizzle-orm';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/tenants', createTenantsRoutes(testDb));
  app.onError(errorHandler);
});

afterEach(async () => { await close(); });

describe('GET /api/v1/tenants/tree', () => {
  it('retorna árvore vazia quando não há tenants', async () => {
    const res = await app.request('/api/v1/tenants/tree');
    expect(res.status).toBe(200);
    const json = await res.json() as { unidades: unknown[] };
    expect(json.unidades).toEqual([]);
  });

  it('retorna árvore completa com unidades/escolas/cantinas', async () => {
    await testDb.insert(unidades).values([
      { id: 'u1', nome: 'Unidade 1' },
      { id: 'u2', nome: 'Unidade 2' },
    ]);
    await testDb.insert(escolas).values([
      { id: 'e1', unidadeId: 'u1', nome: 'Escola 1', tipo: 'main' },
      { id: 'e2', unidadeId: 'u2', nome: 'Escola 2', tipo: 'school' },
    ]);
    await testDb.insert(cantinas).values([
      { id: 'c1', escolaId: 'e1', nome: 'Cantina 1', andar: '1' },
      { id: 'c2', escolaId: 'e1', nome: 'Cantina 2', andar: '2' },
      { id: 'c3', escolaId: 'e2', nome: 'Cantina 3', andar: 'T' },
    ]);

    const res = await app.request('/api/v1/tenants/tree');
    expect(res.status).toBe(200);
    const json = await res.json() as { unidades: Array<{ id: string; escolas: Array<{ cantinas: unknown[] }> }> };
    expect(json.unidades).toHaveLength(2);
    expect(json.unidades[0]?.escolas[0]?.cantinas).toHaveLength(2);
    expect(json.unidades[1]?.escolas[0]?.cantinas).toHaveLength(1);
  });

  it('exclui unidades inativas', async () => {
    await testDb.insert(unidades).values([
      { id: 'u1', nome: 'Ativa' },
      { id: 'u2', nome: 'Inativa', ativo: false },
    ]);
    const res = await app.request('/api/v1/tenants/tree');
    const json = await res.json() as { unidades: Array<{ id: string }> };
    expect(json.unidades).toHaveLength(1);
    expect(json.unidades[0]?.id).toBe('u1');
  });

  it('exclui escolas e cantinas inativas', async () => {
    await testDb.insert(unidades).values({ id: 'u1', nome: 'U' });
    await testDb.insert(escolas).values([
      { id: 'e1', unidadeId: 'u1', nome: 'E1', tipo: 'main' },
      { id: 'e2', unidadeId: 'u1', nome: 'E2 inativa', tipo: 'main', ativo: false },
    ]);
    await testDb.insert(cantinas).values([
      { id: 'c1', escolaId: 'e1', nome: 'C1', andar: '1' },
      { id: 'c2', escolaId: 'e1', nome: 'C2 inativa', andar: '2', ativo: false },
    ]);

    const res = await app.request('/api/v1/tenants/tree');
    const json = await res.json() as { unidades: Array<{ escolas: Array<{ id: string; cantinas: Array<{ id: string }> }> }> };
    expect(json.unidades[0]?.escolas).toHaveLength(1);
    expect(json.unidades[0]?.escolas[0]?.cantinas).toHaveLength(1);
    expect(json.unidades[0]?.escolas[0]?.cantinas[0]?.id).toBe('c1');
  });

  it('retorna header Cache-Control public, max-age=3600', async () => {
    const res = await app.request('/api/v1/tenants/tree');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('é endpoint público (sem auth necessária)', async () => {
    // Sem header Authorization
    const res = await app.request('/api/v1/tenants/tree');
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 3.7: Rodar tests do tenants — devem passar**

Run: `pnpm --filter @cantina/api test src/routes/tenants.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 3.8: Smoke test manual contra dev**

Subir API local com pglite:
```bash
# Garantir USE_PGLITE=true no apps/api/.env temporariamente
sed -i '' 's/^USE_PGLITE=false/USE_PGLITE=true/' apps/api/.env
rm -f apps/api/dev.db
pnpm api:db:migrate && pnpm api:db:seed
pnpm api:dev &
sleep 3
curl -s http://localhost:8787/api/v1/tenants/tree | head -50
# Espera JSON com 2 unidades, 3 escolas, 6 cantinas
kill %1
# Voltar .env se mudou
sed -i '' 's/^USE_PGLITE=true/USE_PGLITE=false/' apps/api/.env
```

- [ ] **Step 3.9: Suite completa**

Run: `pnpm -r typecheck && pnpm --filter @cantina/api test`
Expected: typecheck PASS + 52 tests passando (46 anteriores + 6 novos)

- [ ] **Step 3.10: Commit**

```bash
git add apps/api/src/routes/tenants.ts apps/api/src/routes/tenants.test.ts \
        apps/api/src/app.ts \
        packages/shared/src/schemas/tenant.ts packages/shared/src/schemas/index.ts

git commit -m "$(cat <<'EOF'
feat(api): GET /tenants/tree — endpoint publico com arvore institucional

- packages/shared/src/schemas/tenant.ts: TenantTreeSchema +
  UnidadePublicSchema + EscolaPublicSchema + CantinaPublicSchema
  reusaveis pelo mobile
- apps/api/src/routes/tenants.ts: createTenantsRoutes(db) com GET /tree
  retornando arvore filtrada (so ativos) e ordenada (unidades por nome,
  cantinas por andar)
- Mount em app.ts antes das rotas autenticadas — endpoint nao exige auth
- Cache-Control: public, max-age=3600 (mudanca rara)
- 6 testes cobrindo: vazio, completo, exclui inativos em todos niveis,
  cache header, sem auth obrigatoria

Cliente mobile vai consumir na Fase B pra montar seletor de cantina.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: CLI create-staff + safety helpers

**Goal:** Script CLI pra criar usuários staff com senha gerada aleatória, validações, detecção automática de prod com confirmação por frase exata.

**Files:**
- Create: `apps/api/src/scripts/_safety.ts`
- Create: `apps/api/src/scripts/_safety.test.ts`
- Create: `apps/api/src/scripts/create-staff.ts`
- Modify: `apps/api/package.json`
- Modify: `package.json` (raiz)

### Steps

- [ ] **Step 4.1: Criar `apps/api/src/scripts/_safety.ts`**

```typescript
import { randomInt } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Detecta se DATABASE_URL aponta pra ambiente de produção.
 * Heurística: presença de '.neon.tech', '.aws.', ou NODE_ENV=production.
 */
export function isProductionTarget(databaseUrl: string | undefined): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (!databaseUrl) return false;
  return databaseUrl.includes('.neon.tech') || databaseUrl.includes('.aws.');
}

/**
 * Bloqueia execução até user digitar a frase exata. Retorna true se confirmou.
 * Em ambientes não-interativos (stdin não-TTY), retorna false sem prompt.
 */
export async function confirmInProd(phrase: string, message: string): Promise<boolean> {
  if (!input.isTTY) {
    console.error('❌ Sem TTY — confirmação interativa requerida pra prod. Aborte.');
    return false;
  }
  console.log(message);
  console.log(`\nPra continuar, digite a frase exata: ${phrase}\n`);
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question('> ');
    return answer.trim() === phrase;
  } finally {
    rl.close();
  }
}

/**
 * Gera senha forte de 16 caracteres. Exclui caracteres confusos (0/O/o/1/l/I)
 * pra reduzir erro ao copiar do terminal.
 */
export function gerarSenhaForte(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  return Array.from({ length: 16 }, () => chars.charAt(randomInt(chars.length))).join('');
}
```

- [ ] **Step 4.2: Criar `apps/api/src/scripts/_safety.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isProductionTarget, gerarSenhaForte } from './_safety.js';

describe('isProductionTarget', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => { delete process.env.NODE_ENV; });
  afterEach(() => { if (originalNodeEnv) process.env.NODE_ENV = originalNodeEnv; });

  it('retorna true quando NODE_ENV=production (independente de URL)', () => {
    process.env.NODE_ENV = 'production';
    expect(isProductionTarget('postgresql://localhost/dev')).toBe(true);
    expect(isProductionTarget(undefined)).toBe(true);
  });

  it('retorna true pra URL contendo .neon.tech', () => {
    expect(isProductionTarget('postgresql://x:y@ep-foo.us-east-2.aws.neon.tech/db')).toBe(true);
  });

  it('retorna true pra URL contendo .aws.', () => {
    expect(isProductionTarget('postgresql://x:y@host.aws.com/db')).toBe(true);
  });

  it('retorna false pra localhost', () => {
    expect(isProductionTarget('postgresql://localhost:5432/dev')).toBe(false);
    expect(isProductionTarget('postgresql://127.0.0.1/dev')).toBe(false);
  });

  it('retorna false pra URL undefined (sem prod NODE_ENV)', () => {
    expect(isProductionTarget(undefined)).toBe(false);
  });

  it('retorna false pra URL vazia', () => {
    expect(isProductionTarget('')).toBe(false);
  });
});

describe('gerarSenhaForte', () => {
  it('retorna string de exatamente 16 caracteres', () => {
    expect(gerarSenhaForte()).toHaveLength(16);
  });

  it('exclui caracteres confusos (0, O, o, 1, l, I)', () => {
    // Roda 100 vezes pra cobrir aleatoriedade
    for (let i = 0; i < 100; i++) {
      const senha = gerarSenhaForte();
      expect(senha).not.toMatch(/[0OoIl1]/);
    }
  });

  it('gera senhas diferentes a cada chamada', () => {
    const set = new Set(Array.from({ length: 50 }, () => gerarSenhaForte()));
    expect(set.size).toBe(50); // colisão é virtualmente impossível
  });

  it('inclui pelo menos 1 dígito e 1 símbolo na maioria das vezes', () => {
    // Estatisticamente, 16 chars com 60+ opções deveria ter dígito e símbolo
    let temDigitoOuSimbolo = 0;
    for (let i = 0; i < 50; i++) {
      const senha = gerarSenhaForte();
      if (/[\d!@#$%&*]/.test(senha)) temDigitoOuSimbolo++;
    }
    expect(temDigitoOuSimbolo).toBeGreaterThan(45); // tolerância
  });
});
```

(Não testamos `confirmInProd` end-to-end porque exige TTY mock. Validação manual no smoke test.)

- [ ] **Step 4.3: Rodar tests do _safety**

Run: `pnpm --filter @cantina/api test src/scripts/_safety.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 4.4: Criar `apps/api/src/scripts/create-staff.ts`**

```typescript
import { createId } from '@paralleldrive/cuid2';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createDb } from '../db/client.js';
import { users, cantinas, escolas, unidades } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { logger } from '../lib/logger.js';
import { isProductionTarget, confirmInProd, gerarSenhaForte } from './_safety.js';

const ArgsSchema = z.object({
  cantina: z.string().min(1, '--cantina obrigatório'),
  email: z.string().trim().toLowerCase().email('--email inválido'),
  name: z.string().trim().min(2, '--name precisa ≥2 chars'),
});

type Args = z.infer<typeof ArgsSchema>;

function parseArgs(): Args {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.+)$/);
    if (m) args[m[1]!] = m[2]!;
  }
  const result = ArgsSchema.safeParse(args);
  if (!result.success) {
    console.error('❌ Argumentos inválidos:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\nUso: pnpm api:create-staff --cantina=<id> --email=<email> --name="<nome>"');
    process.exit(1);
  }
  return result.data;
}

async function main() {
  const args = parseArgs();
  const db = await createDb();

  // 1. Validar cantina existe e está ativa, e fetch hierarquia pro display
  const [row] = await db
    .select({
      cantinaId: cantinas.id,
      cantinaNome: cantinas.nome,
      cantinaAtivo: cantinas.ativo,
      escolaNome: escolas.nome,
      unidadeNome: unidades.nome,
    })
    .from(cantinas)
    .innerJoin(escolas, eq(cantinas.escolaId, escolas.id))
    .innerJoin(unidades, eq(escolas.unidadeId, unidades.id))
    .where(eq(cantinas.id, args.cantina))
    .limit(1);

  if (!row) {
    console.error(`❌ Cantina '${args.cantina}' não existe.`);
    process.exit(1);
  }
  if (!row.cantinaAtivo) {
    console.error(`❌ Cantina '${args.cantina}' está inativa.`);
    process.exit(1);
  }

  // 2. Validar email único
  const [existing] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
  if (existing) {
    console.error(`❌ Email '${args.email}' já cadastrado (id: ${existing.id}, role: ${existing.role}).`);
    process.exit(1);
  }

  // 3. Confirmação interativa em prod
  if (isProductionTarget(process.env.DATABASE_URL)) {
    const message = `\n⚠️  ATENÇÃO: você vai criar staff em PRODUÇÃO.\n` +
      `   Banco:    ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@')}\n` +
      `   Cantina:  ${row.cantinaNome} (${row.escolaNome}, ${row.unidadeNome})\n` +
      `   Email:    ${args.email}\n` +
      `   Nome:     ${args.name}`;
    const ok = await confirmInProd('criar staff em prod', message);
    if (!ok) {
      console.error('❌ Confirmação não recebida — abortando.');
      process.exit(1);
    }
  }

  // 4. Gerar senha + hash
  const senha = gerarSenhaForte();
  const passwordHash = await hashPassword(senha);

  // 5. Inserir
  const id = createId();
  const [staff] = await db.insert(users).values({
    id,
    name: args.name,
    email: args.email,
    passwordHash,
    role: 'staff',
    locale: 'pt',
    cantinaId: args.cantina,
  }).returning();

  if (!staff) {
    console.error('❌ Falha ao criar staff.');
    process.exit(1);
  }

  console.log('\n✅ Staff criado com sucesso!');
  console.log(`   ID:       ${staff.id}`);
  console.log(`   Email:    ${staff.email}`);
  console.log(`   Nome:     ${staff.name}`);
  console.log(`   Cantina:  ${row.cantinaNome} (${row.escolaNome}, ${row.unidadeNome})`);
  console.log(`   Role:     ${staff.role}`);
  console.log('\n🔑 Senha temporária (anote agora — não aparece de novo):');
  console.log(`   ${senha}\n`);
  console.log('⚠️  Recomendação: peça pro usuário trocar no primeiro login.');
  console.log('   (Endpoint POST /auth/reset-password vai existir na Fase D)\n');

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'create-staff failed');
  process.exit(1);
});
```

- [ ] **Step 4.5: Adicionar script no `apps/api/package.json`**

Localizar bloco `"scripts"` e adicionar antes de `"db:reset"`:

```json
"create-staff": "tsx --env-file-if-exists=.env src/scripts/create-staff.ts",
```

- [ ] **Step 4.6: Adicionar alias no `package.json` da raiz**

Localizar bloco `"scripts"` e adicionar após `"api:db:reset"`:

```json
"api:create-staff": "pnpm --filter @cantina/api create-staff",
```

- [ ] **Step 4.7: Smoke test manual (pglite)**

```bash
# Garantir USE_PGLITE=true e banco com seed
sed -i '' 's/^USE_PGLITE=false/USE_PGLITE=true/' apps/api/.env
rm -f apps/api/dev.db
pnpm api:db:migrate && pnpm api:db:seed

# Teste 1: cantina inexistente — deve falhar
pnpm api:create-staff --cantina=c_nao_existe --email=x@x.com --name="X"
# Espera: ❌ Cantina 'c_nao_existe' não existe.

# Teste 2: criar staff válido
pnpm api:create-staff --cantina=c_pa_5 --email=staff5@dev.local --name="Staff Cinco"
# Espera: ✅ Staff criado com sucesso! + senha temporária

# Teste 3: email duplicado — deve falhar
pnpm api:create-staff --cantina=c_pa_5 --email=staff5@dev.local --name="Outro"
# Espera: ❌ Email 'staff5@dev.local' já cadastrado.

# Teste 4: argumento faltando — deve falhar
pnpm api:create-staff --cantina=c_pa_5
# Espera: ❌ Argumentos inválidos: email, name

# Voltar .env
sed -i '' 's/^USE_PGLITE=true/USE_PGLITE=false/' apps/api/.env
```

- [ ] **Step 4.8: Suite completa**

Run: `pnpm -r typecheck && pnpm --filter @cantina/api test`
Expected: typecheck PASS + 62 tests passando (52 anteriores + 10 do _safety)

- [ ] **Step 4.9: Commit**

```bash
git add apps/api/src/scripts/_safety.ts apps/api/src/scripts/_safety.test.ts \
        apps/api/src/scripts/create-staff.ts \
        apps/api/package.json package.json

git commit -m "$(cat <<'EOF'
feat(scripts): CLI create-staff + safety helpers

scripts/_safety.ts:
- isProductionTarget(url): heurística (.neon.tech / .aws. / NODE_ENV=production)
- confirmInProd(phrase, msg): prompt interativo, exige frase exata digitada
- gerarSenhaForte(): 16 chars random, exclui 0/O/o/1/l/I (ambíguos no terminal)

scripts/create-staff.ts:
- Args via Zod: --cantina, --email, --name
- Valida cantina existe + ativa (com join pra mostrar contexto pro user)
- Valida email único antes do hash
- Em prod: prompt "criar staff em prod" antes de inserir
- Gera senha argon2 hashada, mostra plaintext UMA vez no stdout
- Output rico com hierarquia (cantina, escola, unidade) pra confirmação visual

Testes _safety: 10 casos cobrindo todos os branches de isProductionTarget +
propriedades de gerarSenhaForte (16 chars, sem ambíguos, único por chamada).

Scripts:
- apps/api/package.json: "create-staff" task
- package.json (raiz): alias "api:create-staff"

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Proteção interativa em db:reset

**Goal:** `db:reset` ganha o mesmo prompt de confirmação que `create-staff` quando alvo é prod. Em dev (pglite), passa direto.

**Files:**
- Modify: `apps/api/src/db/reset.ts`

### Steps

- [ ] **Step 5.1: Atualizar `apps/api/src/db/reset.ts`**

```typescript
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
  await db.execute(sql`CREATE SCHEMA public`);
  logger.info('Schema reset. Run db:push or db:migrate next, then db:seed.');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Reset failed');
  process.exit(1);
});
```

- [ ] **Step 5.2: Smoke test pglite (passa direto)**

```bash
sed -i '' 's/^USE_PGLITE=false/USE_PGLITE=true/' apps/api/.env
rm -f apps/api/dev.db
pnpm api:db:migrate && pnpm api:db:seed
pnpm api:db:reset
# Espera: drop + create + log "Schema reset" SEM prompt
sed -i '' 's/^USE_PGLITE=true/USE_PGLITE=false/' apps/api/.env
```

- [ ] **Step 5.3: Smoke test prod (deve pedir confirmação)**

**ATENÇÃO: este step **vai mostrar** o prompt mas você NÃO precisa rodar contra Neon agora — basta validar que o prompt aparece. Cancele com `Ctrl+C` ou digite qualquer outra coisa.**

```bash
# .env já está apontando pro Neon (USE_PGLITE=false)
pnpm api:db:reset
# Espera: prompt "apagar tudo em prod" — DIGITE outra coisa pra abortar
# Output esperado: "❌ Confirmação não recebida — abortando."
```

Confirme que o prompt aparece e o comando aborta sem tocar no banco. Se você quiser realmente resetar prod, isso fica pra Task 6.

- [ ] **Step 5.4: Suite completa**

Run: `pnpm -r typecheck && pnpm --filter @cantina/api test`
Expected: typecheck PASS + 62 tests passando

- [ ] **Step 5.5: Commit**

```bash
git add apps/api/src/db/reset.ts

git commit -m "$(cat <<'EOF'
chore(scripts): protecao interativa em db:reset

db:reset ganha o mesmo prompt confirmInProd do create-staff:
- Em dev (pglite, localhost): executa direto, sem prompt
- Em prod (.neon.tech / NODE_ENV=production): exige digitar
  "apagar tudo em prod" antes de DROPPAR o schema

Reusa helpers _safety.ts criados na Task 4. Custo: 5 linhas.
Ganho: nunca mais resetar prod por acidente.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Aplicar Fase A no Neon (reset + migrate + seed)

**Goal:** Resetar o banco Neon de prod, aplicar migration nova, popular hierarquia. Validar via `/tenants/tree`.

**Files:** nenhum modificado (operação manual sobre o banco)

### Steps

- [ ] **Step 6.1: Verificar `.env` aponta pro Neon (não pglite)**

```bash
cat apps/api/.env | grep -E "USE_PGLITE|DATABASE_URL"
# Espera: USE_PGLITE=false, DATABASE_URL=postgresql://...neon.tech/...
```

Se estiver com `USE_PGLITE=true`, troque pra `false`.

- [ ] **Step 6.2: Confirmar conectividade ao Neon**

```bash
nc -z -v -w 5 ep-falling-sea-ajom8rym.c-3.us-east-2.aws.neon.tech 5432
# Espera: "Connection succeeded"
```

Se der `timeout`, você está numa rede que bloqueia 5432 (Wi-Fi FIAP). Use 5G/tethering antes de continuar.

- [ ] **Step 6.3: Reset do banco Neon**

```bash
pnpm api:db:reset
# Vai mostrar prompt: "Pra continuar, digite a frase exata: apagar tudo em prod"
# Digite: apagar tudo em prod
# Espera: schema dropado e recriado, output "Schema reset"
```

- [ ] **Step 6.4: Aplicar todas as migrations (0000, 0001, 0002)**

```bash
pnpm api:db:migrate
# Espera output:
# INFO: Running migrations...
# INFO: Migrations done ✅
```

- [ ] **Step 6.5: Popular hierarquia**

```bash
pnpm api:db:seed
# Espera output:
# INFO: Seeding hierarquia institucional...
# INFO:   ↳ 2 unidades
# INFO:   ↳ 3 escolas
# INFO:   ↳ 6 cantinas
# INFO: Seed completo ✅
```

- [ ] **Step 6.6: Validar via API local (apontando pro Neon)**

```bash
pnpm api:dev &
sleep 3
curl -s http://localhost:8787/api/v1/tenants/tree | python3 -m json.tool
# Espera: JSON com 2 unidades, 3 escolas, 6 cantinas
kill %1
```

- [ ] **Step 6.7: Validar healthcheck e que a API ainda sobe limpa**

```bash
pnpm api:dev &
sleep 3
curl -s http://localhost:8787/api/v1/health
# Espera: {"status":"ok",...}
kill %1
```

- [ ] **Step 6.8: (Opcional) Verificar deploy no Render**

Não exige action local. Render redeploya automaticamente no próximo push (Task 7), e o backend lá vai aplicar migrations no buildCommand. Validar depois do push:
```bash
# Após push (final da Task 7):
curl -s https://cantina-api.onrender.com/api/v1/tenants/tree | python3 -m json.tool
# Espera: mesmo JSON com 2 unidades / 3 escolas / 6 cantinas
```

(Se o build do Render falhar, ver `docs/MOBILE-DEPLOY.md` e logs do painel.)

- [ ] **Step 6.9: Sem commit nesta task** (operação sobre o banco, não código). Continua direto pra Task 7.

---

## Task 7: Documentação + memória

**Goal:** Atualizar HANDOFF/CLAUDE com estado pós-Fase A. Atualizar memória pra Claude refletir Fase A entregue.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/HANDOFF.md`
- Modify: `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md`

### Steps

- [ ] **Step 7.1: Atualizar `CLAUDE.md` — comandos novos + convenção mobile-only mantida**

Localizar a seção `## Comandos críticos` e adicionar após `pnpm mobile:build:apk`:

```bash
# Criar staff por cantina (gera senha aleatória, mostra uma vez)
pnpm api:create-staff --cantina=<id> --email=<email> --name="<nome>"
```

Localizar a seção `## Convenções inegociáveis` e adicionar item 12:

```markdown
12. **Tenants são hierárquicos: `unidades` → `escolas` → `cantinas`** (3 tabelas separadas, FKs explícitas, nomes em PT). Cliente sem vínculo fixo (escolhe cada vez). Staff vinculado a UMA cantina (`users.cantina_id NOT NULL` quando role=staff, validado por CHECK constraint). API recebe contexto via header `X-Cantina-Id` (middleware `tenant-context.ts` — ainda não aplicado em items/orders/favorites; vem na Fase B). Endpoint público `GET /api/v1/tenants/tree` retorna a árvore completa com cache 1h.
```

Atualizar `## Próximos passos`:

```markdown
## Próximos passos

1. **Build APK preview e validar** — `pnpm mobile:build:apk` + instalar no celular Android (ver `docs/MOBILE-DEPLOY.md`)
2. **Fase B do sub-projeto 2** — Estoque + cardápio por cantina + "ver geral" (junction `cantina_items`). Brainstorm separado.
3. **Fase C** — Vitrine on/off + role staff aplicado nas rotas. Brainstorm separado.
4. **Fase D** — Fornecedores + housekeeping (`PATCH /auth/me`, reset-password, contador `senha`). Brainstorm separado.
5. **Quando user pedir:** ativar EAS Update + Expo Go (passos secos em `docs/MOBILE-DEPLOY.md`)
```

- [ ] **Step 7.2: Atualizar `docs/HANDOFF.md` — snapshot pós-Fase A**

Localizar `## 🎯 Contexto rápido` e atualizar a linha `**Status (...)**`:

```markdown
- **Status (2026-05-06):** Foundation 100% mergeado em main. Hardening de segurança aplicado. Mobile-only adotado. **Sub-projeto 2 / Fase A entregue** — hierarquia de tenants (unidades/escolas/cantinas) populada, JWT staff carrega cantinaId, middleware tenant-context criado (não aplicado ainda), CLI `create-staff` com proteções, `db:reset` com confirmação interativa em prod. Pronto pra Fase B (estoque + cardápio per-cantina).
```

Adicionar nova seção após `## 🚀 Distribuição`:

```markdown
## 🏢 Hierarquia de tenants (Fase A)

Estrutura institucional populada via `pnpm api:db:seed`:

- **2 unidades:** Paulista, Lins
- **3 escolas:** FIAP Paulista (main), FIAP School (Lins), FIAP Faculdade (Lins)
- **6 cantinas:** `c_pa_5`, `c_pa_7`, `c_lins_sc_1`, `c_lins_sc_2`, `c_lins_fac_1`, `c_lins_fac_2`

**Endpoint público:** `GET /api/v1/tenants/tree` (cache 1h) retorna árvore completa.

**Pra Fase B usar:**
- Tabelas `unidades`, `escolas`, `cantinas` populadas no Neon
- `apps/api/src/middleware/tenant-context.ts` criado, pronto pra ser aplicado nas rotas que viram per-cantina (items, orders, favorites)
- JWT de staff já carrega `cantinaId` — middleware já valida automaticamente
- CLI `pnpm api:create-staff --cantina=<id> --email=<...> --name="<...>"` disponível pra criar operadores quando Fase C ativar tela admin
- Schema de `users` já tem `cantina_id` + CHECK constraint forçando staff a ter cantina

**Spec:** [`docs/superpowers/specs/2026-05-06-tenants-hierarchy-fase-a-design.md`](./superpowers/specs/2026-05-06-tenants-hierarchy-fase-a-design.md)
**Plano:** [`docs/superpowers/plans/2026-05-06-tenants-hierarchy-fase-a-plan.md`](./superpowers/plans/2026-05-06-tenants-hierarchy-fase-a-plan.md)
```

- [ ] **Step 7.3: Atualizar memória — `project_estado_atual.md`**

Reescrever (não editar incremental — fica mais limpo) o arquivo em `/Users/johnny/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md`:

```markdown
---
name: Estado atual do projeto Cantina
description: Snapshot 2026-05-06 — Foundation + hardening + mobile-only + Sub-projeto 2 Fase A entregues. Sempre ler CLAUDE.md + docs/HANDOFF.md ao retomar.
type: project
---
**Snapshot 2026-05-06.** Sempre ler [`CLAUDE.md`](/Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app/CLAUDE.md) e [`docs/HANDOFF.md`](/Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app/docs/HANDOFF.md) antes de qualquer ação.

**Diretório:** `/Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app/`
**Repo:** https://github.com/jota0802/fiap-mdi-cp2-cantina-app
**Branch ativa:** `main`

**Sub-projetos:**
1. **Foundation** ✅ + hardening segurança ✅ + mobile-only ✅
2. **Cantina admin** — decomposto em 4 fases:
   - **Fase A** ✅ ENTREGUE 2026-05-06: hierarquia tenants + tenant-context middleware + CLI create-staff + endpoint /tenants/tree
   - Fase B (futuro): estoque + cardápio por cantina + "ver geral"
   - Fase C (futuro): vitrine on/off + role staff aplicado nas rotas + markRetirado
   - Fase D (futuro): fornecedores + housekeeping
3. **Customer flows v2** (futuro)

**Stack:**
- `apps/mobile` — Expo SDK 55 · RN 0.83.6 · TS strict · Expo Router 55 · TanStack Query v5
- `apps/api` — Hono 4 · Drizzle ORM · Postgres (Neon prod / pglite dev) · @node-rs/argon2 · jose · Zod · Vitest (62 tests)
- `packages/shared` — Zod schemas + tipos (inclui `tenant.ts` agora)

**Hierarquia de tenants (Fase A):**
- 3 tabelas: `unidades`, `escolas`, `cantinas`
- 2 unidades populadas: Paulista, Lins
- 6 cantinas: `c_pa_5`, `c_pa_7`, `c_lins_sc_1`, `c_lins_sc_2`, `c_lins_fac_1`, `c_lins_fac_2`
- `users.cantina_id` (FK opcional, obrigatório se role=staff via CHECK)
- `items.cantina_id`, `orders.cantina_id`, `favorites.cantina_id` renomeados (FKs em items/favorites vêm na Fase B)
- JWT de staff inclui `cantinaId`; customer não inclui
- Endpoint público `GET /api/v1/tenants/tree` (cache 1h)
- Middleware `tenant-context.ts` criado mas **não aplicado** nas rotas (Fase B)

**Comandos críticos:**
- `pnpm -r typecheck && pnpm -r test` — baseline (62 API tests + 22 mobile)
- `pnpm dev` — API + Metro juntos
- `pnpm api:create-staff --cantina=<id> --email=<...> --name="<...>"` — cria staff com senha gerada
- `pnpm api:db:reset` — reset com confirmação interativa em prod
- `emulator -avd <nome> && pnpm mobile:android` — dev no emulador
- `pnpm mobile:build:apk` — gera APK em apps/mobile/build-XXX.apk

**Distribuição:**
- Backend: Render (cantina-api.onrender.com) + Neon Postgres
- Mobile: APK Android via EAS Build local (aponta pro Render)

**Pendentes manuais (painel Render):**
- DATABASE_URL atualizada com senha rotacionada (já feito)
- JWT_SECRET via openssl (recomendado, opcional)
- ALLOWED_ORIGINS=https://cantina-mobile-only.local (placeholder)

**How to apply:**
1. `cd /Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app`
2. Ler `CLAUDE.md` + `docs/HANDOFF.md`
3. `pnpm -r typecheck && pnpm -r test` baseline verde
4. **Mobile-only** — não usar `Platform.OS === 'web'` (ver `feedback_mobile_only.md`)
5. **Tenants hierárquicos** — quando criar feature nova, considerar escopo (unidade vs escola vs cantina)
6. **Distribuição: APK + Render** (ver `feedback_distribuicao_apk.md`)
7. Commits: autor `jota0802`, conventional commits PT, trailer Co-Authored-By Claude
```

- [ ] **Step 7.4: Validar tudo um última vez**

```bash
pnpm -r typecheck && pnpm -r test
# Espera: typecheck PASS + 62 API tests + 22 mobile tests = todos passando

# API sobe limpa contra Neon:
pnpm dev &
sleep 5
curl -s http://localhost:8787/api/v1/health
curl -s http://localhost:8787/api/v1/tenants/tree | head -20
kill %1
```

- [ ] **Step 7.5: Commit das docs**

```bash
git add CLAUDE.md docs/HANDOFF.md

git commit -m "$(cat <<'EOF'
docs: spec Fase A entregue — atualiza CLAUDE/HANDOFF

CLAUDE.md:
- Comandos críticos: adiciona pnpm api:create-staff
- Convenção #12: tenants hierárquicos (unidades→escolas→cantinas),
  cliente sem vínculo fixo, staff cantina_id obrigatório, header
  X-Cantina-Id, middleware tenant-context (não aplicado ainda)
- Próximos passos: Fases B/C/D do sub-projeto 2 separadas

HANDOFF.md:
- Status: Fase A entregue
- Nova seção "Hierarquia de tenants" com IDs populados, endpoints,
  o que está disponível pra Fase B usar
- Refs spec + plano

(Memória do Claude atualizada à parte em
~/.claude/projects/.../memory/project_estado_atual.md — Fase A entregue.)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7.6: Validar git log final**

Run: `git log --oneline -8`
Expected:
```
<sha7> docs: spec Fase A entregue — atualiza CLAUDE/HANDOFF
<sha6> chore(scripts): protecao interativa em db:reset
<sha5> feat(scripts): CLI create-staff + safety helpers
<sha4> feat(api): GET /tenants/tree — endpoint publico com arvore institucional
<sha3> feat(api): JWT claim cantinaId + tenant-context middleware
<sha2> feat(db): hierarquia de tenants (unidades/escolas/cantinas)
a2e9b08 docs(spec): Sub-projeto 2 / Fase A — hierarquia de tenants + tenant context + CLI seed
e89abb7 docs: spec mobile-only + MOBILE-DEPLOY guide + atualiza README/CLAUDE/HANDOFF
```

7 commits novos (1 spec já feito + 6 desta sessão). Branch `main` ahead do origin em ~9 commits totais.

- [ ] **Step 7.7: (Opcional) Push pro origin**

```bash
git push origin main
# Render vai detectar push e refazer deploy automaticamente
# Aguardar ~3-5min e validar:
curl -s https://cantina-api.onrender.com/api/v1/tenants/tree | head -20
```

---

## Critérios de sucesso (do spec)

Verificar todos antes de declarar Fase A completa:

- [ ] `pnpm -r typecheck` passa nos 3 workspaces
- [ ] `pnpm -r test` passa (62 API + 22 mobile)
- [ ] Migration `0002_tenants_hierarchy.sql` aplicada em pglite e Neon sem erro
- [ ] `pnpm api:db:reset` (confirmação em Neon) + `migrate` + `seed` deixam o banco com 2 unidades + 3 escolas + 6 cantinas
- [ ] `GET /api/v1/tenants/tree` retorna 200 com árvore completa em pglite e Neon
- [ ] `pnpm api:create-staff` em pglite cria staff e mostra senha gerada
- [ ] `pnpm api:create-staff` apontando pra Neon **exige confirmação** "criar staff em prod"
- [ ] `pnpm api:db:reset` apontando pra Neon **exige confirmação** "apagar tudo em prod"
- [ ] CHECK constraint impede `INSERT users (role='staff', cantina_id=NULL)` — coberto implicitamente: o tenant-context test usa `createTestStaff` que sempre passa cantinaId, e o create-staff CLI sempre passa também. Pra validar diretamente: tente `INSERT INTO users (..., role='staff', cantina_id=NULL)` via psql/Neon Studio — deve falhar com `staff_must_have_cantina`
- [ ] JWT claim de customer **não tem** `cantinaId`; JWT de staff **tem** — validado pelos testes em `jwt.test.ts` e `auth.test.ts`
- [ ] Middleware `tenantContext` existe, tem testes, mas **não está aplicado** em items/orders/favorites — verificar com `grep "tenantContext\|tenant-context" apps/api/src/routes/`
- [ ] `pnpm dev` sobe API + Metro sem erro; healthcheck 200
- [ ] Documentação atualizada: HANDOFF, CLAUDE, memória

---

## Resumo da estrutura de commits

| # | SHA (gerado) | Commit | Task |
|---|---|---|---|
| 1 | `a2e9b08` (já existe) | `docs(spec): Fase A` | Spec |
| 2 | (novo) | `feat(db): hierarquia de tenants` | Task 1 |
| 3 | (novo) | `feat(api): JWT claim cantinaId + tenant-context middleware` | Task 2 |
| 4 | (novo) | `feat(api): GET /tenants/tree` | Task 3 |
| 5 | (novo) | `feat(scripts): CLI create-staff + safety helpers` | Task 4 |
| 6 | (novo) | `chore(scripts): protecao interativa em db:reset` | Task 5 |
| 7 | (novo) | `docs: spec Fase A entregue — atualiza CLAUDE/HANDOFF` | Task 7 |

**6 commits novos.** Task 6 é operação sobre Neon (sem commit). Cada commit é independente: typecheck + tests passam após cada um. Se algum quebrar, fácil reverter sem afetar próximos.
