# Sub-projeto 2 / Fase B — Cardápio per-cantina + Onboarding completo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customer escolhe cantina no onboarding e vê cardápio per-cantina; backend filtra items via junction `cantina_items` com estoque atômico; signup simplificado pra só email+senha+confirma; PATCH /auth/me coleta nome+RM+cantinaId no onboarding.

**Architecture:** Junction table `cantina_items` carrega preço/estoque/disponivel/visivel per-cantina. Middleware `tenantContext` (criado na Fase A) é wired em items/orders/favorites — header `X-Cantina-Id` obrigatório. Mobile usa `CantinaContext` (AsyncStorage) pra session atual, distinta do default em `users.cantina_id` (DB). Onboarding em 3 telas (welcome → nome+RM → unidade+cantina) chama `PATCH /auth/me` no fim. Decremento de estoque em `POST /orders` é transação com `UPDATE ... SET estoque = estoque - X WHERE estoque >= X` — se 0 rows, race detected → 409.

**Tech Stack:** Drizzle ORM + drizzle-kit (migrations + transactions), Postgres (Neon prod) / pglite (dev/test), Hono 4 + Zod (validation), Expo Router 55 (file-based mobile routing), TanStack Query v5 (mobile data fetching), AsyncStorage (cantina session), Vitest 2 (API), Node test runner (mobile).

**Spec:** [`docs/superpowers/specs/2026-05-07-cardapio-per-cantina-fase-b-design.md`](../specs/2026-05-07-cardapio-per-cantina-fase-b-design.md) (commits `54aa870` + `dba7bf6`).

**Pré-requisitos antes de começar:**

- `cd /Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app`
- Branch: `main` (jota0802 trabalha solo direto em main)
- Banco local OK: pglite dev funciona via `USE_PGLITE=true` no `.env`
- Baseline verde: `pnpm -r typecheck && pnpm -r test` passando antes de começar
- Git author setado: `git config user.name "jota0802"` e `git config user.email "jvfranco08@gmail.com"`
- Fase A entregue (commits até `dba7bf6` no main); helpers `_safety.ts` e middleware `tenant-context.ts` disponíveis

---

## File Structure

### Arquivos NOVOS

| Path | Responsabilidade |
|---|---|
| `apps/api/drizzle/0003_cardapio_per_cantina.sql` | Migration nova (gerada via drizzle-kit, inspecionada) |
| `apps/api/src/test/cantina-items.test.ts` | CHECK constraint estoque>=0; CHECK users_staff_must_have_name; CHECK users_rm_formato |
| `apps/mobile/app/(onboarding)/_layout.tsx` | Stack navigator do onboarding (sem header, fullscreen) |
| `apps/mobile/app/(onboarding)/welcome.tsx` | Tela 1: intro adaptado pro novo flow |
| `apps/mobile/app/(onboarding)/dados.tsx` | Tela 2: input nome (min 2) + RM (mask 6 dígitos numéricos) |
| `apps/mobile/app/(onboarding)/cantina.tsx` | Tela 3: select unidade + select cantina + PATCH /auth/me |
| `apps/mobile/context/CantinaContext.tsx` | Provider com `currentCantinaId` em AsyncStorage + lista cantinas da unidade do user |
| `apps/mobile/app/perfil/editar-nome.tsx` | Stack screen pra editar nome via PATCH /auth/me |
| `apps/mobile/app/perfil/unidade.tsx` | Stack screen pra trocar unidade — limpa cantina default automaticamente |
| `apps/mobile/app/perfil/cantina-default.tsx` | Stack screen pra escolher cantina default da unidade atual |
| `apps/mobile/components/CantinaPickerHeader.tsx` | Header da home: link "Mudar unidade" + dropdown picker |
| `packages/shared/src/schemas/auth.ts` (provavelmente já existe — atualizar) | RegisterSchema sem name, novo UpdateMeSchema |

### Arquivos MODIFICADOS

| Path | O que muda |
|---|---|
| `apps/api/src/db/schema.ts` | Add `cantinaItems` table; `users.name` → nullable + CHECK staff-must-have-name; `users.rm` text + CHECK regex; `orders.cantinaId` → NOT NULL; drop `items.cantinaId`; drop `favorites.cantinaId` |
| `apps/api/src/db/seed.ts` | Volta 12 items globais + popula 48 cantina_items (preço per-unidade × estoque random) |
| `apps/api/src/routes/auth.ts` | RegisterSchema sem `name`; novo PATCH `/auth/me` com validação de cantina-pertence-à-unidade |
| `apps/api/src/routes/items.ts` | `app.use('*', tenantContext(db))`; GET / faz JOIN com cantina_items, filtra disponivel+visivel |
| `apps/api/src/routes/orders.ts` | `app.use('*', tenantContext(db))`; POST / em transação com decremento atômico; nextSenha recebe cantinaId real |
| `apps/api/src/routes/favorites.ts` | `app.use('*', tenantContext(db))` (sem mudança de lógica de filtro — Fase B só wire, lógica continua user-based) |
| `apps/api/src/routes/auth.test.ts` | Update register tests (sem name); novos PATCH /auth/me tests |
| `apps/api/src/routes/items.test.ts` | Update — agora exige header X-Cantina-Id; testa JOIN + filtros disponivel/visivel/estoque |
| `apps/api/src/routes/orders.test.ts` | Update — usa cantina_items.preco; race condition test (estoque=1, 2 orders concorrentes); rejeita estoque insuficiente |
| `apps/api/src/routes/favorites.test.ts` | Update — header obrigatório agora |
| `apps/api/src/test/fixtures.ts` | `createTestUser` aceita opcional `{ name, rm, cantinaId }`; novo `createTestCantinaItems(db, cantinaId, items)` |
| `apps/mobile/app/(auth)/cadastro.tsx` | Remove campo "nome" e validação relacionada |
| `apps/mobile/lib/api.ts` (ou onde está o apiFetch) | Injeta header `X-Cantina-Id` em rotas autenticadas; lê do CantinaContext |
| `apps/mobile/app/_layout.tsx` | Wrap com `CantinaProvider` |
| `apps/mobile/app/(tabs)/_layout.tsx` | Gate de onboarding incompleto → redirect pra `/(onboarding)/welcome` |
| `apps/mobile/app/(tabs)/index.tsx` | Header substituído por `CantinaPickerHeader`; refetch ao trocar cantina |
| `apps/mobile/app/(tabs)/perfil.tsx` | Display nome/email/RM(read-only)/unidade/cantina default + links pras sub-screens de edição |
| `apps/mobile/types/index.ts` | `User` ganha `rm: string \| null`, `name: string \| null` |
| `packages/shared/src/schemas/auth.ts` | RegisterSchema só email+password; novo UpdateMeSchema |
| `CLAUDE.md` | Atualiza convenção #12 com cantina_items + onboarding flow + comandos |
| `docs/HANDOFF.md` | Status: Fase B entregue; pendentes pra Fase C |
| `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md` | Atualiza estado pós-Fase B |

---

## Task 1: Schema + Migration + Seed (DB foundation)

**Goal:** Criar tabela `cantina_items`, mudanças em users/orders/items/favorites, migration `0003`, seed reescrito (12 items + 48 cantina_items).

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Modify: `apps/api/src/db/seed.ts`
- Create: `apps/api/drizzle/0003_cardapio_per_cantina.sql` (gerada)
- Modify: `apps/api/drizzle/meta/_journal.json` (gerado)
- Create: `apps/api/drizzle/meta/0003_snapshot.json` (gerado)

### Steps

- [ ] **Step 1.1: Atualizar `apps/api/src/db/schema.ts` — adicionar `cantinaItems`**

Adicionar **antes** dos `export type` no fim do arquivo:

```typescript
export const cantinaItems = pgTable('cantina_items', {
  cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
  estoque: integer('estoque').notNull().default(0),
  disponivel: boolean('disponivel').notNull().default(true),
  visivel: boolean('visivel').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.cantinaId, t.itemId] }),
  cantinaIdx: index('cantina_items_cantina_idx').on(t.cantinaId),
  estoquePositivo: check('cantina_items_estoque_positivo', sql`estoque >= 0`),
}));
```

Adicionar exports de tipo no fim:

```typescript
export type CantinaItem = typeof cantinaItems.$inferSelect;
export type NewCantinaItem = typeof cantinaItems.$inferInsert;
```

- [ ] **Step 1.2: Modificar `users` — name nullable + CHECKs**

Localizar a definição de `users` no schema. Mudar `name`:

```typescript
// antes:
name: text('name').notNull(),

// depois:
name: text('name'),  // nullable; CHECK força notNull pra staff
rm: text('rm'),       // NOVO: 6 dígitos quando setado
```

Adicionar/atualizar os CHECKs no objeto de constraints (segunda arg do `pgTable`):

```typescript
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email),
  cantinaIdx: index('users_cantina_idx').on(t.cantinaId),
  staffMustHaveCantina: check(
    'users_staff_must_have_cantina',
    sql`role != 'staff' OR cantina_id IS NOT NULL`,
  ),
  // NOVOS:
  staffMustHaveName: check(
    'users_staff_must_have_name',
    sql`role != 'staff' OR name IS NOT NULL`,
  ),
  rmFormato: check(
    'users_rm_formato',
    sql`rm IS NULL OR rm ~ '^[0-9]{6}$'`,
  ),
}));
```

- [ ] **Step 1.3: Modificar `orders.cantinaId` pra NOT NULL**

```typescript
// antes:
cantinaId: text('cantina_id').references(() => cantinas.id, { onDelete: 'restrict' }),

// depois:
cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
```

- [ ] **Step 1.4: Drop `items.cantinaId` e `favorites.cantinaId`**

Em `items` table:

```typescript
// remover a linha:
cantinaId: text('cantina_id'),
```

Em `favorites` table:

```typescript
// remover a linha:
cantinaId: text('cantina_id'),
```

(Cleanup de Fase A — esses campos eram renames do tenant_id legado e não fazem mais sentido com a junction.)

- [ ] **Step 1.5: Verificar typecheck do schema**

Run: `pnpm --filter @cantina/api typecheck`
Expected: PASS. Se falhar com erro tipo "boolean is not exported", confirmar que `boolean`, `numeric`, `check`, `sql`, `primaryKey` estão todos importados no topo do arquivo.

- [ ] **Step 1.6: Gerar migration via drizzle-kit**

```bash
pnpm api:db:generate -- --name=cardapio_per_cantina
```

Gera `apps/api/drizzle/0003_cardapio_per_cantina.sql`. Output mostra "✓ generated migrations".

- [ ] **Step 1.7: Inspecionar SQL gerada**

Run: `cat apps/api/drizzle/0003_cardapio_per_cantina.sql`

Validar:
- `CREATE TABLE cantina_items` com FKs cantina_id + item_id, PK composta, CHECK estoque
- `ALTER TABLE users ALTER COLUMN name DROP NOT NULL`
- `ALTER TABLE users ADD COLUMN rm text`
- `ALTER TABLE users ADD CONSTRAINT users_staff_must_have_name CHECK (role != 'staff' OR name IS NOT NULL)`
- `ALTER TABLE users ADD CONSTRAINT users_rm_formato CHECK (rm IS NULL OR rm ~ '^[0-9]{6}$')`
- `ALTER TABLE orders ALTER COLUMN cantina_id SET NOT NULL`
- `ALTER TABLE items DROP COLUMN cantina_id`
- `ALTER TABLE favorites DROP COLUMN cantina_id`

Como banco vai ser resetado na Task 7, qualquer ordering issue do Drizzle (DROP+ADD em vez de mais elegante) é aceitável. Documentar no commit.

- [ ] **Step 1.8: Reescrever `apps/api/src/db/seed.ts` com items + cantina_items**

Substituir o conteúdo inteiro:

