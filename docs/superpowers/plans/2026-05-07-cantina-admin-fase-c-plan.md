# Cantina admin Fase C — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o lado staff da cantina (shell adaptativo tablet/celular, fila de pedidos master-detail, cardápio admin, dashboard de estatísticas), simplificar a máquina de estados de pedidos pra 3 statuses globais e adicionar cancelamento bilateral com devolução atômica de estoque.

**Architecture:** Mobile-only Expo SDK 55 com layout adaptativo (`useWindowDimensions().width >= 900` ativa side rail permanente, abaixo disso vira drawer colapsável + master-detail empilhado). Backend Hono + Drizzle adiciona middleware `requireRole('staff')`, 5 endpoints novos (`PATCH /orders/:id/status`, `PATCH /orders/bulk-status`, `POST /orders/:id/cancel`, `PATCH /cantina-items/:itemId`, `GET /stats`) e migration 0004 que renomeia `pendente`→`pedido`, drop status `preparando` e `retirado`, adiciona `canceled_by`/`cancel_reason` em `orders`. Customer-side dropa o auto-pronto mock de 3min, ganha botão de cancelar e refetch periódico.

**Tech Stack:** Hono 4, Drizzle ORM, Postgres (Neon prod / pglite dev), Vitest. Expo SDK 55, React 19, RN 0.83.6, Expo Router 55, TanStack Query v5, react-native-svg, @expo/vector-icons, AsyncStorage.

---

## File Structure

**Backend (apps/api):**
- Create: `apps/api/drizzle/0004_fase_c_orders.sql` — migration
- Create: `apps/api/src/middleware/require-role.ts` — staff-only gate
- Create: `apps/api/src/middleware/require-role.test.ts`
- Create: `apps/api/src/routes/stats.ts` — GET /stats com agregações SQL
- Create: `apps/api/src/routes/stats.test.ts`
- Create: `apps/api/src/routes/cantina-items.ts` — PATCH cantina_items
- Create: `apps/api/src/routes/cantina-items.test.ts`
- Modify: `apps/api/src/routes/orders.ts` — split em customer/staff; adicionar PATCH staff status, bulk-status, POST cancel
- Modify: `apps/api/src/routes/orders.test.ts` — atualizar status `pendente`→`pedido`; novos testes
- Modify: `apps/api/src/db/schema.ts` — add canceledBy, cancelReason em `orders`
- Modify: `apps/api/src/index.ts` — registrar rotas novas
- Modify: `apps/api/src/db/seed.ts` — orders status `'pendente'` → `'pedido'` se houver
- Modify: `apps/api/src/test/fixtures.ts` — fixtures que criam orders com status `'pedido'`

**Shared (packages/shared):**
- Modify: `packages/shared/src/schemas/order.ts` — `OrderStatusSchema` 3 valores; novos schemas `UpdateOrderStatusByStaffSchema`, `BulkUpdateStatusSchema`, `CancelOrderSchema`
- Modify: `packages/shared/src/schemas/item.ts` — `UpdateCantinaItemSchema` novo
- Create: `packages/shared/src/schemas/stats.ts` — `StatsResponseSchema`, `StatsPeriodSchema`
- Modify: `packages/shared/src/schemas/index.ts` — exportar novos