```typescript
import { createDb } from './client.js';
import { unidades, escolas, cantinas, items, cantinaItems } from './schema.js';
import { logger } from '../lib/logger.js';
import { createId } from '@paralleldrive/cuid2';

// Hierarquia (mesma da Fase A)
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
  { id: 'c_pa_5',       escolaId: 'e_paulista_main',  nome: '5º andar', andar: '5' },
  { id: 'c_pa_7',       escolaId: 'e_paulista_main',  nome: '7º andar', andar: '7' },
  { id: 'c_lins_sc_1',  escolaId: 'e_lins_school',    nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_fac_1', escolaId: 'e_lins_faculdade', nome: 'Térreo',   andar: 'T' },
] as const;

// Multiplicador de preço por unidade (estratégia spec §F)
const PRICE_MULTIPLIER_BY_UNIDADE: Record<string, number> = {
  u_paulista: 1.0,   // base
  u_lins:     0.85,  // 15% mais barato
};

// Map cantina → unidade pra calcular preço
const CANTINA_TO_UNIDADE: Record<string, string> = {
  c_pa_5: 'u_paulista', c_pa_7: 'u_paulista',
  c_lins_sc_1: 'u_lins', c_lins_fac_1: 'u_lins',
};

// 12 items globais (catálogo template — voltam do CP2)
const SEED_ITEMS = [
  { slug: 'cafe',           name: 'Café',                  preco: '3.50', categoria: 'bebidas',  descricao: 'Café preto coado', tags: ['quente', 'sem-acucar'] },
  { slug: 'cafe-com-leite', name: 'Café com leite',        preco: '5.00', categoria: 'bebidas',  descricao: 'Café com leite vaporizado', tags: ['quente'] },
  { slug: 'suco-laranja',   name: 'Suco de laranja',       preco: '7.00', categoria: 'bebidas',  descricao: 'Suco natural 300ml', tags: ['gelado', 'natural'] },
  { slug: 'agua',           name: 'Água mineral',          preco: '4.00', categoria: 'bebidas',  descricao: 'Água sem gás 500ml', tags: ['gelado'] },
  { slug: 'misto-quente',   name: 'Misto quente',          preco: '8.50', categoria: 'lanches',  descricao: 'Pão de forma, queijo e presunto', tags: ['quente', 'bestseller'] },
  { slug: 'pao-de-queijo',  name: 'Pão de queijo',         preco: '4.50', categoria: 'lanches',  descricao: 'Tradicional mineiro', tags: ['quente'] },
  { slug: 'salgado-frango', name: 'Coxinha de frango',     preco: '6.00', categoria: 'lanches',  descricao: 'Coxinha tradicional', tags: ['quente'] },
  { slug: 'wrap-frango',    name: 'Wrap de frango',        preco: '15.00', categoria: 'pratos', descricao: 'Tortilla integral, frango grelhado, salada', tags: ['integral'] },
  { slug: 'salada-cesar',   name: 'Salada César',          preco: '18.00', categoria: 'pratos', descricao: 'Alface, croutons, frango, parmesão', tags: ['fit'] },
  { slug: 'brownie',        name: 'Brownie',               preco: '7.50', categoria: 'doces',   descricao: 'Chocolate meio amargo', tags: ['doce'] },
  { slug: 'bolo-cenoura',   name: 'Bolo de cenoura',       preco: '6.50', categoria: 'doces',   descricao: 'Cobertura de chocolate', tags: ['doce'] },
  { slug: 'fruta',          name: 'Fruta da estação',      preco: '5.00', categoria: 'doces',   descricao: 'Banana, maçã ou laranja', tags: ['fit', 'natural'] },
] as const;

function precoPara(itemPreco: string, unidadeId: string): string {
  const mult = PRICE_MULTIPLIER_BY_UNIDADE[unidadeId] ?? 1.0;
  return (parseFloat(itemPreco) * mult).toFixed(2);
}

function estoqueRandom(): number {
  return Math.floor(Math.random() * 251) + 100; // [100, 350]
}

async function main() {
  const db = await createDb();
  logger.info('Seeding hierarquia + catálogo + cantina_items...');

  await db.insert(unidades).values([...SEED_UNIDADES]).onConflictDoNothing({ target: unidades.id });
  logger.info(`  ↳ ${SEED_UNIDADES.length} unidades`);

  await db.insert(escolas).values([...SEED_ESCOLAS]).onConflictDoNothing({ target: escolas.id });
  logger.info(`  ↳ ${SEED_ESCOLAS.length} escolas`);

  await db.insert(cantinas).values([...SEED_CANTINAS]).onConflictDoNothing({ target: cantinas.id });
  logger.info(`  ↳ ${SEED_CANTINAS.length} cantinas`);

  // Items: gera id via cuid2; salva map slug→id pra cantina_items
  const itemsToInsert = SEED_ITEMS.map((it) => ({
    id: createId(),
    slug: it.slug,
    name: it.name,
    descricao: it.descricao,
    preco: it.preco,
    categoria: it.categoria,
    tags: it.tags as unknown as string[], // jsonb
    disponivel: true,
    imagem: null,
  }));

  await db.insert(items).values(itemsToInsert).onConflictDoNothing({ target: items.slug });
  logger.info(`  ↳ ${itemsToInsert.length} items`);

  // cantina_items: cross-product (cantinas × items)
  const cantinaItemsRows = SEED_CANTINAS.flatMap((cantina) =>
    itemsToInsert.map((item) => ({
      cantinaId: cantina.id,
      itemId: item.id,
      preco: precoPara(item.preco, CANTINA_TO_UNIDADE[cantina.id]!),
      estoque: estoqueRandom(),
      disponivel: true,
      visivel: true,
    })),
  );

  await db.insert(cantinaItems).values(cantinaItemsRows).onConflictDoNothing({ target: [cantinaItems.cantinaId, cantinaItems.itemId] });
  logger.info(`  ↳ ${cantinaItemsRows.length} cantina_items`);

  logger.info('Seed completo ✅');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
```

**Note:** verificar a shape exata de `items` no schema atual — `tags` provavelmente é `jsonb` ou `text[]`; `imagem` pode não existir. Adaptar os campos do `itemsToInsert` pra match com o schema real (rodar typecheck pega).

- [ ] **Step 1.9: Validar local com pglite (reset → migrate → seed)**

```bash
sed -i '' 's/^USE_PGLITE=false/USE_PGLITE=true/' apps/api/.env
rm -rf apps/api/dev.db
pnpm api:db:migrate
pnpm api:db:seed
```

Expected output:
```
INFO: Running migrations...
INFO: Migrations done ✅
INFO: Seeding hierarquia + catálogo + cantina_items...
INFO:   ↳ 2 unidades
INFO:   ↳ 3 escolas
INFO:   ↳ 4 cantinas
INFO:   ↳ 12 items
INFO:   ↳ 48 cantina_items
INFO: Seed completo ✅
```

Voltar `.env`:
```bash
sed -i '' 's/^USE_PGLITE=true/USE_PGLITE=false/' apps/api/.env
```

- [ ] **Step 1.10: Verificar tests existentes (regressão)**

Run: `pnpm --filter @cantina/api test`

Expected: alguns testes vão **quebrar** porque:
- `items.cantinaId` não existe mais (testes que referenciavam podem falhar)
- `orders.cantinaId` agora é NOT NULL (testes que inseriam orders sem cantina_id quebram)

Esses serão consertados nas Tasks 2 e 3 (que ajustam routes/items.ts e routes/orders.ts e seus tests). Por ora, **OK ter testes vermelhos** após esta task — é esperado.

Se algum teste falhar por motivo NÃO listado acima (ex: TypeError genuíno), parar e investigar.

- [ ] **Step 1.11: Typecheck completo**

Run: `pnpm -r typecheck`
Expected: pode haver erros em rotas/tests que ainda usam shapes antigos. Se errors aparecerem em `apps/api/src/routes/items.ts` ou `orders.ts`, **OK** — fix vem nas Tasks 2/3.

Se houver erros em arquivos não relacionados (ex: mobile), parar e investigar.

- [ ] **Step 1.12: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/src/db/seed.ts \
        apps/api/drizzle/0003_cardapio_per_cantina.sql \
        apps/api/drizzle/meta/

git commit -m "$(cat <<'EOF'
feat(db): cantina_items + users.rm/name nullable + cleanup Fase A

- Tabela nova cantina_items (PK composta cantina_id+item_id, FKs,
  preco numeric NOT NULL, estoque integer com CHECK >= 0, dois
  booleans disponivel + visivel)
- users.name vira nullable + CHECK users_staff_must_have_name
- users.rm text nullable + CHECK regex ^[0-9]{6}$
- orders.cantina_id vira NOT NULL (toda order vinculada a cantina)
- Drop items.cantina_id e favorites.cantina_id (cleanup Fase A —
  renames legados que nao fazem sentido com junction)
- Seed reescrito: volta 12 items globais + popula 48 cantina_items
  (estoque random [100, 350]; preco per-unidade: Paulista base,
  Lins x 0.85)

Migration 0003_cardapio_per_cantina.sql idempotente. Banco sera
resetado na Task 7 (Neon). Tests de routes/items e routes/orders
podem ficar vermelhos temporariamente — fix nas Tasks 2/3.

Spec: docs/superpowers/specs/2026-05-07-cardapio-per-cantina-fase-b-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: API auth refactor — PATCH /auth/me + signup sem nome

**Goal:** `POST /auth/register` aceita só email+password (sem name). Novo `PATCH /api/v1/auth/me` permite atualizar `{ name?, rm?, cantinaId? }` com validação de cantina-pertence-à-unidade-do-user.

**Files:**
- Modify: `packages/shared/src/schemas/auth.ts` (RegisterSchema sem name; novo UpdateMeSchema)
- Modify: `apps/api/src/routes/auth.ts` (register sem name; novo PATCH /me)
- Modify: `apps/api/src/routes/auth.test.ts` (atualizar register tests; novos PATCH tests)
- Modify: `apps/api/src/test/fixtures.ts` (createTestUser ganha opt fields)

### Steps

- [ ] **Step 2.1: Atualizar `packages/shared/src/schemas/auth.ts`**

Localizar `RegisterSchema`. Remover o campo `name` (se existir):

```typescript
export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  // name removido — vem no onboarding via PATCH /auth/me
});
```

Adicionar novo schema:

```typescript
export const UpdateMeSchema = z.object({
  name: z.string().trim().min(2, 'Nome precisa ter pelo menos 2 caracteres').optional(),
  rm: z.string().regex(/^[0-9]{6}$/, 'RM precisa ter exatamente 6 dígitos').optional(),
  cantinaId: z.string().nullable().optional(),
});

export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;
```

- [ ] **Step 2.2: Verificar typecheck do shared**

Run: `pnpm --filter @cantina/shared typecheck`
Expected: PASS.

- [ ] **Step 2.3: Atualizar `apps/api/src/routes/auth.ts` — register sem name**

Localizar o handler de `/register`. Mudar pra criar user com `name: null, rm: null, cantinaId: null`:

```typescript
authRoutes.post('/register', validateJson(RegisterSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // checa duplicidade...
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw conflict('Email já cadastrado');

  const passwordHash = await hashPassword(password);
  const id = createId();
  const [user] = await db.insert(users).values({
    id,
    email,
    passwordHash,
    name: null,        // setado no onboarding
    rm: null,
    cantinaId: null,
    role: 'customer',
    locale: 'pt',
  }).returning();
  if (!user) throw new Error('failed to create user');

  const token = await signJwt({
    sub: user.id,
    email: user.email,
    role: assertValidRole(user.role),
    locale: user.locale,
    cantinaId: user.cantinaId ?? undefined,
  });

  return c.json({ user: toPublicUser(user), token }, 201);
});
```

(Adapt to existing structure — pode haver wrappers/helpers diferentes; o ponto principal é remover `name` do payload e setar `null` no insert.)

- [ ] **Step 2.4: Adicionar handler `PATCH /api/v1/auth/me`**

No mesmo arquivo `auth.ts`, depois do `GET /me`:

```typescript
authRoutes.patch('/me', requireAuth, validateJson(UpdateMeSchema), async (c) => {
  const claim = c.get('user');
  const updates = c.req.valid('json');

  // Buscar user atual (precisamos do cantina_id atual pra validação hierárquica)
  const [current] = await db.select().from(users).where(eq(users.id, claim.sub)).limit(1);
  if (!current) throw notFound('User não existe');

  // Validar cantinaId (se enviado e não-null)
  if (updates.cantinaId !== undefined && updates.cantinaId !== null) {
    const novaCantina = updates.cantinaId;
    // Existe e ativa?
    const [c1] = await db.select({
      cantinaId: cantinas.id,
      ativo: cantinas.ativo,
      unidadeId: unidades.id,
    })
      .from(cantinas)
      .innerJoin(escolas, eq(cantinas.escolaId, escolas.id))
      .innerJoin(unidades, eq(escolas.unidadeId, unidades.id))
      .where(eq(cantinas.id, novaCantina))
      .limit(1);
    if (!c1 || !c1.ativo) throw notFound('Cantina não existe ou inativa');

    // Se user já tem cantina_id setado, validar mesma unidade
    if (current.cantinaId) {
      const [c2] = await db.select({ unidadeId: unidades.id })
        .from(cantinas)
        .innerJoin(escolas, eq(cantinas.escolaId, escolas.id))
        .innerJoin(unidades, eq(escolas.unidadeId, unidades.id))
        .where(eq(cantinas.id, current.cantinaId))
        .limit(1);
      if (c2 && c2.unidadeId !== c1.unidadeId) {
        throw badRequest('Nova cantina deve pertencer à mesma unidade. Troque a unidade no Perfil primeiro.');
      }
    }
  }

  // Aplica updates
  const patch: Partial<typeof users.$inferInsert> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.rm !== undefined) patch.rm = updates.rm;
  if (updates.cantinaId !== undefined) patch.cantinaId = updates.cantinaId; // null permitido pra clear
  patch.updatedAt = new Date();

  const [updated] = await db.update(users).set(patch).where(eq(users.id, claim.sub)).returning();
  if (!updated) throw new Error('failed to update user');

  return c.json({ user: toPublicUser(updated) }, 200);
});
```

(Imports a verificar/adicionar no topo: `cantinas, escolas, unidades` de schema; `notFound, badRequest` de errors; `requireAuth` de middleware/auth.)

- [ ] **Step 2.5: Atualizar `toPublicUser` (helper) pra incluir `rm`**

Encontrar `toPublicUser` (provavelmente em `apps/api/src/routes/auth.ts` ou helpers):

```typescript
function toPublicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,         // pode ser null durante onboarding
    rm: u.rm,             // pode ser null
    email: u.email,
    role: u.role,
    cantinaId: u.cantinaId,
    locale: u.locale,
  };
}
```

(Garantir que mobile espera esses fields nullable — vai ser tratado na Task 4.)

- [ ] **Step 2.6: Atualizar `apps/api/src/test/fixtures.ts` — createTestUser opcional fields**

Localizar `createTestUser`. Atualizar pra aceitar opcional `name`, `rm`, `cantinaId`:

```typescript
export async function createTestUser(
  db: TestDb,
  overrides: Partial<{ email: string; name: string | null; password: string; rm: string | null; cantinaId: string | null }> = {},
) {
  const id = createId();
  const password = overrides.password ?? 'senha-teste';
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    id,
    email: overrides.email ?? `user-${id}@test.com`,
    name: overrides.name === undefined ? `User ${id}` : overrides.name, // default sets name; passing null explicitly skips
    passwordHash,
    role: 'customer',
    locale: 'pt',
    rm: overrides.rm ?? null,
    cantinaId: overrides.cantinaId ?? null,
  }).returning();
  if (!user) throw new Error('failed to create user');
  const token = await signJwt({
    sub: user.id, email: user.email, role: 'customer', locale: user.locale,
    cantinaId: user.cantinaId ?? undefined,
  });
  return { user, password, token };
}
```

**Importante:** `createTestStaff` já existe (Fase A) e seta `name: 'Test Staff'` por default. Continua válido (CHECK staff-must-have-name OK).

Adicionar **novo helper** pra cantina_items setup rápido:

```typescript
import { items, cantinaItems } from '../db/schema.js';

export async function createTestCantinaItems(
  db: TestDb,
  cantinaId: string,
  itemsData: Array<{ slug: string; name: string; preco: string; estoque?: number; disponivel?: boolean; visivel?: boolean }>,
) {
  const inserted = [];
  for (const it of itemsData) {
    const itemId = createId();
    const [item] = await db.insert(items).values({
      id: itemId,
      slug: it.slug,
      name: it.name,
      preco: it.preco,
      categoria: 'lanches',
      tags: [] as unknown as string[],
      disponivel: true,
    }).returning();
    if (!item) throw new Error(`failed to insert item ${it.slug}`);

    const [ci] = await db.insert(cantinaItems).values({
      cantinaId,
      itemId,
      preco: it.preco,
      estoque: it.estoque ?? 100,
      disponivel: it.disponivel ?? true,
      visivel: it.visivel ?? true,
    }).returning();
    if (!ci) throw new Error(`failed to insert cantina_item`);
    inserted.push({ item, cantinaItem: ci });
  }
  return inserted;
}
```

(Adapt to existing items schema — verificar campos obrigatórios.)

- [ ] **Step 2.7: Atualizar `apps/api/src/routes/auth.test.ts` — register sem name**

Localizar testes de `POST /auth/register`. Atualizar pra remover `name` do body:

```typescript
// antes:
body: JSON.stringify({ name: 'Foo', email: 'a@a.com', password: 'pass123' }),

// depois:
body: JSON.stringify({ email: 'a@a.com', password: 'pass123' }),
```

E onde verifica resposta:

```typescript
const json = await res.json() as { user: { id: string; name: string | null; email: string }, token: string };
expect(json.user.name).toBeNull();
expect(json.user.email).toBe('a@a.com');
```

- [ ] **Step 2.8: Adicionar tests de PATCH /auth/me**

Adicionar bloco `describe('PATCH /auth/me')` em `apps/api/src/routes/auth.test.ts`:

```typescript
import { createTestTenants, createTestUser } from '../test/fixtures.js';

describe('PATCH /api/v1/auth/me', () => {
  it('atualiza name + rm + cantinaId em uma chamada', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const u = await createTestUser(testDb, { name: null });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Aluno Teste', rm: '123456', cantinaId }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { name: string; rm: string; cantinaId: string } };
    expect(json.user.name).toBe('Aluno Teste');
    expect(json.user.rm).toBe('123456');
    expect(json.user.cantinaId).toBe(cantinaId);
  });

  it('rejeita rm com formato inválido (5 dígitos)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rm: '12345' }),
    });
    expect(res.status).toBe(422);
  });

  it('rejeita rm com letras', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rm: 'abc123' }),
    });
    expect(res.status).toBe(422);
  });

  it('rejeita cantina inexistente com 404', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: 'c_inexistente' }),
    });
    expect(res.status).toBe(404);
  });

  it('rejeita cantina de outra unidade quando user já tem default', async () => {
    const { cantinaId, escolaId } = await createTestTenants(testDb);
    // Cria 2a unidade + escola + cantina
    await testDb.insert(unidades).values({ id: 'u_outra', nome: 'Outra' });
    await testDb.insert(escolas).values({ id: 'e_outra', unidadeId: 'u_outra', nome: 'Outra Escola', tipo: 'main' });
    await testDb.insert(cantinas).values({ id: 'c_outra', escolaId: 'e_outra', nome: 'Outra Cantina', andar: '1' });

    const u = await createTestUser(testDb, { cantinaId }); // default = u_test cantina

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: 'c_outra' }),
    });
    expect(res.status).toBe(400);
  });

  it('aceita null em cantinaId pra limpar', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: null }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { cantinaId: string | null } };
    expect(json.user.cantinaId).toBeNull();
  });

  it('aceita troca pra cantina da mesma unidade', async () => {
    const { cantinaId, escolaId } = await createTestTenants(testDb);
    // Cria 2a cantina na mesma escola (e portanto mesma unidade)
    await testDb.insert(cantinas).values({ id: 'c_mesma_unidade', escolaId, nome: 'Mesma Unidade', andar: '2' });
    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: 'c_mesma_unidade' }),
    });
    expect(res.status).toBe(200);
  });

  it('rejeita sem token (401)', async () => {
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });
    expect(res.status).toBe(401);
  });
});
```

(`unidades`, `escolas`, `cantinas` precisam estar importados no topo do test file.)

- [ ] **Step 2.9: Rodar tests de auth**

Run: `pnpm --filter @cantina/api test src/routes/auth.test.ts`
Expected: tests existentes (register/login/me GET) PASS + 7 novos PATCH /me tests PASS.

- [ ] **Step 2.10: Typecheck completo**

Run: `pnpm -r typecheck`
Expected: PASS nos 3 workspaces.

- [ ] **Step 2.11: Commit**

```bash
git add packages/shared/src/schemas/auth.ts \
        apps/api/src/routes/auth.ts apps/api/src/routes/auth.test.ts \
        apps/api/src/test/fixtures.ts

git commit -m "$(cat <<'EOF'
feat(api): PATCH /auth/me + signup sem nome

- shared RegisterSchema: remove campo name (vai pro onboarding)
- shared UpdateMeSchema: novo (name? rm? cantinaId? todos opcionais)
- POST /auth/register: cria user com name=null, rm=null, cantinaId=null
- PATCH /api/v1/auth/me: atualiza campos parciais; valida cantina existe
  + ativa; valida hierarquia (nova cantina precisa pertencer mesma
  unidade do default atual; exceto na primeira vez quando default e null)
- toPublicUser inclui rm no response
- fixtures.createTestUser aceita name/rm/cantinaId opcionais
- fixtures.createTestCantinaItems novo helper pra setup de teste

7 tests novos pra PATCH /me cobrindo: atualizacao completa, rm invalido
(5 digits + letters), cantina inexistente, cross-unidade rejeitado,
null pra clear, mesma unidade aceita, sem token 401.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: API wire tenant-context + decremento atômico

**Goal:** Aplicar middleware `tenantContext` em items/orders/favorites. Refactor `GET /items` pra JOIN com cantina_items (filtro disponivel+visivel, retorna estoque). Refactor `POST /orders` em transação com decremento atômico, race detection (409). `nextSenha` recebe cantinaId real.

**Files:**
- Modify: `apps/api/src/routes/items.ts`
- Modify: `apps/api/src/routes/orders.ts`
- Modify: `apps/api/src/routes/favorites.ts`
- Modify: `apps/api/src/routes/items.test.ts`
- Modify: `apps/api/src/routes/orders.test.ts`
- Modify: `apps/api/src/routes/favorites.test.ts`
- Create: `apps/api/src/test/cantina-items.test.ts` (CHECK constraints)

### Steps

- [ ] **Step 3.1: Wire `tenantContext` em `apps/api/src/routes/items.ts`**

No início do `createItemsRoutes(db)`, depois de `requireAuth`:

```typescript
import { tenantContext } from '../middleware/tenant-context.js';

export function createItemsRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);
  app.use('*', tenantContext(db));  // NOVO
  // ... handlers ...
}
```

- [ ] **Step 3.2: Refactor `GET /items` pra JOIN com cantina_items**

Substituir o handler `app.get('/')`:

```typescript
import { items, cantinaItems } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