**Mobile (apps/mobile):**
- Create: `apps/mobile/app/(staff)/_layout.tsx` — StaffShell wrapper
- Create: `apps/mobile/app/(staff)/pedidos.tsx`
- Create: `apps/mobile/app/(staff)/pedido/[id].tsx` — phone fallback
- Create: `apps/mobile/app/(staff)/cardapio.tsx`
- Create: `apps/mobile/app/(staff)/cardapio/[id].tsx` — phone fallback
- Create: `apps/mobile/app/(staff)/stats.tsx`
- Create: `apps/mobile/app/(staff)/perfil.tsx`
- Create: `apps/mobile/components/StaffShell.tsx`
- Create: `apps/mobile/components/SideRail.tsx`
- Create: `apps/mobile/components/MobileDrawer.tsx`
- Create: `apps/mobile/components/MasterDetailLayout.tsx`
- Create: `apps/mobile/components/BarChart.tsx`
- Create: `apps/mobile/components/KpiCard.tsx`
- Create: `apps/mobile/components/SegmentedControl.tsx`
- Create: `apps/mobile/components/ConfirmModal.tsx`
- Create: `apps/mobile/hooks/useResponsiveShell.ts`
- Create: `apps/mobile/hooks/useStaffOrders.ts`
- Create: `apps/mobile/hooks/useStaffCardapio.ts`
- Create: `apps/mobile/hooks/useStaffStats.ts`
- Create: `apps/mobile/lib/role-redirect.ts` — pure function, testável
- Create: `apps/mobile/test/role-redirect.test.mjs`
- Create: `apps/mobile/test/responsive-shell.test.mjs`
- Modify: `apps/mobile/app/_layout.tsx` — role redirect
- Modify: `apps/mobile/app/(tabs)/_layout.tsx` — guard staff → (staff)
- Modify: `apps/mobile/app/(onboarding)/_layout.tsx` — guard staff
- Modify: `apps/mobile/context/CantinaContext.tsx` — staff fixo em user.cantinaId
- Modify: `apps/mobile/context/OrdersContext.tsx` — drop auto-pronto 3min
- Modify: `apps/mobile/app/confirmacao.tsx` — drop scheduled notification 3min
- Modify: `apps/mobile/app/(tabs)/pedidos.tsx` — botão cancelar + refetch 10s
- Modify: `apps/mobile/constants/theme.ts` — `statusPalette` adaptado pra `pedido | pronto | cancelado`

**Docs:**
- Modify: `CLAUDE.md` — §13 atualizado pro novo enum; menção de staff app
- Modify: `docs/HANDOFF.md` — seção Fase C
- Modify: `docs/ROADMAP.md` — marcar Fase C done
- Memória: atualizar `project_estado_atual.md`, `project_proxima_acao.md`

---

## Pre-condition

Antes de começar tasks: wipe + reseed do Neon (já é prática estabelecida). Backup local opcional via `pg_dump` se houver dados de teste manuais relevantes.

```bash
cd /Users/johnny/Downloads/cp-mobile/fiap-mdi-cp2-cantina-app
pnpm api:db:reset          # confirma com frase exata por TTY
# (depois das tasks 1+2, rodar:)
pnpm api:db:migrate
pnpm api:db:seed
```

Validar baseline antes de qualquer task:

```bash
pnpm -r typecheck && pnpm -r test
# Esperado: 85 API + 22 mobile = 107 testes passando
```

---

## Phase 1 — Backend foundation (Tasks 1–9)

### Task 1: Schema diff + migration 0004

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Create: `apps/api/drizzle/0004_fase_c_orders.sql`
- Modify: `apps/api/drizzle/meta/_journal.json` (gerado por drizzle-kit)
- Modify: `apps/api/src/db/seed.ts`
- Modify: `apps/api/src/test/fixtures.ts`

- [ ] **Step 1.1: Adicionar colunas em `orders` no schema TS**

Modificar `apps/api/src/db/schema.ts` linha ~83 (export const orders):

```ts
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
  canceledBy: text('canceled_by'),
  cancelReason: text('cancel_reason'),
  cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status),
  cantinaDayIdx: index('orders_cantina_day_idx').on(t.cantinaId, t.criadoEm),
  canceledByCheck: check(
    'orders_canceled_by_check',
    sql`canceled_by IS NULL OR canceled_by IN ('customer','staff')`,
  ),
  cancelConsistency: check(
    'orders_cancel_consistency',
    sql`(status = 'cancelado' AND cancelado_em IS NOT NULL AND canceled_by IS NOT NULL)
       OR (status != 'cancelado' AND canceled_by IS NULL)`,
  ),
  statusValidos: check(
    'orders_status_validos',
    sql`status IN ('pedido','pronto','cancelado')`,
  ),
}));
```

- [ ] **Step 1.2: Criar migration SQL manualmente**

Criar `apps/api/drizzle/0004_fase_c_orders.sql`:

```sql
-- Rename pendente/preparando → pedido (idempotente)
UPDATE "orders" SET "status" = 'pedido' WHERE "status" IN ('pendente','preparando');
UPDATE "orders" SET "status" = 'cancelado' WHERE "status" = 'retirado';--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN "canceled_by" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_reason" text;--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_canceled_by_check"
  CHECK (canceled_by IS NULL OR canceled_by IN ('customer','staff'));--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_cancel_consistency"
  CHECK ((status = 'cancelado' AND cancelado_em IS NOT NULL AND canceled_by IS NOT NULL)
       OR (status != 'cancelado' AND canceled_by IS NULL));--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_status_validos"
  CHECK (status IN ('pedido','pronto','cancelado'));
```

- [ ] **Step 1.3: Atualizar `_journal.json` da Drizzle**

Adicionar entry pra `0004_fase_c_orders` em `apps/api/drizzle/meta/_journal.json`. Copiar estrutura da última entry (0003) e bumpar:

```json
{
  "idx": 4,
  "version": "7",
  "when": <timestamp atual em ms>,
  "tag": "0004_fase_c_orders",
  "breakpoints": true
}
```

- [ ] **Step 1.4: Atualizar seed pra usar status='pedido'**

Modificar `apps/api/src/db/seed.ts`: trocar todas ocorrências de `status: 'pendente'` por `status: 'pedido'`. Drop ocorrências de `'preparando'`, `'retirado'`. Pedidos cancelados precisam ter `canceledEm`, `canceledBy='staff'` setados.

- [ ] **Step 1.5: Atualizar fixtures de teste**

Modificar `apps/api/src/test/fixtures.ts`: helper `createTestOrder` (se existir) usar `status: 'pedido'`. Se não existir helper, adicionar:

```ts
export async function createTestOrder(
  db: TestDb,
  opts: {
    userId: string;
    cantinaId: string;
    status?: 'pedido' | 'pronto' | 'cancelado';
    senha?: number;
    items?: Array<{ itemId: string; quantidade: number; precoSnapshot: string; nameSnapshot: string }>;
  },
) {
  const orderId = createId();
  const status = opts.status ?? 'pedido';
  await db.insert(orders).values({
    id: orderId,
    userId: opts.userId,
    cantinaId: opts.cantinaId,
    status,
    total: '10.00',
    senha: opts.senha ?? 1,
    ...(status === 'cancelado' ? { canceladoEm: new Date(), canceledBy: 'staff' } : {}),
    ...(status === 'pronto' ? { prontoEm: new Date() } : {}),
  });
  if (opts.items) {
    await db.insert(orderItems).values(opts.items.map((it) => ({
      id: createId(),
      orderId,
      itemId: it.itemId,
      nameSnapshot: it.nameSnapshot,
      precoSnapshot: it.precoSnapshot,
      quantidade: it.quantidade,
      observacoes: null,
    })));
  }
  return { orderId };
}
```

- [ ] **Step 1.6: Aplicar migration + reseed Neon e dev**

```bash
pnpm api:db:reset      # confirma frase exata
pnpm api:db:migrate    # aplica 0000-0004
pnpm api:db:seed
```

- [ ] **Step 1.7: Rodar typecheck**

```bash
pnpm -r typecheck
```

Expected: PASS. Os testes vão quebrar nessa task (são fixados na Task 3+); typecheck deve passar.

- [ ] **Step 1.8: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/0004_fase_c_orders.sql \
        apps/api/drizzle/meta/_journal.json apps/api/src/db/seed.ts \
        apps/api/src/test/fixtures.ts
git commit -m "$(cat <<'EOF'
feat(db): migration 0004 simplifica enum de status pra 3 valores e adiciona campos de cancelamento

- Renomeia pendente/preparando → pedido; drop retirado (orders existentes viram cancelado)
- Adiciona canceled_by + cancel_reason + 3 CHECKs (status validos, canceled_by enum, cancel consistency)
- Atualiza seed e fixtures pra novo enum

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 2: Middleware `requireRole`