app.get('/', async (c) => {
  const cantinaId = c.var.cantina.id;

  const list = await db
    .select({
      id: items.id,
      slug: items.slug,
      name: items.name,
      descricao: items.descricao,
      categoria: items.categoria,
      tags: items.tags,
      imagem: items.imagem,
      preco: cantinaItems.preco,
      estoque: cantinaItems.estoque,
      disponivel: cantinaItems.disponivel,
    })
    .from(cantinaItems)
    .innerJoin(items, eq(cantinaItems.itemId, items.id))
    .where(and(
      eq(cantinaItems.cantinaId, cantinaId),
      eq(cantinaItems.disponivel, true),
      eq(cantinaItems.visivel, true),
    ));

  return c.json({ items: list }, 200);
});
```

(Adapt aos campos do `items` real — `descricao`, `categoria`, `tags`, `imagem` podem ter nomes diferentes ou ser nullable; verificar no schema.)

- [ ] **Step 3.3: Refactor `GET /items/:id` (se existir)**

Mesmo padrão — JOIN cantina_items + filtro de cantina:

```typescript
app.get('/:id', async (c) => {
  const cantinaId = c.var.cantina.id;
  const id = c.req.param('id');

  const [row] = await db
    .select({
      id: items.id,
      slug: items.slug,
      name: items.name,
      // ... outros campos ...
      preco: cantinaItems.preco,
      estoque: cantinaItems.estoque,
      disponivel: cantinaItems.disponivel,
    })
    .from(cantinaItems)
    .innerJoin(items, eq(cantinaItems.itemId, items.id))
    .where(and(
      eq(cantinaItems.cantinaId, cantinaId),
      eq(items.id, id),
      eq(cantinaItems.disponivel, true),
      eq(cantinaItems.visivel, true),
    ))
    .limit(1);

  if (!row) throw notFound('Item não disponível nesta cantina');
  return c.json({ item: row }, 200);
});
```

- [ ] **Step 3.4: Wire `tenantContext` em `apps/api/src/routes/favorites.ts`**

```typescript
app.use('*', requireAuth);
app.use('*', tenantContext(db));  // NOVO — agora exige header
```

(Lógica de favorites continua user-based; só adiciona o header gate.)

- [ ] **Step 3.5: Wire `tenantContext` + refactor `POST /orders` com transação atômica**

Em `apps/api/src/routes/orders.ts`:

```typescript
import { tenantContext } from '../middleware/tenant-context.js';
import { items, orders, orderItems, cantinaItems } from '../db/schema.js';
import { sql, eq, and, gte, desc, inArray } from 'drizzle-orm';

export function createOrdersRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);
  app.use('*', tenantContext(db));  // NOVO

  // ... GET handlers (atualizar pra usar cantina do contexto) ...

  app.post('/', validateJson(CreateOrderSchema), async (c) => {
    const claim = c.get('user');
    const cantinaId = c.var.cantina.id;
    const { itens } = c.req.valid('json');

    if (itens.length === 0) throw badRequest('Carrinho vazio');

    const orderId = createId();
    const orderItemRows: typeof orderItems.$inferInsert[] = [];
    let total = 0;

    await db.transaction(async (tx) => {
      // 1. Validar todos os items + decrementar estoque atomicamente
      for (const reqItem of itens) {
        // Busca cantina_item (preço + checks)
        const [ci] = await tx.select()
          .from(cantinaItems)
          .where(and(
            eq(cantinaItems.cantinaId, cantinaId),
            eq(cantinaItems.itemId, reqItem.itemId),
          )).limit(1);

        if (!ci) throw notFound(`Item não disponível nesta cantina: ${reqItem.itemId}`);
        if (!ci.disponivel || !ci.visivel) throw badRequest(`Item indisponível: ${reqItem.itemId}`);

        // Decrementa estoque atomicamente (race-safe)
        const result = await tx.update(cantinaItems)
          .set({ estoque: sql`${cantinaItems.estoque} - ${reqItem.quantidade}` })
          .where(and(
            eq(cantinaItems.cantinaId, cantinaId),
            eq(cantinaItems.itemId, reqItem.itemId),
            gte(cantinaItems.estoque, reqItem.quantidade),
          ))
          .returning({ id: cantinaItems.itemId });

        if (result.length === 0) {
          throw conflict(`Estoque insuficiente pra ${reqItem.itemId}`);
        }

        // Busca item details pra snapshot
        const [item] = await tx.select().from(items).where(eq(items.id, reqItem.itemId)).limit(1);
        if (!item) throw notFound('Item não existe');

        const subtotal = parseFloat(ci.preco) * reqItem.quantidade;
        total += subtotal;

        orderItemRows.push({
          id: createId(),
          orderId,
          itemId: item.id,
          nameSnapshot: item.name ?? item.slug,
          precoSnapshot: ci.preco, // usa cantina_items.preco, NÃO items.preco
          quantidade: reqItem.quantidade,
          observacoes: reqItem.observacoes ?? null,
        });
      }

      // 2. Calcular estimativa
      const pendingResult = await tx.select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(eq(orders.cantinaId, cantinaId), eq(orders.status, 'pendente')));
      const pendingCount = Number(pendingResult[0]?.count ?? 0);
      const estimadoSec = calcularEstimativa(pendingCount);
      const prontoEmEstimado = new Date(Date.now() + estimadoSec * 1000);

      // 3. Inserir order com cantinaId real
      const senha = await nextSenha(tx, cantinaId);
      await tx.insert(orders).values({
        id: orderId,
        userId: claim.sub,
        cantinaId,
        status: 'pendente',
        total: total.toFixed(2),
        senha,
        prontoEmEstimado,
      });

      // 4. Inserir order_items
      await tx.insert(orderItems).values(orderItemRows);
    });

    const enriched = await fetchOrderWithItems(db, orderId);
    return c.json({ order: enriched }, 201);
  });

  // ... PATCH /:id/status mantém igual (usa user-based check) ...
}
```

(Adaptar import de `conflict` se ainda não estiver.)

- [ ] **Step 3.6: Atualizar `nextSenha` callsite**

Localizar a chamada `nextSenha(db, null)` (linha ~122 antes da Task). Trocar pra `nextSenha(tx, cantinaId)` dentro da transação acima. **A função em si não muda** — já aceita o parâmetro desde a Fase A; só estamos passando o real agora.

- [ ] **Step 3.7: Atualizar `apps/api/src/routes/items.test.ts`**

Cada test agora precisa de `X-Cantina-Id` header e `createTestTenants` + `createTestCantinaItems` no setup.

```typescript
import { createTestTenants, createTestCantinaItems, createTestUser } from '../test/fixtures.js';

let cantinaId: string;
let userToken: string;

beforeEach(async () => {
  // ... setup db existente ...
  const tenants = await createTestTenants(testDb);
  cantinaId = tenants.cantinaId;

  await createTestCantinaItems(testDb, cantinaId, [
    { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 100 },
    { slug: 'misto', name: 'Misto', preco: '8.50', estoque: 0 }, // esgotado
    { slug: 'oculto', name: 'Oculto', preco: '5.00', visivel: false },
    { slug: 'indisp', name: 'Indisp', preco: '5.00', disponivel: false },
  ]);

  const u = await createTestUser(testDb, { cantinaId });
  userToken = u.token;
});

describe('GET /api/v1/items', () => {
  it('rejeita sem header X-Cantina-Id (400)', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(400);
  });

  it('lista items disponivel + visivel (inclui esgotado)', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${userToken}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { items: Array<{ slug: string; estoque: number }> };
    const slugs = json.items.map((i) => i.slug);
    expect(slugs).toContain('cafe');
    expect(slugs).toContain('misto'); // esgotado AINDA aparece
    expect(slugs).not.toContain('oculto'); // visivel=false esconde
    expect(slugs).not.toContain('indisp'); // disponivel=false esconde

    const misto = json.items.find((i) => i.slug === 'misto');
    expect(misto?.estoque).toBe(0);
  });

  it('preço vem de cantina_items (não items)', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${userToken}`, 'X-Cantina-Id': cantinaId },
    });
    const json = await res.json() as { items: Array<{ slug: string; preco: string }> };
    const cafe = json.items.find((i) => i.slug === 'cafe');
    expect(cafe?.preco).toBe('3.50');
  });
});
```

(Remover ou atualizar testes antigos que assumiam items global sem cantina.)

- [ ] **Step 3.8: Atualizar `apps/api/src/routes/orders.test.ts`**

Refactor pra usar header X-Cantina-Id em todos os tests. Adicionar test de race condition:

```typescript
import { createTestTenants, createTestCantinaItems, createTestUser } from '../test/fixtures.js';

describe('POST /orders — concorrência', () => {
  it('decrementa estoque atomicamente; 2 orders paralelos pro último item: 1 ok + 1 conflict', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 1 },
    ]);
    const itemId = created[0]!.item.id;

    const u1 = await createTestUser(testDb, { email: 'u1@t.com', cantinaId });
    const u2 = await createTestUser(testDb, { email: 'u2@t.com', cantinaId });

    const requests = [
      app.request('/api/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${u1.token}`,
          'X-Cantina-Id': cantinaId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
      }),
      app.request('/api/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${u2.token}`,
          'X-Cantina-Id': cantinaId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
      }),
    ];

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status).sort();

    expect(statuses).toEqual([201, 409]); // um sucesso, um conflict
  });

  it('rejeita order com estoque insuficiente (409)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 2 },
    ]);
    const itemId = created[0]!.item.id;
    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${u.token}`,
        'X-Cantina-Id': cantinaId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itens: [{ itemId, quantidade: 5 }] }),
    });
    expect(res.status).toBe(409);
  });

  it('usa cantina_items.preco no order_items.precoSnapshot (não items.preco)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '4.20', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;
    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${u.token}`,
        'X-Cantina-Id': cantinaId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itens: [{ itemId, quantidade: 2 }] }),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { order: { total: string; itens: Array<{ precoSnapshot: string }> } };
    expect(json.order.total).toBe('8.40'); // 4.20 × 2
    expect(json.order.itens[0]?.precoSnapshot).toBe('4.20');
  });
});
```

(Tests existentes precisam ser atualizados — todo `body: JSON.stringify({...})` precisa de `X-Cantina-Id` header. Setup precisa criar cantina + cantina_items.)

- [ ] **Step 3.9: Atualizar `apps/api/src/routes/favorites.test.ts`**

Adicionar `X-Cantina-Id` header em todas as requests dos tests existentes. Setup adiciona createTestTenants. Lógica do favorites em si não muda — só adiciona o gate de header.

- [ ] **Step 3.10: Criar `apps/api/src/test/cantina-items.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDb } from './db.js';
import { createTestTenants } from './fixtures.js';
import { items, cantinaItems, users } from '../db/schema.js';
import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from '../lib/password.js';

let testDb: TestDb;
let close: () => Promise<void>;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
});

afterEach(async () => { await close(); });

describe('CHECK constraint cantina_items_estoque_positivo', () => {
  it('rejeita INSERT com estoque negativo', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const itemId = createId();
    await testDb.insert(items).values({
      id: itemId, slug: 'x', name: 'X', preco: '1.00', categoria: 'lanches', tags: [] as unknown as string[], disponivel: true,
    });

    await expect(
      testDb.insert(cantinaItems).values({
        cantinaId, itemId, preco: '1.00', estoque: -1,
      })
    ).rejects.toThrow(/estoque_positivo|check/i);
  });

  it('rejeita UPDATE que deixaria estoque negativo', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const itemId = createId();
    await testDb.insert(items).values({
      id: itemId, slug: 'x', name: 'X', preco: '1.00', categoria: 'lanches', tags: [] as unknown as string[], disponivel: true,
    });
    await testDb.insert(cantinaItems).values({ cantinaId, itemId, preco: '1.00', estoque: 5 });

    await expect(
      testDb.update(cantinaItems).set({ estoque: -3 })
    ).rejects.toThrow(/estoque_positivo|check/i);
  });
});

describe('CHECK constraints em users', () => {
  it('users_staff_must_have_name barra INSERT staff sem name', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await expect(
      testDb.insert(users).values({
        id: createId(),
        email: 'bad@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'staff',
        name: null, // ← CHECK barra
        cantinaId,
        locale: 'pt',
      })
    ).rejects.toThrow(/staff_must_have_name|check/i);
  });

  it('users_rm_formato barra rm com 5 dígitos', async () => {
    await expect(
      testDb.insert(users).values({
        id: createId(),
        email: 'a@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'customer',
        name: 'X',
        rm: '12345', // 5 dígitos
        locale: 'pt',
      })
    ).rejects.toThrow(/rm_formato|check/i);
  });

  it('users_rm_formato barra rm com letras', async () => {
    await expect(
      testDb.insert(users).values({
        id: createId(),
        email: 'b@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'customer',
        name: 'Y',
        rm: 'abc123',
        locale: 'pt',
      })
    ).rejects.toThrow(/rm_formato|check/i);
  });

  it('users_rm_formato aceita rm com exatamente 6 dígitos', async () => {
    const [user] = await testDb.insert(users).values({
      id: createId(),
      email: 'c@t.com',
      passwordHash: await hashPassword('senha123'),
      role: 'customer',
      name: 'Z',
      rm: '999999',
      locale: 'pt',
    }).returning();
    expect(user?.rm).toBe('999999');
  });

  it('users_rm_formato aceita rm null', async () => {
    const [user] = await testDb.insert(users).values({
      id: createId(),
      email: 'd@t.com',
      passwordHash: await hashPassword('senha123'),
      role: 'customer',
      name: 'W',
      rm: null,
      locale: 'pt',
    }).returning();
    expect(user?.rm).toBeNull();
  });
});
```

- [ ] **Step 3.11: Rodar suite completa**

Run: `pnpm --filter @cantina/api test`
Expected: tudo PASS. Tests novos: ~12 (3 race/decrement + 4-5 items + favorites + 7 cantina-items/CHECKs).

Se algum teste antigo quebrar de forma genuína (não só por falta de header — isso já foi atualizado), parar e investigar.

- [ ] **Step 3.12: Typecheck**

Run: `pnpm -r typecheck`
Expected: PASS nos 3 workspaces.

- [ ] **Step 3.13: Commit**

```bash
git add apps/api/src/routes/items.ts apps/api/src/routes/orders.ts apps/api/src/routes/favorites.ts \
        apps/api/src/routes/items.test.ts apps/api/src/routes/orders.test.ts apps/api/src/routes/favorites.test.ts \
        apps/api/src/test/cantina-items.test.ts

git commit -m "$(cat <<'EOF'
feat(api): wire tenant-context em items/orders/favorites + decremento atomico

- middleware tenantContext aplicado em items, orders, favorites:
  header X-Cantina-Id obrigatorio, cantina ativa validada, claim de
  staff verificado contra cantina ownership
- GET /items: JOIN com cantina_items, filtra disponivel=true E
  visivel=true; retorna estoque no DTO; items com estoque=0 ainda
  aparecem (frontend renderiza "esgotado")
- POST /orders: transacao com decremento atomico via UPDATE ... SET
  estoque = estoque - X WHERE estoque >= X. Se 0 rows → 409 Conflict
  (race detected). preco vem de cantina_items.preco (nao items.preco).
  nextSenha agora recebe cantinaId real (TODO Fase A resolvido).
- favorites: middleware aplicado; logica continua user-based

Tests:
- cantina-items.test.ts: 5 CHECK constraints (estoque negativo INSERT
  + UPDATE; users_staff_must_have_name; users_rm_formato 5 digits +
  letters; aceita 6 digits + null)
- items.test.ts refactored: header obrigatorio (400 sem); inclui
  esgotado mas exclui visivel=false e disponivel=false; preco da junction
- orders.test.ts: race condition (estoque=1, 2 orders paralelos →
  201+409); estoque insuficiente (409); precoSnapshot da junction
- favorites.test.ts: header obrigatorio em todas as requests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Mobile signup simplificado + CantinaContext + apiFetch X-Cantina-Id

**Goal:** Cadastro mobile sem campo nome. Novo `CantinaContext` gerencia `currentCantinaId` em AsyncStorage. `apiFetch` injeta header `X-Cantina-Id` em rotas autenticadas. `User` type ganha `name | null` e `rm | null`.

**Files:**
- Modify: `apps/mobile/types/index.ts`
- Modify: `apps/mobile/app/(auth)/cadastro.tsx`
- Create: `apps/mobile/context/CantinaContext.tsx`
- Modify: `apps/mobile/lib/api.ts` (ou onde está o apiFetch)
- Modify: `apps/mobile/app/_layout.tsx` (mount CantinaProvider)

### Steps

- [ ] **Step 4.1: Localizar e atualizar `User` type**

Procurar definição do `User` em `apps/mobile/types/index.ts` (ou similar):

```bash
grep -rn "interface User\|type User" apps/mobile/types/ apps/mobile/context/AuthContext*
```

Atualizar:

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;        // antes: string
  rm: string | null;          // NOVO
  cantinaId: string | null;   // já existe (Fase A) — confirmar
  role: 'customer' | 'staff';
  locale: string;
  // ... outros campos existentes ...
}
```

- [ ] **Step 4.2: Atualizar `apps/mobile/app/(auth)/cadastro.tsx`**

Remover o campo "nome" e validação relacionada. Manter email + senha + confirma senha.

```typescript
// Remove o useState do name:
// const [name, setName] = useState(''); ← remover

// Remove o TextInput do nome:
// <Input label="Nome" value={name} onChangeText={setName} ... /> ← remover

// Atualiza handleSubmit pra mandar só email + senha:
async function handleSubmit() {
  // ... validations existentes (email, senha, confirma senha) ...

  try {
    await register({ email, password });
    // AuthContext atualiza user → router redireciona pra (onboarding)/welcome
    router.replace('/(onboarding)/welcome');
  } catch (err) {
    // ... error handling ...
  }
}
```

(Adapt à estrutura existente do AuthContext.register — provavelmente já existe; remover param name da chamada.)

- [ ] **Step 4.3: Atualizar `AuthContext.register` (provavelmente em `apps/mobile/context/AuthContext.tsx`)**

```typescript
async function register(input: { email: string; password: string }) {
  const res = await apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  // ... store token, set user ...
}
```

- [ ] **Step 4.4: Criar `apps/mobile/context/CantinaContext.tsx`**

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '@/constants/storage-keys';

interface Cantina {
  id: string;
  nome: string;
  andar: string | null;
  escolaId: string;
}

interface CantinaContextType {
  currentCantinaId: string | null;
  setCurrent: (id: string) => Promise<void>;
  // available: lista de cantinas da unidade do user (para o picker)
  // (preenchido externamente pela home; CantinaContext só guarda ID atual)
}

const CantinaContext = createContext<CantinaContextType | undefined>(undefined);

export function CantinaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentCantinaId, setCurrentCantinaId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hidrata current de AsyncStorage; fallback pra user.cantinaId
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.currentCantinaId);
      if (cancelled) return;
      const initial = stored ?? user?.cantinaId ?? null;
      setCurrentCantinaId(initial);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]); // re-hydrata quando user muda (login/logout)

  const setCurrent = useCallback(async (id: string) => {
    setCurrentCantinaId(id);
    await AsyncStorage.setItem(STORAGE_KEYS.currentCantinaId, id);
  }, []);

  // Se user mudar default no Perfil pra null (ex: trocou unidade), limpar current
  useEffect(() => {
    if (hydrated && user?.cantinaId === null && currentCantinaId !== null) {
      setCurrentCantinaId(null);
      AsyncStorage.removeItem(STORAGE_KEYS.currentCantinaId).catch(() => {});
    }
  }, [user?.cantinaId, hydrated, currentCantinaId]);

  return (
    <CantinaContext.Provider value={{ currentCantinaId, setCurrent }}>
      {children}
    </CantinaContext.Provider>
  );
}

export function useCantina() {
  const ctx = useContext(CantinaContext);
  if (!ctx) throw new Error('useCantina must be used inside CantinaProvider');
  return ctx;
}
```

- [ ] **Step 4.5: Adicionar `currentCantinaId` em `apps/mobile/constants/storage-keys.ts`**

```typescript
export const STORAGE_KEYS = {
  // ... existentes ...
  currentCantinaId: '@cantina:current_cantina_id',
} as const;
```

- [ ] **Step 4.6: Atualizar `apiFetch` pra injetar `X-Cantina-Id`**

Localizar `apiFetch` (provavelmente em `apps/mobile/lib/api.ts` ou similar):

```typescript
import { STORAGE_KEYS } from '@/constants/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Routes que precisam do header:
const TENANT_REQUIRED_PREFIXES = ['/api/v1/items', '/api/v1/orders', '/api/v1/favorites'];

function needsTenantHeader(url: string): boolean {
  return TENANT_REQUIRED_PREFIXES.some((p) => url.startsWith(p) || url.includes(p));
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };

  // Auth header (existente)
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  // X-Cantina-Id pra rotas tenant-scoped
  if (needsTenantHeader(path)) {
    const cantinaId = await AsyncStorage.getItem(STORAGE_KEYS.currentCantinaId);
    if (cantinaId) headers['X-Cantina-Id'] = cantinaId;
    // Se não tem cantinaId, deixa request ir e backend retorna 400
    // (frontend deve forçar onboarding antes de chegar aqui)
  }

  return fetch(url, { ...init, headers });
}
```

(Adapt à shape do apiFetch existente — pode ser uma função simples ou um wrapper de TanStack Query.)

- [ ] **Step 4.7: Mount `CantinaProvider` no root**

Em `apps/mobile/app/_layout.tsx`:

```typescript
import { CantinaProvider } from '@/context/CantinaContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CantinaProvider>          {/* NOVO */}
          {/* ... outros providers ... */}
          <Stack>...</Stack>
        </CantinaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

(Ordem importa: CantinaProvider precisa estar dentro de AuthProvider porque depende de `useAuth`.)

- [ ] **Step 4.8: Smoke test no emulador (se rodando)**

Não obrigatório — typecheck pega a maior parte. Se quiser testar:

```bash
emulator -avd <nome_avd> &  # se já não tá rodando
pnpm dev  # API + Metro
# Cria conta no app, vê que vai pro onboarding (404 da rota — OK; tela ainda não existe, será Task 5)
```

- [ ] **Step 4.9: Typecheck mobile**

Run: `pnpm --filter @cantina/mobile typecheck`
Expected: PASS. Se houver erros sobre `User.name` em outros lugares (ex: telas que faziam `<Text>{user.name}</Text>`), fix com `user.name ?? 'Sem nome'` ou guard.

- [ ] **Step 4.10: Commit**

```bash
git add apps/mobile/types/index.ts apps/mobile/app/(auth)/cadastro.tsx \
        apps/mobile/context/CantinaContext.tsx apps/mobile/context/AuthContext.tsx \
        apps/mobile/lib/api.ts apps/mobile/app/_layout.tsx \
        apps/mobile/constants/storage-keys.ts

git commit -m "$(cat <<'EOF'
feat(mobile): signup simplificado + CantinaContext + apiFetch X-Cantina-Id

- types/User: name e rm viram nullable; cantinaId ja era nullable
- (auth)/cadastro: remove campo nome, mantem email + senha + confirma
- AuthContext.register: payload so { email, password }
- CantinaContext novo: gerencia currentCantinaId em AsyncStorage,
  hidrata de stored ?? user.cantinaId no boot, limpa quando user
  muda default pra null (ex: trocou unidade)
- apiFetch: injeta X-Cantina-Id automaticamente em rotas
  /api/v1/items, /api/v1/orders, /api/v1/favorites
- _layout root mount CantinaProvider dentro de AuthProvider
- storage-keys: nova chave currentCantinaId

Onboarding e home redesign vem nas Tasks 5 e 6.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Mobile onboarding 3 telas

**Goal:** Criar grupo de rotas `(onboarding)` com 3 telas (welcome, dados, cantina) que coletam nome+RM+unidade+cantina e chamam PATCH /auth/me. Gate de onboarding incompleto em (tabs)/_layout.

**Files:**
- Create: `apps/mobile/app/(onboarding)/_layout.tsx`
- Create: `apps/mobile/app/(onboarding)/welcome.tsx`
- Create: `apps/mobile/app/(onboarding)/dados.tsx`
- Create: `apps/mobile/app/(onboarding)/cantina.tsx`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx` (gate)
- Modify: `apps/mobile/context/AuthContext.tsx` (helper updateMe)

### Steps

- [ ] **Step 5.1: Adicionar `updateMe` em `AuthContext`**

```typescript
async function updateMe(input: { name?: string; rm?: string; cantinaId?: string | null }): Promise<void> {
  const res = await apiFetch('/api/v1/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'Falha ao atualizar perfil');
  }
  const json = await res.json() as { user: User };
  setUser(json.user); // re-hidrata user no contexto
}

// Exportar no value do provider
return (
  <AuthContext.Provider value={{ user, login, register, logout, updateMe }}>
    {children}
  </AuthContext.Provider>
);
```

- [ ] **Step 5.2: Criar `apps/mobile/app/(onboarding)/_layout.tsx`**

```typescript
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // sem swipe back; força fluxo linear
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="dados" />
      <Stack.Screen name="cantina" />
    </Stack>
  );
}
```

- [ ] **Step 5.3: Criar `apps/mobile/app/(onboarding)/welcome.tsx`**

```typescript
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import type { ThemeColors } from '@/types';