**Files:**
- Create: `apps/api/src/middleware/require-role.ts`
- Create: `apps/api/src/middleware/require-role.test.ts`

- [ ] **Step 2.1: Criar test failing**

Criar `apps/api/src/middleware/require-role.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { requireRole } from './require-role.js';
import type { JwtPayload } from '../lib/jwt.js';

describe('requireRole middleware', () => {
  function makeApp(role: 'customer' | 'staff', userRole: 'customer' | 'staff') {
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('user', { sub: 'u1', role: userRole, email: 'x@x', cantinaId: null } as JwtPayload);
      await next();
    });
    app.use('*', requireRole(role));
    app.get('/', (c) => c.json({ ok: true }));
    return app;
  }

  it('libera quando role bate', async () => {
    const app = makeApp('staff', 'staff');
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  it('bloqueia com 403 quando role não bate', async () => {
    const app = makeApp('staff', 'customer');
    const res = await app.request('/');
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2.2: Rodar test pra confirmar que falha**

```bash
pnpm --filter @cantina/api test require-role
```

Expected: FAIL — `requireRole` não existe ainda.

- [ ] **Step 2.3: Implementar middleware**

Criar `apps/api/src/middleware/require-role.ts`:

```ts
import type { MiddlewareHandler } from 'hono';
import { forbidden } from '../lib/errors.js';

export type ValidRole = 'customer' | 'staff';

export function requireRole(role: ValidRole): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || user.role !== role) {
      throw forbidden(`Apenas ${role} pode acessar esta rota`);
    }
    await next();
  };
}
```

- [ ] **Step 2.4: Rodar test pra confirmar que passa**

```bash
pnpm --filter @cantina/api test require-role
```

Expected: PASS (2 tests).

- [ ] **Step 2.5: Commit**

```bash
git add apps/api/src/middleware/require-role.ts apps/api/src/middleware/require-role.test.ts
git commit -m "$(cat <<'EOF'
feat(api): adiciona middleware requireRole pra gating staff/customer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3: Atualizar shared schemas

**Files:**
- Modify: `packages/shared/src/schemas/order.ts`
- Modify: `packages/shared/src/schemas/item.ts`
- Create: `packages/shared/src/schemas/stats.ts`
- Modify: `packages/shared/src/schemas/index.ts`

- [ ] **Step 3.1: Atualizar OrderStatusSchema + adicionar novos schemas**

Modificar `packages/shared/src/schemas/order.ts`:

```ts
import { z } from 'zod';

export const OrderStatusSchema = z.enum(['pedido', 'pronto', 'cancelado']);
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
  canceledBy: z.enum(['customer', 'staff']).nullable(),
  cancelReason: z.string().nullable(),
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

// Legacy: customer cancel via PATCH (kept for backwards compat).
// New flow uses POST /orders/:id/cancel.
export const UpdateOrderStatusSchema = z.object({
  status: z.literal('cancelado'),
});

// Staff: marca pronto, cancela com motivo, ou faz rollback pronto→pedido
export const UpdateOrderStatusByStaffSchema = z.object({
  status: z.enum(['pedido', 'pronto', 'cancelado']),
  reason: z.string().max(200).optional(),
});

// Staff: bulk markPronto — só marca como pronto em massa
export const BulkUpdateStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  status: z.literal('pronto'),
});

// Customer: cancel
export const CancelOrderSchema = z.object({}).strict();
```

- [ ] **Step 3.2: Adicionar UpdateCantinaItemSchema**

Modificar `packages/shared/src/schemas/item.ts` adicionando ao final:

```ts
export const UpdateCantinaItemSchema = z.object({
  visivel: z.boolean().optional(),
  disponivel: z.boolean().optional(),
  estoque: z.number().int().nonnegative().optional(),
  preco: z.number().positive().multipleOf(0.01).optional(),
}).refine((d) => Object.keys(d).length > 0, {
  message: 'Pelo menos um campo deve ser informado',
});
```