export default function Welcome() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.body}>
          Vamos personalizar seu cardápio. Conta um pouco sobre você?
        </Text>
      </View>
      <Button label="Continuar" onPress={() => router.push('/(onboarding)/dados')} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 24, justifyContent: 'space-between' },
    content: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: '700', color: c.text, marginBottom: 16 },
    body: { fontSize: 18, color: c.textSecondary, lineHeight: 26 },
  });
}
```

(Adapt aos componentes existentes — provavelmente tem `Button` em `@/components/Button` da CP2.)

- [ ] **Step 5.4: Criar `apps/mobile/app/(onboarding)/dados.tsx`**

```typescript
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

const NAME_MIN = 2;
const RM_LENGTH = 6;

export default function Dados() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [rm, setRm] = useState('');

  const nameValid = name.trim().length >= NAME_MIN;
  const rmValid = /^[0-9]{6}$/.test(rm);
  const canContinue = nameValid && rmValid;

  function handleRmChange(text: string) {
    // Sanitiza: só dígitos, max 6
    const clean = text.replace(/[^0-9]/g, '').slice(0, RM_LENGTH);
    setRm(clean);
  }

  function handleContinue() {
    // Passa via router params pra próxima tela coletar tudo
    router.push({
      pathname: '/(onboarding)/cantina',
      params: { name: name.trim(), rm },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sobre você</Text>
        <Input
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Como podemos te chamar?"
          error={name.length > 0 && !nameValid ? 'Mínimo 2 caracteres' : undefined}
        />
        <Input
          label="RM"
          value={rm}
          onChangeText={handleRmChange}
          placeholder="6 dígitos"
          keyboardType="number-pad"
          maxLength={6}
          error={rm.length > 0 && !rmValid ? 'RM precisa ter exatamente 6 dígitos' : undefined}
        />
      </View>
      <Button label="Continuar" onPress={handleContinue} disabled={!canContinue} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 24, justifyContent: 'space-between' },
    content: { flex: 1, justifyContent: 'center', gap: 16 },
    title: { fontSize: 28, fontWeight: '700', color: c.text, marginBottom: 24 },
  });
}
```

- [ ] **Step 5.5: Criar `apps/mobile/app/(onboarding)/cantina.tsx`**

```typescript
import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker'; // se não tiver, instalar
import { Button } from '@/components/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { apiFetch } from '@/lib/api';
import type { ThemeColors, TenantTree } from '@/types';

export default function CantinaSelect() {
  const { colors } = useTheme();
  const { updateMe } = useAuth();
  const { setCurrent } = useCantina();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ name: string; rm: string }>();

  const [tree, setTree] = useState<TenantTree | null>(null);
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [cantinaId, setCantinaId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch /tenants/tree on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/v1/tenants/tree');
        const json = await res.json() as TenantTree;
        setTree(json);
      } catch (err) {
        setError('Falha ao carregar unidades');
      }
    })();
  }, []);

  const escolasDaUnidade = useMemo(() => {
    if (!tree || !unidadeId) return [];
    return tree.unidades.find((u) => u.id === unidadeId)?.escolas ?? [];
  }, [tree, unidadeId]);

  const cantinasDaUnidade = useMemo(() => {
    return escolasDaUnidade.flatMap((e) => e.cantinas.map((c) => ({ ...c, escolaNome: e.nome })));
  }, [escolasDaUnidade]);

  async function handleConcluir() {
    setLoading(true);
    setError(null);
    try {
      await updateMe({
        name: params.name,
        rm: params.rm,
        cantinaId,
      });
      // Sincroniza cantina session com o default que acabou de ser setado
      await setCurrent(cantinaId);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  if (!tree) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sua cantina</Text>
        <Text style={styles.label}>Unidade</Text>
        <Picker selectedValue={unidadeId} onValueChange={(v) => { setUnidadeId(v); setCantinaId(''); }} style={styles.picker}>
          <Picker.Item label="Selecione..." value="" />
          {tree.unidades.map((u) => (
            <Picker.Item key={u.id} label={u.nome} value={u.id} />
          ))}
        </Picker>

        <Text style={styles.label}>Cantina</Text>
        <Picker selectedValue={cantinaId} onValueChange={setCantinaId} enabled={!!unidadeId} style={styles.picker}>
          <Picker.Item label="Selecione..." value="" />
          {cantinasDaUnidade.map((c) => (
            <Picker.Item key={c.id} label={`${c.escolaNome} — ${c.nome}`} value={c.id} />
          ))}
        </Picker>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Button label="Concluir" onPress={handleConcluir} disabled={!cantinaId || loading} loading={loading} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 24, justifyContent: 'space-between' },
    content: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', color: c.text, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: c.textSecondary, marginTop: 16 },
    picker: { backgroundColor: c.surface, marginTop: 8 },
    error: { color: c.danger, marginTop: 12 },
  });
}
```

(Se `@react-native-picker/picker` não estiver instalado: `pnpm --filter @cantina/mobile exec npx expo install @react-native-picker/picker`. Alternativa simples: usar `Pressable` que abre Modal com FlatList — escolha do implementer.)

- [ ] **Step 5.6: Adicionar gate de onboarding em `apps/mobile/app/(tabs)/_layout.tsx`**

Localizar o `(tabs)/_layout.tsx`. Adicionar gate:

```typescript
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/login" />;

  // NOVO: gate de onboarding
  const onboardingComplete = !!(user.name && user.rm && user.cantinaId);
  if (!onboardingComplete) return <Redirect href="/(onboarding)/welcome" />;

  return <Tabs>...</Tabs>;
}
```

- [ ] **Step 5.7: Importar `TenantTree` type no mobile**

Adicionar em `apps/mobile/types/index.ts`:

```typescript
export type { TenantTree, UnidadePublic, EscolaPublic, CantinaPublic } from '@cantina/shared';
```

(Já que shared já exporta esses tipos da Fase A.)

- [ ] **Step 5.8: Smoke test manual (opcional)**

Se emulador rodando:
- Criar conta nova → redireciona pra welcome → continuar → digitar nome+RM → continuar → selecionar unidade+cantina → concluir → vai pra tabs/home
- Verificar que home não crasha (vai mostrar header da Fase B na Task 6 — por enquanto pode mostrar placeholder)

- [ ] **Step 5.9: Typecheck**

Run: `pnpm --filter @cantina/mobile typecheck`
Expected: PASS. Se faltar tipo `TenantTree`, verificar que `packages/shared` exporta corretamente (foi feito na Fase A Task 3).

- [ ] **Step 5.10: Commit**

```bash
git add apps/mobile/app/\(onboarding\)/ \
        apps/mobile/app/\(tabs\)/_layout.tsx \
        apps/mobile/context/AuthContext.tsx \
        apps/mobile/types/index.ts

git commit -m "$(cat <<'EOF'
feat(mobile): onboarding 3 telas (welcome / dados / cantina)

- (onboarding)/_layout: Stack sem header, gestureEnabled=false (linear)
- welcome: copy adaptado pro novo flow
- dados: Input nome (min 2) + RM (mask 6 digitos numericos via
  sanitize-on-change). Continuar desabilitado ate ambos validos
- cantina: fetch /tenants/tree, 2 Pickers (unidade obrigatoria,
  cantina filtrada pela unidade), botao Concluir → PATCH /auth/me
  com name+rm+cantinaId, depois setCurrent na cantina escolhida e
  router.replace pra tabs
- AuthContext.updateMe: novo helper que chama PATCH /auth/me e
  re-hidrata user no contexto
- (tabs)/_layout: gate adicional — se user.name/rm/cantinaId todos
  setados → render tabs; senao → redirect pra (onboarding)/welcome
- types: re-export TenantTree do @cantina/shared

Sem persistencia mid-flow: fechar app no meio volta pra welcome.
Aceitavel pra MVP. Onboarding interrompido perde nome+RM digitados.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Mobile home picker + Perfil edits

**Goal:** Header da home com link "Mudar unidade" + picker de cantinas da unidade. Stack screens em Perfil pra editar nome, unidade (limpa cantina), cantina default.

**Files:**
- Create: `apps/mobile/components/CantinaPickerHeader.tsx`
- Create: `apps/mobile/app/perfil/editar-nome.tsx`
- Create: `apps/mobile/app/perfil/unidade.tsx`
- Create: `apps/mobile/app/perfil/cantina-default.tsx`
- Modify: `apps/mobile/app/(tabs)/index.tsx`
- Modify: `apps/mobile/app/(tabs)/perfil.tsx`

### Steps

- [ ] **Step 6.1: Criar `CantinaPickerHeader.tsx`**

```typescript
import { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api';
import type { ThemeColors, TenantTree, CantinaPublic } from '@/types';

export function CantinaPickerHeader() {
  const { user } = useAuth();
  const { currentCantinaId, setCurrent } = useCantina();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tree, setTree] = useState<TenantTree | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/v1/tenants/tree');
      if (res.ok) setTree(await res.json());
    })();
  }, []);

  // Cantinas da unidade do user (deriva via cantinaId default → escola → unidade)
  const cantinasDaUnidade = useMemo<CantinaPublic[]>(() => {
    if (!tree || !user?.cantinaId) return [];
    for (const u of tree.unidades) {
      for (const e of u.escolas) {
        if (e.cantinas.some((c) => c.id === user.cantinaId)) {
          // Achou a unidade do user; coleta todas as cantinas dela
          return u.escolas.flatMap((es) => es.cantinas);
        }
      }
    }
    return [];
  }, [tree, user?.cantinaId]);

  const currentCantina = cantinasDaUnidade.find((c) => c.id === currentCantinaId);

  async function handlePick(id: string) {
    await setCurrent(id);
    setPickerOpen(false);
  }

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push('/perfil/unidade')}>
        <Text style={styles.linkSecondary}>Mudar unidade</Text>
      </Pressable>

      <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
        <Text style={styles.pickerLabel}>{currentCantina?.nome ?? 'Selecionar cantina'}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Escolher cantina</Text>
            <FlatList
              data={cantinasDaUnidade}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.cantinaItem, item.id === currentCantinaId && styles.cantinaItemSelected]}
                  onPress={() => handlePick(item.id)}
                >
                  <Text style={styles.cantinaItemText}>{item.nome}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    linkSecondary: { fontSize: 14, color: c.textSecondary, textDecorationLine: 'underline' },
    picker: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    pickerLabel: { fontSize: 16, fontWeight: '600', color: c.text },
    chevron: { fontSize: 14, color: c.textSecondary },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12 },
    cantinaItem: { padding: 16, borderRadius: 8 },
    cantinaItemSelected: { backgroundColor: c.primarySoft },
    cantinaItemText: { fontSize: 16, color: c.text },
  });
}
```

- [ ] **Step 6.2: Atualizar `apps/mobile/app/(tabs)/index.tsx` — usar CantinaPickerHeader**

Substituir o header existente (ou adicionar na composição):

```typescript
import { CantinaPickerHeader } from '@/components/CantinaPickerHeader';
import { useCantina } from '@/context/CantinaContext';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function Home() {
  const { currentCantinaId } = useCantina();

  const { data: items } = useQuery({
    queryKey: ['items', currentCantinaId],  // refetch quando cantina muda
    queryFn: async () => {
      const res = await apiFetch('/api/v1/items');
      if (!res.ok) throw new Error('failed');
      return (await res.json()).items;
    },
    enabled: !!currentCantinaId,
  });

  return (
    <View style={styles.container}>
      <CantinaPickerHeader />
      {/* renderiza items, esgotados, etc */}
    </View>
  );
}
```

(Adapt aos hooks/componentes existentes da CP2 — o ItemCardapio já existe; só passar items + flagar `estoque === 0` como esgotado.)

- [ ] **Step 6.3: Atualizar `apps/mobile/components/ItemCardapio` ou similar pra renderizar "esgotado"**

Procurar onde renderiza item:

```bash
grep -rn "ItemCardapio\|preco" apps/mobile/components/
```

Adicionar estado disabled quando `estoque === 0`:

```typescript
interface ItemCardapioProps {
  item: { id: string; name: string; preco: string; estoque: number };
  // ...
}

export function ItemCardapio({ item, onAddToCart }: ItemCardapioProps) {
  const esgotado = item.estoque === 0;
  return (
    <View style={[styles.card, esgotado && styles.cardDisabled]}>
      <Text>{item.name}</Text>
      {esgotado ? (
        <Text style={styles.badgeEsgotado}>Esgotado</Text>
      ) : (
        <Text>R$ {item.preco}</Text>
      )}
      <Button label="Adicionar" disabled={esgotado} onPress={() => onAddToCart(item)} />
    </View>
  );
}
```

(Adapt — o componente já existe no CP2.)

- [ ] **Step 6.4: Criar `apps/mobile/app/perfil/editar-nome.tsx`**

```typescript
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

export default function EditarNome() {
  const { user, updateMe } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (name.trim().length < 2) return;
    setLoading(true);
    try {
      await updateMe({ name: name.trim() });
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar nome</Text>
      <Input label="Nome" value={name} onChangeText={setName} />
      <Button label="Salvar" onPress={handleSave} loading={loading} disabled={name.trim().length < 2} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: c.background, gap: 16 },
    title: { fontSize: 24, fontWeight: '700', color: c.text },
  });
}
```

- [ ] **Step 6.5: Criar `apps/mobile/app/perfil/unidade.tsx`**

```typescript
import { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api';
import type { ThemeColors, TenantTree, UnidadePublic } from '@/types';

export default function TrocarUnidade() {
  const { user, updateMe } = useAuth();
  const { setCurrent } = useCantina();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tree, setTree] = useState<TenantTree | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/v1/tenants/tree');
      if (res.ok) setTree(await res.json());
    })();
  }, []);

  async function handleSelect(unidade: UnidadePublic) {
    Alert.alert(
      'Trocar unidade?',
      `Sua cantina default será limpa. Você precisará escolher uma nova cantina dentro de ${unidade.nome}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          onPress: async () => {
            setLoading(true);
            try {
              // Limpa cantina default
              await updateMe({ cantinaId: null });
              // Limpa session local
              await setCurrent(''); // ou usar uma forma específica de clear
              // Redireciona pra cantina-default da nova unidade
              router.replace(`/perfil/cantina-default?unidadeId=${unidade.id}`);
            } catch (err) {
              Alert.alert('Erro', err instanceof Error ? err.message : 'Falha');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  if (!tree) return <View style={styles.container}><Text>Carregando...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trocar unidade</Text>
      <FlatList
        data={tree.unidades}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <Pressable style={styles.unidadeItem} onPress={() => handleSelect(item)} disabled={loading}>
            <Text style={styles.unidadeNome}>{item.nome}</Text>
            <Text style={styles.unidadeDetalhe}>{item.escolas.length} escola(s)</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: c.background },
    title: { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 16 },
    unidadeItem: { padding: 16, backgroundColor: c.surface, borderRadius: 8, marginBottom: 8 },
    unidadeNome: { fontSize: 16, fontWeight: '600', color: c.text },
    unidadeDetalhe: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
  });
}
```

(Pequeno ajuste no CantinaContext: `setCurrent(null)` deveria limpar AsyncStorage. Atualizar interface se necessário pra aceitar null.)

- [ ] **Step 6.6: Atualizar `CantinaContext.setCurrent` pra aceitar null**

```typescript
const setCurrent = useCallback(async (id: string | null) => {
  setCurrentCantinaId(id);
  if (id === null) {
    await AsyncStorage.removeItem(STORAGE_KEYS.currentCantinaId);
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.currentCantinaId, id);
  }
}, []);
```

E ajustar tipo:

```typescript
interface CantinaContextType {
  currentCantinaId: string | null;
  setCurrent: (id: string | null) => Promise<void>;
}
```

- [ ] **Step 6.7: Criar `apps/mobile/app/perfil/cantina-default.tsx`**

```typescript
import { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api';
import type { ThemeColors, TenantTree, CantinaPublic } from '@/types';

export default function CantinaDefault() {
  const { user, updateMe } = useAuth();
  const { setCurrent } = useCantina();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ unidadeId?: string }>();
  const [tree, setTree] = useState<TenantTree | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/v1/tenants/tree');
      if (res.ok) setTree(await res.json());
    })();
  }, []);

  // unidadeId vem do param (vindo do trocar-unidade) ou deriva do user.cantinaId atual
  const targetUnidadeId = useMemo(() => {
    if (params.unidadeId) return params.unidadeId;
    if (!tree || !user?.cantinaId) return null;
    for (const u of tree.unidades) {
      for (const e of u.escolas) {
        if (e.cantinas.some((c) => c.id === user.cantinaId)) return u.id;
      }
    }
    return null;
  }, [tree, user?.cantinaId, params.unidadeId]);

  const cantinas = useMemo<CantinaPublic[]>(() => {
    if (!tree || !targetUnidadeId) return [];
    const u = tree.unidades.find((un) => un.id === targetUnidadeId);
    return u?.escolas.flatMap((e) => e.cantinas) ?? [];
  }, [tree, targetUnidadeId]);

  async function handleSelect(cantinaId: string) {
    await updateMe({ cantinaId });
    await setCurrent(cantinaId);
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolher cantina default</Text>
      <FlatList
        data={cantinas}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Pressable style={styles.cantinaItem} onPress={() => handleSelect(item.id)}>
            <Text style={styles.cantinaNome}>{item.nome}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: c.background },
    title: { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 16 },
    cantinaItem: { padding: 16, backgroundColor: c.surface, borderRadius: 8, marginBottom: 8 },
    cantinaNome: { fontSize: 16, color: c.text },
  });
}
```

- [ ] **Step 6.8: Atualizar `apps/mobile/app/(tabs)/perfil.tsx` com display + links**

Adicionar seção que exibe:
- Nome (link → `/perfil/editar-nome`)
- Email (read-only)
- RM (read-only — mostra valor mas sem onPress)
- Unidade atual (deriva do user.cantinaId via tree; link → `/perfil/unidade`)
- Cantina default (link → `/perfil/cantina-default`)

```typescript
// dentro do componente perfil:
<View style={styles.section}>
  <Pressable onPress={() => router.push('/perfil/editar-nome')}>
    <Text style={styles.label}>Nome</Text>
    <Text style={styles.value}>{user?.name ?? 'Não informado'}</Text>
  </Pressable>
  <View>
    <Text style={styles.label}>Email</Text>
    <Text style={styles.value}>{user?.email}</Text>
  </View>
  <View>
    <Text style={styles.label}>RM</Text>
    <Text style={styles.value}>{user?.rm ?? '—'}</Text>
  </View>
  <Pressable onPress={() => router.push('/perfil/unidade')}>
    <Text style={styles.label}>Unidade</Text>
    <Text style={styles.value}>{unidadeNome ?? 'Selecione'}</Text>
  </Pressable>
  <Pressable onPress={() => router.push('/perfil/cantina-default')}>
    <Text style={styles.label}>Cantina default</Text>
    <Text style={styles.value}>{cantinaNome ?? 'Selecione'}</Text>
  </Pressable>
</View>
```

(Computar `unidadeNome` e `cantinaNome` via tree query.)

- [ ] **Step 6.9: Smoke test (opcional)**

Testar fluxo completo:
- Logar com user já completou onboarding
- Home: vê picker no topo, pode trocar cantina (refetch ocorre, cardápio muda)
- Perfil: vê dados, edita nome (PATCH), troca unidade (limpa cantina + redireciona pra picker), escolhe nova cantina

- [ ] **Step 6.10: Typecheck**

Run: `pnpm --filter @cantina/mobile typecheck`
Expected: PASS.

- [ ] **Step 6.11: Commit**

```bash
git add apps/mobile/components/CantinaPickerHeader.tsx \
        apps/mobile/app/\(tabs\)/index.tsx \
        apps/mobile/app/\(tabs\)/perfil.tsx \
        apps/mobile/app/perfil/ \
        apps/mobile/context/CantinaContext.tsx \
        apps/mobile/components/ItemCardapio.tsx  # se renomeou

git commit -m "$(cat <<'EOF'
feat(mobile): home picker + perfil edits

- components/CantinaPickerHeader: link "Mudar unidade" (esquerda,
  link pro perfil) + dropdown picker (direita, lista cantinas da
  unidade do user, modal slide-up). Ao escolher, atualiza
  CantinaContext.currentCantinaId via setCurrent
- (tabs)/index: usa CantinaPickerHeader; useQuery com queryKey
  ['items', currentCantinaId] forca refetch ao trocar cantina
- ItemCardapio: badge "Esgotado" quando estoque=0; botao add
  desabilitado
- perfil/editar-nome: input + PATCH /auth/me
- perfil/unidade: lista unidades, Alert confirma troca, depois
  PATCH cantinaId=null + redireciona pra cantina-default com
  unidadeId no param
- perfil/cantina-default: lista cantinas da unidade (param ou
  derivada do user.cantinaId atual), seleciona → PATCH /auth/me
  + setCurrent
- (tabs)/perfil: display nome/email/RM/unidade/cantina default
  com links pras sub-screens; RM read-only
- CantinaContext.setCurrent aceita null (clear AsyncStorage)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Aplicar Fase B no Neon (reset + migrate + seed)

**Goal:** Resetar o banco Neon, aplicar migration `0003`, popular hierarquia + items + cantina_items. Validar via `/items` (com header) e `/auth/register` (sem nome).

**Files:** nenhum (operação manual sobre o banco).

### Steps

- [ ] **Step 7.1: Verificar `.env` aponta pro Neon**

```bash
cat apps/api/.env | grep -E "USE_PGLITE|DATABASE_URL"
# Espera: USE_PGLITE=false, DATABASE_URL=postgresql://...neon.tech/...
```

- [ ] **Step 7.2: Confirmar conectividade**

```bash
nc -z -v -w 5 ep-falling-sea-ajom8rym.c-3.us-east-2.aws.neon.tech 5432
# Espera: "Connection succeeded"
```

Se falhar (Wi-Fi FIAP bloqueia 5432), usar 5G/tethering.

- [ ] **Step 7.3: Reset do Neon**

```bash
pnpm api:db:reset
# Prompt: "Pra continuar, digite a frase exata: apagar tudo em prod"
# Digite: apagar tudo em prod
```

Reset agora dropa public + drizzle (fix da Fase A). Espera "Schema reset".

- [ ] **Step 7.4: Aplicar migrations 0000 + 0001 + 0002 + 0003**

```bash
pnpm api:db:migrate
# Espera: "Migrations done ✅"
```

- [ ] **Step 7.5: Popular hierarquia + items + cantina_items**

```bash
pnpm api:db:seed
# Espera:
# INFO:   ↳ 2 unidades
# INFO:   ↳ 3 escolas
# INFO:   ↳ 4 cantinas
# INFO:   ↳ 12 items
# INFO:   ↳ 48 cantina_items
# INFO: Seed completo ✅
```

- [ ] **Step 7.6: Validar via API local apontando pro Neon**

```bash
pnpm api:dev &
sleep 3

# 1. Tenants tree (público)
curl -s http://localhost:8787/api/v1/tenants/tree | python3 -m json.tool | head -30

# 2. Register (sem nome)
TOKEN=$(curl -s -X POST http://localhost:8787/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"senha123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"

# 3. PATCH /auth/me com nome+rm+cantina
curl -s -X PATCH http://localhost:8787/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke","rm":"123456","cantinaId":"c_pa_5"}' | python3 -m json.tool

# 4. Items com header (deve retornar 12 items)
curl -s http://localhost:8787/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cantina-Id: c_pa_5" | python3 -m json.tool | head -40

# 5. Items SEM header (deve retornar 400)
curl -s -w "\n[HTTP %{http_code}]\n" http://localhost:8787/api/v1/items \
  -H "Authorization: Bearer $TOKEN"

kill %1 2>/dev/null || true
```

Validar que:
- Tree retorna 2 unidades / 3 escolas / 4 cantinas
- Register retorna token + user com `name: null, rm: null, cantinaId: null`
- PATCH atualiza pra Smoke / 123456 / c_pa_5
- Items com header retorna 12 items, cada com preço Paulista (base) e estoque [100,350]
- Items sem header retorna 400