- [ ] **Step 3.3: Criar stats schema**

Criar `packages/shared/src/schemas/stats.ts`:

```ts
import { z } from 'zod';

export const StatsPeriodSchema = z.enum(['daily', 'weekly', 'monthly']);
export type StatsPeriod = z.infer<typeof StatsPeriodSchema>;

export const StatsTopItemSchema = z.object({
  itemId: z.string(),
  nome: z.string(),
  qtd: z.number().int().nonnegative(),
  faturamento: z.string(),
});

export const StatsResponseSchema = z.object({
  period: StatsPeriodSchema,
  atendidos: z.number().int().nonnegative(),
  cancelados: z.number().int().nonnegative(),
  faturamento: z.string(),
  ticketMedio: z.string(),
  tempoMedioPreparoSec: z.number().nonnegative().nullable(),
  pedidosPorHora: z.array(z.number().int().nonnegative()).length(11),
  topItems: z.array(StatsTopItemSchema).max(5),
  comparacao: z.object({
    atendidosDeltaPct: z.number().nullable(),
    faturamentoDeltaPct: z.number().nullable(),
  }),
});

export type StatsResponse = z.infer<typeof StatsResponseSchema>;
```

- [ ] **Step 3.4: Exportar novos schemas no index**

Modificar `packages/shared/src/schemas/index.ts` adicionando:

```ts
export * from './stats.js';
export {
  UpdateOrderStatusByStaffSchema,
  BulkUpdateStatusSchema,
  CancelOrderSchema,
} from './order.js';
export { UpdateCantinaItemSchema } from './item.js';
```

(Confirmar que `OrderStatusSchema`, etc. já estão exportados via wildcard ou explícito; ajustar conforme padrão atual do arquivo.)

- [ ] **Step 3.5: Rodar typecheck**

```bash
pnpm -r typecheck
```

Expected: PASS. Existing routes que importam `OrderStatusSchema` ainda funcionam (literal `'cancelado'` continua válido).

- [ ] **Step 3.6: Commit**

```bash
git add packages/shared/src/schemas/
git commit -m "$(cat <<'EOF'
feat(shared): atualiza OrderStatus pra 3 valores + adiciona schemas Fase C

- OrderStatusSchema enum: pedido | pronto | cancelado
- OrderSchema ganha canceledBy + cancelReason
- UpdateOrderStatusByStaffSchema, BulkUpdateStatusSchema, CancelOrderSchema
- UpdateCantinaItemSchema (visivel/disponivel/estoque/preco partial)
- StatsResponseSchema, StatsPeriodSchema

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 4: Refactor POST /orders pra status='pedido' + atualizar testes existentes

**Files:**
- Modify: `apps/api/src/routes/orders.ts`
- Modify: `apps/api/src/routes/orders.test.ts`

- [ ] **Step 4.1: Trocar status inicial em POST /orders**

Em `apps/api/src/routes/orders.ts`:

- Linha ~151: trocar `eq(orders.status, 'pendente')` por `eq(orders.status, 'pedido')` (estimativa de pendentes na fila)
- Linha ~164: trocar `status: 'pendente'` por `status: 'pedido'`
- Linha ~190: trocar `if (order.status !== 'pendente')` por `if (order.status !== 'pedido')` no PATCH legado de cancel customer

- [ ] **Step 4.2: Atualizar `toPublicOrder` pra incluir canceledBy/cancelReason**

Modificar função `toPublicOrder` em `apps/api/src/routes/orders.ts` linhas ~25-40:

```ts
function toPublicOrder(o: typeof orders.$inferSelect, itens: typeof orderItems.$inferSelect[]): OrderDto {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status as OrderDto['status'],
    total: o.total,
    senha: o.senha,
    prontoEmEstimado: o.prontoEmEstimado?.toISOString() ?? null,
    prontoEm: o.prontoEm?.toISOString() ?? null,
    retiradoEm: o.retiradoEm?.toISOString() ?? null,
    canceladoEm: o.canceladoEm?.toISOString() ?? null,
    canceledBy: (o.canceledBy as 'customer' | 'staff' | null) ?? null,
    cancelReason: o.cancelReason ?? null,
    criadoEm: o.criadoEm.toISOString(),
    itens: itens.map(toPublicOrderItem),
  };
}
```

- [ ] **Step 4.3: Atualizar tests existentes pra usar 'pedido'**

Em `apps/api/src/routes/orders.test.ts`: substituir todas asserções `expect(...status).toBe('pendente')` por `'pedido'`. Procurar/substituir `'pendente'` → `'pedido'` em todo o arquivo de tests.

```bash
grep -n "pendente\|preparando\|retirado" apps/api/src/routes/orders.test.ts
# Avaliar caso a caso e substituir
```

- [ ] **Step 4.4: Rodar tests existentes pra confirmar passam após refactor**

```bash
pnpm --filter @cantina/api test orders
```

Expected: tests existentes passam (ainda sem novos endpoints).

- [ ] **Step 4.5: Commit**

```bash
git add apps/api/src/routes/orders.ts apps/api/src/routes/orders.test.ts
git commit -m "$(cat <<'EOF'
refactor(api/orders): troca status inicial pendente→pedido + DTO ganha canceledBy/cancelReason

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 5: PATCH /orders/:id/status (staff)

**Files:**
- Modify: `apps/api/src/routes/orders.ts`
- Modify: `apps/api/src/routes/orders.test.ts`

- [ ] **Step 5.1: Escrever tests novos**

Adicionar em `apps/api/src/routes/orders.test.ts` um describe novo:

```ts
describe('PATCH /orders/:id/status (staff)', () => {
  it('staff marca pedido → pronto', async () => {
    const { orderId } = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const res = await app.request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.status).toBe('pronto');
    expect(body.order.prontoEm).toBeTruthy();
  });

  it('staff cancela pedido → estoque devolvido', async () => {
    // Setup: criar order com 1 item × 3 unidades; estoque inicial 100
    const { itemId } = await createTestCantinaItems(testDb, cantinaId, [{ slug: 'x', name: 'X', preco: '5', estoque: 100 }]);
    const { orderId } = await createTestOrder(testDb, {
      userId: customer.id, cantinaId, status: 'pedido',
      items: [{ itemId, quantidade: 3, precoSnapshot: '5.00', nameSnapshot: 'X' }],
    });
    // Decrementar estoque manualmente pra simular POST /orders
    await testDb.update(cantinaItems).set({ estoque: 97 })
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));

    const res = await app.request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ status: 'cancelado', reason: 'cliente desistiu' }),
    });
    expect(res.status).toBe(200);
    const [ci] = await testDb.select().from(cantinaItems)
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));
    expect(ci.estoque).toBe(100);
  });

  it('staff faz rollback pronto → pedido', async () => {
    const { orderId } = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pronto' });
    const res = await app.request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ status: 'pedido' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.status).toBe('pedido');
    expect(body.order.prontoEm).toBeNull();
  });

  it('rejeita customer (403)', async () => {
    const { orderId } = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const res = await app.request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(403);
  });

  it('rejeita transição inválida cancelado → pronto (409)', async () => {
    const { orderId } = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'cancelado' });
    const res = await app.request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(409);
  });

  it('staff de cantina B não pode mudar pedido de cantina A (403)', async () => {
    const tenantsB = await createTestTenants(testDb, { unidadeId: 'u2', escolaId: 'e2', cantinaId: 'cB' });
    const otherStaff = await createTestUser(testDb, { role: 'staff', cantinaId: 'cB', name: 'S2' });
    const { orderId } = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const res = await app.request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherStaff.token}`, 'Content-Type': 'application/json', 'X-Cantina-Id': 'cB' },
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(403);
  });
});
```

(Helper `createTestUser` precisa aceitar `role: 'staff'`. Se não aceitar, adicionar em fixtures.)

- [ ] **Step 5.2: Rodar tests pra confirmar que falham**

```bash
pnpm --filter @cantina/api test "PATCH /orders/:id/status (staff)"
```

Expected: FAIL — endpoint ainda é o antigo customer-only.

- [ ] **Step 5.3: Substituir handler PATCH /orders/:id/status pelo staff handler**

Em `apps/api/src/routes/orders.ts`, substituir o handler atual (linhas ~178-198) por:

```ts
import { requireRole } from '../middleware/require-role.js';
import { UpdateOrderStatusByStaffSchema } from '@cantina/shared';