- [ ] **Step 7.7: Sem commit** (operação sobre banco). Continua direto pra Task 8.

---

## Task 8: Documentação + memória

**Goal:** Atualizar HANDOFF/CLAUDE/memória pra refletir Fase B entregue.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/HANDOFF.md`
- Modify: `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md`

### Steps

- [ ] **Step 8.1: Atualizar `CLAUDE.md`**

Localizar a seção `## Convenções inegociáveis` e atualizar item 12 (Fase A) ou adicionar item 13 com Fase B specifics:

```markdown
12. **Tenants são hierárquicos: `unidades` → `escolas` → `cantinas` → `cantina_items` (cardápio per-cantina)**. Cliente sem vínculo fixo (escolhe cantina default no onboarding, edita no Perfil). Staff vinculado a UMA cantina via CHECK constraint. API recebe contexto via header `X-Cantina-Id` (middleware aplicado em items/orders/favorites). Estoque é atômico via UPDATE WHERE estoque >= qtd; race detected → 409. Items globais (`items`) são template de catálogo; preço/estoque/visibilidade per-cantina vêm de `cantina_items`. Disponibilidade tem 2 booleans: `disponivel` (operacional, controlado pela operação) + `visivel` (vitrine on/off, Fase C UI). Item com estoque=0 ainda aparece como "esgotado" (não some).

13. **Onboarding mobile completa user.name/rm/cantinaId via `PATCH /auth/me`**. Signup (POST /auth/register) só email+senha. Onboarding em 3 telas (welcome → nome+RM → unidade+cantina). Sem persistência mid-flow (fechar app volta pra welcome). RM read-only após onboarding. CantinaContext gerencia session atual em AsyncStorage (separado do default em DB).
```

- [ ] **Step 8.2: Atualizar `docs/HANDOFF.md`**

Atualizar status:

```markdown
- **Status (2026-05-07):** Foundation + hardening + mobile-only + **Sub-projeto 2 / Fase B entregues**. 12 items globais + 48 cantina_items populados no Neon (preços per-unidade, estoque random). Onboarding 3 telas funcional. PATCH /auth/me wired. Próxima: Fase C (vitrine on/off + tela admin staff + markRetirado).
```

Substituir a seção "Hierarquia de tenants (Fase A entregue)" pela seção atualizada com Fase B:

```markdown
## 🏢 Cardápio per-cantina (Fase B entregue 2026-05-07)

Estado do banco no Neon:
- 2 unidades, 3 escolas, 4 cantinas (Paulista 5º + 7º, Lins School Térreo, Lins Faculdade Térreo)
- 12 items globais (catálogo template) + 48 cantina_items (cross-product)
- Preços: Paulista usa items.preco; Lins usa items.preco × 0.85
- Estoque inicial: random [100, 350] por linha

**Endpoints novos:**
- `PATCH /api/v1/auth/me` — atualiza name?/rm?/cantinaId? do user logado
- `GET /api/v1/items` — agora exige header X-Cantina-Id; JOIN com cantina_items, filtra disponivel+visivel; retorna estoque no DTO
- `POST /api/v1/orders` — transação com decremento atômico; preço de cantina_items.preco; race → 409

**Schema novo:**
- `cantina_items(cantina_id, item_id, preco, estoque, disponivel, visivel)` PK composta + CHECK estoque>=0
- `users.rm text` + CHECK regex; `users.name` nullable + CHECK staff-only; `orders.cantina_id` NOT NULL
- Drop legados: `items.cantina_id`, `favorites.cantina_id`

**Pra Fase C usar:**
- `cantina_items.disponivel` + `cantina_items.visivel` prontos pra UI staff
- `nextSenha(db, cantinaId)` real — senhas resetam por dia POR cantina
- CantinaContext mobile reusável pra tela admin staff
- Helper `createTestCantinaItems` em fixtures pra setup de tests futuros

**Spec:** [`docs/superpowers/specs/2026-05-07-cardapio-per-cantina-fase-b-design.md`](./superpowers/specs/2026-05-07-cardapio-per-cantina-fase-b-design.md)
**Plano:** [`docs/superpowers/plans/2026-05-07-cardapio-per-cantina-fase-b-plan.md`](./superpowers/plans/2026-05-07-cardapio-per-cantina-fase-b-plan.md)
```

- [ ] **Step 8.3: Atualizar memória**

Reescrever `/Users/johnny/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md`:

```markdown
---
name: Estado atual do projeto Cantina
description: Snapshot 2026-05-07 — Foundation + hardening + mobile-only + Fase A + Fase B entregues. Sempre ler CLAUDE.md + docs/HANDOFF.md ao retomar.
type: project
---
**Snapshot 2026-05-07.** Sempre ler [`CLAUDE.md`](/Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app/CLAUDE.md) e [`docs/HANDOFF.md`](/Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app/docs/HANDOFF.md) antes de qualquer ação.

**Diretório:** `/Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app/`
**Repo:** https://github.com/jota0802/fiap-mdi-cp2-cantina-app
**Branch ativa:** `main`

**Sub-projetos:**

1. **Foundation** ✅ + hardening segurança ✅ + mobile-only ✅
2. **Cantina admin** — decomposto em 4 fases:
   - **Fase A** ✅ ENTREGUE 2026-05-07: hierarquia tenants + tenant-context middleware + CLI create-staff + endpoint /tenants/tree
   - **Fase B** ✅ ENTREGUE 2026-05-07: cantina_items + onboarding + PATCH /auth/me + middleware wired
   - Fase C (futuro): vitrine on/off (UI staff) + tela admin de estoque + markRetirado
   - Fase D (futuro): fornecedores + reset-password + housekeeping
3. **Customer flows v2** (futuro)

**Stack atual:**

- `apps/mobile` — Expo SDK 55 · RN 0.83.6 · TS strict · Expo Router 55 · TanStack Query v5
- `apps/api` — Hono 4 · Drizzle ORM · Postgres (Neon prod / pglite dev) · @node-rs/argon2 · jose · Zod · Vitest (~75 tests + 22 mobile)
- `packages/shared` — Zod schemas (auth, item, order, tenant)

**Cardápio per-cantina (Fase B):**

- `cantina_items(cantina_id, item_id, preco, estoque, disponivel, visivel)` — PK composta
- 4 cantinas × 12 items = 48 rows populados no Neon
- Preços per-unidade: Paulista base, Lins × 0.85
- Estoque atômico via UPDATE WHERE estoque >= qtd; race → 409
- Item esgotado (estoque=0) aparece com badge "Esgotado", botão disabled
- Middleware `tenantContext` wired em items/orders/favorites — header `X-Cantina-Id` obrigatório
- Mobile CantinaContext gerencia session em AsyncStorage; default em DB

**Onboarding (Fase B):**

- Signup só email + senha + confirma senha
- 3 telas: welcome → nome+RM → unidade+cantina → PATCH /auth/me
- RM read-only após onboarding
- Trocar unidade no Perfil limpa cantina_id auto

**Comandos críticos:**

- `pnpm -r typecheck && pnpm -r test` — baseline (~75 API + 22 mobile)
- `pnpm dev` — API + Metro juntos
- `pnpm api:create-staff --cantina=<id> --email=<...> --name="<...>"` — cria staff
- `pnpm api:db:reset` — reset com confirmação prod (dropa public + drizzle)
- `pnpm mobile:build:apk` — APK Android via EAS Build

**How to apply:**

1. `cd /Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app`
2. Ler `CLAUDE.md` + `docs/HANDOFF.md`
3. `pnpm -r typecheck && pnpm -r test` baseline verde
4. **Mobile-only** (`feedback_mobile_only.md`)
5. **Tenants hierárquicos com cardápio per-cantina** — toda nova feature precisa pensar no escopo (global, per-unidade, per-cantina, per-user)
6. Commits: autor `jota0802`, conventional commits PT, trailer Co-Authored-By Claude
```

- [ ] **Step 8.4: Validação final**

```bash
pnpm -r typecheck && pnpm -r test
# Espera: typecheck PASS + ~75 API tests + 22 mobile tests todos passando

# API sobe limpa contra Neon:
pnpm dev &
sleep 5
curl -s http://localhost:8787/api/v1/health
kill %1 2>/dev/null || true
```

- [ ] **Step 8.5: Commit das docs**

```bash
git add CLAUDE.md docs/HANDOFF.md

git commit -m "$(cat <<'EOF'
docs: spec Fase B entregue — atualiza CLAUDE/HANDOFF

CLAUDE.md:
- Convencao #12 atualizada com cardapio per-cantina, cantina_items,
  middleware wired, decremento atomico, 2 booleans disponivel/visivel
- Convencao #13 nova: onboarding mobile via PATCH /auth/me, signup
  simplificado, CantinaContext

HANDOFF.md:
- Status: Fase B entregue 2026-05-07
- Substitui secao Fase A pela atualizada com Fase B (endpoints novos,
  schema novo, what's available pra Fase C)
- Refs spec + plano

Memoria do Claude atualizada a parte:
- project_estado_atual.md reescrito refletindo Fase B
- Sem novos memory files (Fase A's project_proxima_acao ja foi removido)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8.6: Validar git log final**

```bash
git log --oneline -10
```

Espera 8+ commits desta fase no topo.

- [ ] **Step 8.7: (Opcional) Push pro origin**

```bash
git push origin main
# Render redeploya e aplica migration 0003 lá automaticamente
# Validar:
sleep 300  # ~5min
curl -s https://cantina-api.onrender.com/api/v1/tenants/tree | head -20
```

---

## Critérios de sucesso (do spec)

Validar todos antes de declarar Fase B completa:

- [ ] `pnpm -r typecheck` passa nos 3 workspaces
- [ ] `pnpm -r test` passa (~75 API + 22 mobile)
- [ ] Migration `0003_cardapio_per_cantina.sql` aplicada em pglite e Neon sem erro
- [ ] `db:reset + migrate + seed` deixa o banco com 12 items + 48 cantina_items + 4 cantinas
- [ ] `GET /api/v1/items` sem header retorna 400
- [ ] `GET /api/v1/items` com header retorna items dessa cantina; `disponivel=false` ou `visivel=false` não aparecem; `estoque=0` aparece com `estoque: 0`
- [ ] `POST /orders` com header decrementa cantina_items.estoque atomicamente
- [ ] 2 `POST /orders` paralelos pro último item retornam 201 + 409
- [ ] CHECK barra `INSERT cantina_items (estoque=-1)`
- [ ] CHECK barra `INSERT users (role='staff', name=NULL)`
- [ ] CHECK barra `INSERT users (rm='12345')` (5 dígitos), `'1234567'` (7), `'abc999'` (letras)
- [ ] `POST /auth/register` sem `name` no body funciona
- [ ] `PATCH /auth/me { rm: '999999' }` funciona; `{ rm: '12345' }` → 422
- [ ] Mobile: signup → onboarding 3 telas → home com cardápio da cantina
- [ ] Mobile: picker no topo da home troca cantina session sem persistir DB; refetch ocorre
- [ ] Mobile: trocar unidade no Perfil limpa cantina default e força repicker
- [ ] Mobile: item com estoque=0 mostra badge "Esgotado", botão disabled
- [ ] Documentação atualizada: HANDOFF, CLAUDE, memória

---

## Resumo da estrutura de commits

| # | Commit | Task |
|---|---|---|
| 1 | `feat(db): cantina_items + users.rm/name nullable + cleanup Fase A` | Task 1 |
| 2 | `feat(api): PATCH /auth/me + signup sem nome` | Task 2 |
| 3 | `feat(api): wire tenant-context em items/orders/favorites + decremento atomico` | Task 3 |
| 4 | `feat(mobile): signup simplificado + CantinaContext + apiFetch X-Cantina-Id` | Task 4 |
| 5 | `feat(mobile): onboarding 3 telas (welcome / dados / cantina)` | Task 5 |
| 6 | `feat(mobile): home picker + perfil edits` | Task 6 |
| 7 | (sem commit — operação Neon) | Task 7 |
| 8 | `docs: spec Fase B entregue — atualiza CLAUDE/HANDOFF` | Task 8 |

**7 commits novos.** Cada um é independente: typecheck + tests passam após cada um. Se algum quebrar, fácil reverter sem afetar próximos.