// ... dentro de createOrdersRoutes:

app.patch('/:id/status', requireRole('staff'), validateJson(UpdateOrderStatusByStaffSchema), async (c) => {
  const claim = c.get('user');
  const cantina = c.var.cantina;
  const id = c.req.param('id');
  const { status: newStatus, reason } = c.req.valid('json');

  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw notFound('Order not found');
    if (order.cantinaId !== cantina.id) throw forbidden('Pedido pertence a outra cantina');

    const allowedTransitions: Record<string, string[]> = {
      pedido: ['pronto', 'cancelado'],
      pronto: ['pedido'],
      cancelado: [],
    };
    if (!allowedTransitions[order.status]?.includes(newStatus)) {
      throw conflict(`Transição inválida: ${order.status} → ${newStatus}`);
    }

    if (newStatus === 'cancelado') {
      // Devolver estoque atomicamente
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const oi of items) {
        await tx.update(cantinaItems)
          .set({ estoque: sql`${cantinaItems.estoque} + ${oi.quantidade}` })
          .where(and(
            eq(cantinaItems.cantinaId, order.cantinaId),
            eq(cantinaItems.itemId, oi.itemId),
          ));
      }
      await tx.update(orders).set({
        status: 'cancelado',
        canceladoEm: new Date(),
        canceledBy: 'staff',
        cancelReason: reason ?? null,
      }).where(eq(orders.id, id));
    } else if (newStatus === 'pronto') {
      await tx.update(orders).set({ status: 'pronto', prontoEm: new Date() }).where(eq(orders.id, id));
    } else if (newStatus === 'pedido') {
      // Rollback de pronto
      await tx.update(orders).set({ status: 'pedido', prontoEm: null }).where(eq(orders.id, id));
    }
  });

  const enriched = await fetchOrderWithItems(db, id);
  return c.json({ order: enriched }, 200);
});
```

Nota: handler usa `tenantContext` via middleware (`app.use('*', tenantContext(db))` no topo de `createOrdersRoutes`), que já valida `staff.cantinaId === header X-Cantina-Id`.

- [ ] **Step 5.4: Rodar tests**

```bash
pnpm --filter @cantina/api test "PATCH /orders/:id/status (staff)"
```

Expected: PASS (6 tests).

- [ ] **Step 5.5: Verificar que customer cancel via PATCH ainda funciona (compat)**

Notar: o handler mudou pra `requireRole('staff')`, então o teste antigo de customer cancelar pedido vai começar a falhar (403). Vai resolver na Task 7 (POST /orders/:id/cancel).

Por enquanto: marcar testes legados de "customer cancela via PATCH" como `it.todo` ou skip:

```ts
describe.skip('PATCH /orders/:id/status — customer (legacy, removido)', () => { ... });
```

- [ ] **Step 5.6: Commit**

```bash
git add apps/api/src/routes/orders.ts apps/api/src/routes/orders.test.ts
git commit -m "$(cat <<'EOF'
feat(api/orders): PATCH /orders/:id/status agora é staff-only com transições + devolução de estoque

- Aplicação de requireRole('staff')
- Transições válidas: pedido→pronto, pedido→cancelado, pronto→pedido (rollback)
- Cancelamento devolve estoque atomicamente em transação
- canceledBy='staff', cancelReason opcional
- Tests cobrem todas transições + bloqueio cross-tenant + 403 customer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

(Continua na próxima parte: tasks 6-9 — bulk-status, customer cancel, cantina-items PATCH, stats. Depois Phase 2 (mobile shell), Phase 3 (primitives), Phase 4 (screens), Phase 5 (cleanup customer), Phase 6 (docs + validation manual).)
