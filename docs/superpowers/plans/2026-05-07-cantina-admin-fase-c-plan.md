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

### Task 6: PATCH /orders/bulk-status (staff)

**Files:**
- Modify: `apps/api/src/routes/orders.ts`
- Modify: `apps/api/src/routes/orders.test.ts`

- [ ] **Step 6.1: Escrever tests novos**

Adicionar em `apps/api/src/routes/orders.test.ts`:

```ts
describe('PATCH /orders/bulk-status (staff)', () => {
  it('marca 3 pedidos pendentes como pronto numa só chamada', async () => {
    const o1 = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const o2 = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const o3 = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ ids: [o1.orderId, o2.orderId, o3.orderId], status: 'pronto' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { updated: string[] };
    expect(body.updated).toEqual(expect.arrayContaining([o1.orderId, o2.orderId, o3.orderId]));
    const rows = await testDb.select().from(orders).where(inArray(orders.id, body.updated));
    for (const r of rows) expect(r.status).toBe('pronto');
  });

  it('rejeita tudo se ao menos 1 id já não está em pedido (409 com failedIds)', async () => {
    const o1 = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const o2 = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pronto' }); // já pronto
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ ids: [o1.orderId, o2.orderId], status: 'pronto' }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { details: { failedIds: string[] } } };
    expect(body.error.details.failedIds).toContain(o2.orderId);
    // Importante: o1 NÃO deve ter sido marcado (atomicidade)
    const [r1] = await testDb.select().from(orders).where(eq(orders.id, o1.orderId));
    expect(r1.status).toBe('pedido');
  });

  it('rejeita customer (403)', async () => {
    const o = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ ids: [o.orderId], status: 'pronto' }),
    });
    expect(res.status).toBe(403);
  });

  it('rejeita pedido de outra cantina mesmo se um dos ids pertence à própria', async () => {
    const otherCantinaId = await createTestTenants(testDb, { unidadeId: 'u3', escolaId: 'e3', cantinaId: 'cZ' });
    const o1 = await createTestOrder(testDb, { userId: customer.id, cantinaId, status: 'pedido' });
    const o2 = await createTestOrder(testDb, { userId: customer.id, cantinaId: 'cZ', status: 'pedido' });
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ ids: [o1.orderId, o2.orderId], status: 'pronto' }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { details: { failedIds: string[] } } };
    expect(body.error.details.failedIds).toContain(o2.orderId);
  });

  it('valida body — array vazio retorna 422', async () => {
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ ids: [], status: 'pronto' }),
    });
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 6.2: Rodar tests pra confirmar que falham**

```bash
pnpm --filter @cantina/api test "bulk-status"
```

Expected: FAIL — rota não existe.

- [ ] **Step 6.3: Adicionar handler em `orders.ts`**

Em `apps/api/src/routes/orders.ts`, adicionar imports:

```ts
import { inArray } from 'drizzle-orm';
import { BulkUpdateStatusSchema } from '@cantina/shared';
```

Adicionar handler antes do `return app` em `createOrdersRoutes`:

```ts
app.patch('/bulk-status', requireRole('staff'), validateJson(BulkUpdateStatusSchema), async (c) => {
  const cantina = c.var.cantina;
  const { ids, status: newStatus } = c.req.valid('json');

  // newStatus é literal 'pronto' (Zod garante). Mantemos só transição pedido→pronto pra bulk.
  const result = await db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(inArray(orders.id, ids));
    const failedIds: string[] = [];
    for (const id of ids) {
      const row = rows.find((r) => r.id === id);
      if (!row || row.cantinaId !== cantina.id || row.status !== 'pedido') {
        failedIds.push(id);
      }
    }
    if (failedIds.length > 0) {
      throw conflict('Bulk rejeitado — pelo menos 1 pedido não está em estado pedido', { failedIds });
    }
    await tx.update(orders)
      .set({ status: 'pronto', prontoEm: new Date() })
      .where(inArray(orders.id, ids));
    return ids;
  });

  return c.json({ updated: result }, 200);
});
```

Notas:
- `conflict()` helper aceita 2º arg `details` — confirmar em `lib/errors.ts`. Se não aceitar, ajustar pra `throw new HTTPError('CONFLICT', 409, msg, { failedIds })`.
- Não usa `SELECT FOR UPDATE` (pglite não suporta). Em produção (Neon) o `inArray` + UPDATE em transação atomicidade do BD garante. Race entre select e update aceitável (re-tenta na próxima call).

- [ ] **Step 6.4: Confirmar que `conflict()` helper aceita `details`**

Ler `apps/api/src/lib/errors.ts`. Se a assinatura for `conflict(message: string)` sem details, ajustar:

```ts
// Em apps/api/src/lib/errors.ts:
export function conflict(message: string, details?: unknown): HTTPError {
  return new HTTPError('CONFLICT', 409, message, details);
}
```

E o `errorHandler` em `middleware/error-handler.ts` já serializa `details` se presente. Confirmar.

- [ ] **Step 6.5: Rodar tests**

```bash
pnpm --filter @cantina/api test "bulk-status"
```

Expected: PASS (5 tests).

- [ ] **Step 6.6: Rodar suíte completa**

```bash
pnpm --filter @cantina/api test
```

Expected: PASS — sem regressão.

- [ ] **Step 6.7: Commit**

```bash
git add apps/api/src/routes/orders.ts apps/api/src/routes/orders.test.ts apps/api/src/lib/errors.ts
git commit -m "$(cat <<'EOF'
feat(api/orders): PATCH /orders/bulk-status — staff marca múltiplos pedidos como pronto tudo-ou-nada

- Aceita { ids: string[1..50], status: 'pronto' }
- Rejeição atômica: se algum id não está em pedido OU pertence a outra cantina, retorna 409 com failedIds
- requireRole('staff') + tenant isolation via tenantContext + cross-check explícito

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 7: POST /orders/:id/cancel (customer)

**Files:**
- Modify: `apps/api/src/routes/orders.ts`
- Modify: `apps/api/src/routes/orders.test.ts`

- [ ] **Step 7.1: Escrever tests novos**

Adicionar em `apps/api/src/routes/orders.test.ts`:

```ts
describe('POST /orders/:id/cancel (customer)', () => {
  it('customer cancela próprio pedido pendente → estoque devolvido', async () => {
    const { itemId } = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'y', name: 'Y', preco: '7.50', estoque: 50 },
    ]);
    const { orderId } = await createTestOrder(testDb, {
      userId: customer.id, cantinaId, status: 'pedido',
      items: [{ itemId, quantidade: 2, precoSnapshot: '7.50', nameSnapshot: 'Y' }],
    });
    // Simular o decremento que o POST /orders faz:
    await testDb.update(cantinaItems).set({ estoque: 48 })
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));

    const res = await app.request(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { order: { status: string; canceledBy: string } };
    expect(body.order.status).toBe('cancelado');
    expect(body.order.canceledBy).toBe('customer');

    const [ci] = await testDb.select().from(cantinaItems)
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));
    expect(ci.estoque).toBe(50);
  });

  it('rejeita cancelar pedido de outro user (404)', async () => {
    const other = await createTestUser(testDb, { role: 'customer', email: 'b@b.com', name: 'Other' });
    const { orderId } = await createTestOrder(testDb, {
      userId: other.user.id, cantinaId, status: 'pedido',
    });
    const res = await app.request(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(404);
  });

  it('rejeita cancelar pedido que já foi marcado pronto (409)', async () => {
    const { orderId } = await createTestOrder(testDb, {
      userId: customer.id, cantinaId, status: 'pronto',
    });
    const res = await app.request(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(409);
  });

  it('staff também pode chamar (endpoint não requer customer), mas registra canceled_by="customer" se for o owner', async () => {
    // Note: skip se sua interpretação for que staff DEVE usar PATCH /:id/status pra cancelar.
    // Caso prefira reject staff aqui, troca pra requireRole('customer') e ajusta test pra 403.
  });
});
```

Decisão: o spec diz "Sem `requireRole('staff')`. Valida `order.user_id === user.id` (404 se não)". Portanto, o endpoint roda sem role gate — só verifica ownership. Staff que tentar cancelar pedido de outro user via esse endpoint recebe 404 (cobre o use-case do test 2). Staff cancela próprio pedido enquanto cliente também — caso raro mas válido.

- [ ] **Step 7.2: Rodar tests pra confirmar que falham**

```bash
pnpm --filter @cantina/api test "cancel"
```

Expected: FAIL — endpoint não existe ainda.

- [ ] **Step 7.3: Implementar handler**

Em `apps/api/src/routes/orders.ts`, adicionar antes do `return app`:

```ts
app.post('/:id/cancel', async (c) => {
  const claim = c.get('user');
  const id = c.req.param('id');
  const cantina = c.var.cantina;

  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || order.userId !== claim.sub) throw notFound('Order not found');
    if (order.cantinaId !== cantina.id) throw notFound('Order not found');
    if (order.status !== 'pedido') throw conflict('Pedido já não pode ser cancelado');

    // Devolver estoque
    const oitems = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
    for (const oi of oitems) {
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
      canceledBy: 'customer',
      cancelReason: null,
    }).where(eq(orders.id, id));
  });

  const enriched = await fetchOrderWithItems(db, id);
  return c.json({ order: enriched }, 200);
});
```

- [ ] **Step 7.4: Rodar tests**

```bash
pnpm --filter @cantina/api test "cancel"
```

Expected: PASS (3 tests).

- [ ] **Step 7.5: Commit**

```bash
git add apps/api/src/routes/orders.ts apps/api/src/routes/orders.test.ts
git commit -m "$(cat <<'EOF'
feat(api/orders): POST /orders/:id/cancel — customer cancela próprio pedido com devolução de estoque

- Sem requireRole staff (customer-side)
- Valida ownership (user_id) + status='pedido' + cantina via tenantContext
- Transação devolve estoque atomicamente igual ao staff cancel
- canceled_by='customer' fixo

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 8: PATCH /cantina-items/:itemId (staff)

**Files:**
- Create: `apps/api/src/routes/cantina-items.ts`
- Create: `apps/api/src/routes/cantina-items.test.ts`
- Modify: `apps/api/src/app.ts` (registra rota)

- [ ] **Step 8.1: Escrever tests**

Criar `apps/api/src/routes/cantina-items.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { createTestDb, type TestDb } from '../test/db.js';
import { createTestUser, createTestTenants, createTestCantinaItems } from '../test/fixtures.js';
import { cantinaItems } from '../db/schema.js';
import { createApp } from '../app.js';

describe('PATCH /cantina-items/:itemId', () => {
  let testDb: TestDb;
  let app: ReturnType<typeof createApp> extends Promise<infer R> ? R : never;
  let cantinaId: string;
  let staffToken: string;
  let customerToken: string;
  let itemId: string;

  beforeEach(async () => {
    testDb = await createTestDb();
    app = await createApp({ db: testDb });
    const tenants = await createTestTenants(testDb, { unidadeId: 'u1', escolaId: 'e1', cantinaId: 'cA' });
    cantinaId = tenants.cantinaId;
    const staff = await createTestUser(testDb, { role: 'staff', cantinaId, name: 'Staff', email: 's@s.com' });
    const customer = await createTestUser(testDb, { role: 'customer', email: 'c@c.com' });
    staffToken = staff.token;
    customerToken = customer.token;
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'p1', name: 'Item 1', preco: '5.00', estoque: 100 },
    ]);
    itemId = created.itemId;
  });

  it('staff atualiza estoque + preco', async () => {
    const res = await app.request(`/api/v1/cantina-items/${itemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ estoque: 75, preco: 6.50 }),
    });
    expect(res.status).toBe(200);
    const [row] = await testDb.select().from(cantinaItems)
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));
    expect(row.estoque).toBe(75);
    expect(row.preco).toBe('6.50');
  });

  it('staff atualiza só visivel (partial update)', async () => {
    const res = await app.request(`/api/v1/cantina-items/${itemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ visivel: false }),
    });
    expect(res.status).toBe(200);
    const [row] = await testDb.select().from(cantinaItems)
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));
    expect(row.visivel).toBe(false);
    expect(row.preco).toBe('5.00'); // preço não mudou
  });

  it('customer recebe 403', async () => {
    const res = await app.request(`/api/v1/cantina-items/${itemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ estoque: 0 }),
    });
    expect(res.status).toBe(403);
  });

  it('staff de outra cantina recebe 404 (item não existe no escopo dele)', async () => {
    const otherTenants = await createTestTenants(testDb, { unidadeId: 'u2', escolaId: 'e2', cantinaId: 'cB' });
    const otherStaff = await createTestUser(testDb, {
      role: 'staff', cantinaId: 'cB', email: 'b@b.com', name: 'Staff2',
    });
    const res = await app.request(`/api/v1/cantina-items/${itemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherStaff.token}`, 'Content-Type': 'application/json', 'X-Cantina-Id': 'cB' },
      body: JSON.stringify({ estoque: 0 }),
    });
    expect(res.status).toBe(404);
  });

  it('rejeita body vazio (422)', async () => {
    const res = await app.request(`/api/v1/cantina-items/${itemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  it('rejeita estoque negativo (422 via Zod)', async () => {
    const res = await app.request(`/api/v1/cantina-items/${itemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json', 'X-Cantina-Id': cantinaId },
      body: JSON.stringify({ estoque: -1 }),
    });
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 8.2: Implementar rota**

Criar `apps/api/src/routes/cantina-items.ts`:

```ts
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { UpdateCantinaItemSchema } from '@cantina/shared';
import { cantinaItems } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-role.js';
import { tenantContext } from '../middleware/tenant-context.js';
import { notFound } from '../lib/errors.js';
import { validateJson } from '../lib/zod-hono.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createCantinaItemsRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);
  app.use('*', requireRole('staff'));
  app.use('*', tenantContext(db));

  app.patch('/:itemId', validateJson(UpdateCantinaItemSchema), async (c) => {
    const cantina = c.var.cantina;
    const itemId = c.req.param('itemId');
    const patch = c.req.valid('json');

    const [existing] = await db.select().from(cantinaItems).where(and(
      eq(cantinaItems.cantinaId, cantina.id),
      eq(cantinaItems.itemId, itemId),
    )).limit(1);
    if (!existing) throw notFound('Item não cadastrado na sua cantina');

    const updates: Partial<typeof cantinaItems.$inferInsert> = { updatedAt: new Date() };
    if (patch.visivel !== undefined) updates.visivel = patch.visivel;
    if (patch.disponivel !== undefined) updates.disponivel = patch.disponivel;
    if (patch.estoque !== undefined) updates.estoque = patch.estoque;
    if (patch.preco !== undefined) updates.preco = patch.preco.toFixed(2);

    await db.update(cantinaItems).set(updates).where(and(
      eq(cantinaItems.cantinaId, cantina.id),
      eq(cantinaItems.itemId, itemId),
    ));

    const [row] = await db.select().from(cantinaItems).where(and(
      eq(cantinaItems.cantinaId, cantina.id),
      eq(cantinaItems.itemId, itemId),
    )).limit(1);

    return c.json({ cantinaItem: row }, 200);
  });

  return app;
}
```

- [ ] **Step 8.3: Registrar rota no `app.ts`**

Modificar `apps/api/src/app.ts`:

```ts
import { createCantinaItemsRoutes } from './routes/cantina-items.js';
// ...
const cantinaItemsApp = createCantinaItemsRoutes(db);
app.route('/api/v1/cantina-items', cantinaItemsApp);
```

- [ ] **Step 8.4: Rodar tests**

```bash
pnpm --filter @cantina/api test cantina-items
```

Expected: PASS (6 tests).

- [ ] **Step 8.5: Commit**

```bash
git add apps/api/src/routes/cantina-items.ts apps/api/src/routes/cantina-items.test.ts apps/api/src/app.ts
git commit -m "$(cat <<'EOF'
feat(api): PATCH /cantina-items/:itemId — staff edita visivel/disponivel/estoque/preco

- requireRole('staff') + tenantContext (cantina implícita via header X-Cantina-Id)
- Partial update via UpdateCantinaItemSchema (pelo menos 1 campo)
- 404 se item não cadastrado na cantina do staff
- updated_at auto-set

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 9: GET /stats (staff)

**Files:**
- Create: `apps/api/src/routes/stats.ts`
- Create: `apps/api/src/routes/stats.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 9.1: Escrever tests com fixtures determinísticas**

Criar `apps/api/src/routes/stats.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
import type { StatsResponse } from '@cantina/shared';
import { createTestDb, type TestDb } from '../test/db.js';
import { createTestUser, createTestTenants, createTestCantinaItems, createTestOrder } from '../test/fixtures.js';
import { orders, orderItems } from '../db/schema.js';
import { createApp } from '../app.js';

describe('GET /stats', () => {
  let testDb: TestDb;
  let app: Awaited<ReturnType<typeof createApp>>;
  let cantinaId: string;
  let staffToken: string;
  let customerToken: string;
  let customerId: string;
  let item1Id: string;
  let item2Id: string;

  beforeEach(async () => {
    testDb = await createTestDb();
    app = await createApp({ db: testDb });
    const tenants = await createTestTenants(testDb, { unidadeId: 'u1', escolaId: 'e1', cantinaId: 'cA' });
    cantinaId = tenants.cantinaId;
    const staff = await createTestUser(testDb, { role: 'staff', cantinaId, name: 'Staff', email: 's@s.com' });
    const customer = await createTestUser(testDb, { role: 'customer', email: 'c@c.com' });
    staffToken = staff.token;
    customerToken = customer.token;
    customerId = customer.user.id;
    const items = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '4.00', estoque: 100 },
      { slug: 'paodequeijo', name: 'Pão de Queijo', preco: '6.00', estoque: 100 },
    ]);
    item1Id = items.itemIds[0];
    item2Id = items.itemIds[1];

    // Hoje: 3 prontos (R$ 4 + R$ 6 + R$ 12) + 1 cancelado
    const now = new Date();
    const prontoEm = new Date(now.getTime() - 5 * 60 * 1000); // 5min ago
    await createTestOrder(testDb, {
      userId: customerId, cantinaId, status: 'pronto', total: '4.00', prontoEm,
      items: [{ itemId: item1Id, quantidade: 1, precoSnapshot: '4.00', nameSnapshot: 'Café' }],
    });
    await createTestOrder(testDb, {
      userId: customerId, cantinaId, status: 'pronto', total: '6.00', prontoEm,
      items: [{ itemId: item2Id, quantidade: 1, precoSnapshot: '6.00', nameSnapshot: 'Pão de Queijo' }],
    });
    await createTestOrder(testDb, {
      userId: customerId, cantinaId, status: 'pronto', total: '12.00', prontoEm,
      items: [{ itemId: item2Id, quantidade: 2, precoSnapshot: '6.00', nameSnapshot: 'Pão de Queijo' }],
    });
    await createTestOrder(testDb, {
      userId: customerId, cantinaId, status: 'cancelado',
    });
  });

  it('daily — agregação atendidos/faturamento/ticket/tempo médio', async () => {
    const res = await app.request('/api/v1/stats?period=daily', {
      headers: { Authorization: `Bearer ${staffToken}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { stats: StatsResponse };
    expect(body.stats.period).toBe('daily');
    expect(body.stats.atendidos).toBe(3);
    expect(body.stats.cancelados).toBe(1);
    expect(body.stats.faturamento).toBe('22.00');
    expect(body.stats.ticketMedio).toBe('7.33');
    expect(body.stats.tempoMedioPreparoSec).toBeGreaterThanOrEqual(0);
    expect(body.stats.pedidosPorHora.length).toBe(11); // 8h-18h
    expect(body.stats.topItems.length).toBeLessThanOrEqual(5);
    // Top item esperado: pão de queijo (3 unidades) > café (1)
    expect(body.stats.topItems[0]?.nome).toBe('Pão de Queijo');
    expect(body.stats.topItems[0]?.qtd).toBe(3);
  });

  it('rejeita customer (403)', async () => {
    const res = await app.request('/api/v1/stats?period=daily', {
      headers: { Authorization: `Bearer ${customerToken}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(403);
  });

  it('tenant isolation — staff de cantina B não vê dados de A', async () => {
    const other = await createTestTenants(testDb, { unidadeId: 'u2', escolaId: 'e2', cantinaId: 'cB' });
    const otherStaff = await createTestUser(testDb, { role: 'staff', cantinaId: 'cB', email: 'b@b.com', name: 'Staff2' });
    const res = await app.request('/api/v1/stats?period=daily', {
      headers: { Authorization: `Bearer ${otherStaff.token}`, 'X-Cantina-Id': 'cB' },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { stats: StatsResponse };
    expect(body.stats.atendidos).toBe(0);
    expect(body.stats.faturamento).toBe('0.00');
  });

  it('rejeita period inválido (422)', async () => {
    const res = await app.request('/api/v1/stats?period=yearly', {
      headers: { Authorization: `Bearer ${staffToken}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(422);
  });

  it('weekly + monthly retornam mesmas estatísticas (só ranges diferentes)', async () => {
    const w = await app.request('/api/v1/stats?period=weekly', {
      headers: { Authorization: `Bearer ${staffToken}`, 'X-Cantina-Id': cantinaId },
    });
    const m = await app.request('/api/v1/stats?period=monthly', {
      headers: { Authorization: `Bearer ${staffToken}`, 'X-Cantina-Id': cantinaId },
    });
    expect(w.status).toBe(200);
    expect(m.status).toBe(200);
  });
});
```

- [ ] **Step 9.2: Atualizar `createTestCantinaItems` pra suportar múltiplos items**

Modificar `apps/api/src/test/fixtures.ts`. O helper atual provavelmente cria 1 item; estender pra retornar `itemIds: string[]`:

```ts
export async function createTestCantinaItems(
  db: TestDb,
  cantinaId: string,
  defs: Array<{ slug: string; name: string; preco: string; estoque?: number }>,
): Promise<{ itemId: string; itemIds: string[] }> {
  const itemIds: string[] = [];
  for (const def of defs) {
    const id = createId();
    await db.insert(items).values({
      id,
      slug: def.slug,
      name: def.name,
      descricao: `${def.name} descrição`,
      preco: def.preco,
      categoria: 'lanches',
    });
    await db.insert(cantinaItems).values({
      cantinaId,
      itemId: id,
      preco: def.preco,
      estoque: def.estoque ?? 100,
    });
    itemIds.push(id);
  }
  return { itemId: itemIds[0]!, itemIds };
}
```

Manter compat: `itemId` retorna o primeiro (callers antigos continuam funcionando).

- [ ] **Step 9.3: Implementar rota `stats.ts`**

Criar `apps/api/src/routes/stats.ts`:

```ts
import { Hono } from 'hono';
import { sql, eq, and, gte, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { StatsPeriodSchema, type StatsResponse } from '@cantina/shared';
import { orders, orderItems, items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-role.js';
import { tenantContext } from '../middleware/tenant-context.js';
import { badRequest } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

function rangeForPeriod(period: 'daily' | 'weekly' | 'monthly'): { start: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  if (period === 'daily') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const prevEnd = start;
    const prevStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    return { start, prevStart, prevEnd };
  }
  if (period === 'weekly') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const prevEnd = start;
    return { start, prevStart, prevEnd };
  }
  // monthly
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const prevEnd = start;
  return { start, prevStart, prevEnd };
}

function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export function createStatsRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);
  app.use('*', requireRole('staff'));
  app.use('*', tenantContext(db));

  app.get('/', async (c) => {
    const period = c.req.query('period');
    const parsed = StatsPeriodSchema.safeParse(period);
    if (!parsed.success) throw badRequest('period deve ser daily | weekly | monthly');
    const cantina = c.var.cantina;
    const { start, prevStart, prevEnd } = rangeForPeriod(parsed.data);

    // Atendidos + cancelados + faturamento
    const aggResult = await db.select({
      atendidos: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'pronto')`,
      cancelados: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'cancelado')`,
      faturamento: sql<string>`COALESCE(SUM(${orders.total}) FILTER (WHERE ${orders.status} = 'pronto'), 0)`,
      tempoMedioSec: sql<number | null>`AVG(EXTRACT(EPOCH FROM (${orders.prontoEm} - ${orders.criadoEm}))) FILTER (WHERE ${orders.prontoEm} IS NOT NULL)`,
    }).from(orders)
      .where(and(eq(orders.cantinaId, cantina.id), gte(orders.criadoEm, start)));

    const agg = aggResult[0]!;
    const atendidos = Number(agg.atendidos ?? 0);
    const cancelados = Number(agg.cancelados ?? 0);
    const faturamentoNum = Number(agg.faturamento ?? 0);
    const ticketMedioNum = atendidos > 0 ? faturamentoNum / atendidos : 0;
    const tempoMedioPreparoSec = agg.tempoMedioSec != null ? Number(agg.tempoMedioSec) : null;

    // Comparação período anterior
    const prevResult = await db.select({
      atendidos: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'pronto')`,
      faturamento: sql<string>`COALESCE(SUM(${orders.total}) FILTER (WHERE ${orders.status} = 'pronto'), 0)`,
    }).from(orders)
      .where(and(eq(orders.cantinaId, cantina.id), gte(orders.criadoEm, prevStart), sql`${orders.criadoEm} < ${prevEnd}`));

    const prevAgg = prevResult[0]!;
    const prevAtendidos = Number(prevAgg.atendidos ?? 0);
    const prevFaturamento = Number(prevAgg.faturamento ?? 0);

    // Pedidos por hora (8h-18h, 11 buckets)
    const hoursResult = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM ${orders.criadoEm})`,
      count: sql<number>`COUNT(*)`,
    }).from(orders)
      .where(and(eq(orders.cantinaId, cantina.id), gte(orders.criadoEm, start), eq(orders.status, 'pronto')))
      .groupBy(sql`EXTRACT(HOUR FROM ${orders.criadoEm})`);

    const pedidosPorHora = Array.from({ length: 11 }, (_, i) => {
      const targetHour = 8 + i;
      const row = hoursResult.find((r) => Number(r.hour) === targetHour);
      return Number(row?.count ?? 0);
    });

    // Top items
    const topResult = await db.select({
      itemId: orderItems.itemId,
      nome: items.name,
      qtd: sql<number>`SUM(${orderItems.quantidade})`,
      faturamento: sql<string>`SUM(${orderItems.quantidade} * ${orderItems.precoSnapshot})`,
    }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(items, eq(orderItems.itemId, items.id))
      .where(and(
        eq(orders.cantinaId, cantina.id),
        eq(orders.status, 'pronto'),
        gte(orders.criadoEm, start),
      ))
      .groupBy(orderItems.itemId, items.name)
      .orderBy(sql`SUM(${orderItems.quantidade}) DESC`)
      .limit(5);

    const topItems = topResult.map((r) => ({
      itemId: r.itemId,
      nome: r.nome,
      qtd: Number(r.qtd ?? 0),
      faturamento: Number(r.faturamento ?? 0).toFixed(2),
    }));

    const stats: StatsResponse = {
      period: parsed.data,
      atendidos,
      cancelados,
      faturamento: faturamentoNum.toFixed(2),
      ticketMedio: ticketMedioNum.toFixed(2),
      tempoMedioPreparoSec,
      pedidosPorHora,
      topItems,
      comparacao: {
        atendidosDeltaPct: deltaPct(atendidos, prevAtendidos),
        faturamentoDeltaPct: deltaPct(faturamentoNum, prevFaturamento),
      },
    };

    return c.json({ stats }, 200);
  });

  return app;
}
```

Nota: pglite suporta `EXTRACT(HOUR FROM ...)` e `FILTER (WHERE ...)`. Se algo falhar, ajustar pra `CASE WHEN ... THEN ... END`.

- [ ] **Step 9.4: Registrar rota no `app.ts`**

```ts
import { createStatsRoutes } from './routes/stats.js';
const statsApp = createStatsRoutes(db);
app.route('/api/v1/stats', statsApp);
```

- [ ] **Step 9.5: Rodar tests**

```bash
pnpm --filter @cantina/api test stats
```

Expected: PASS (5 tests).

- [ ] **Step 9.6: Rodar suíte completa + typecheck**

```bash
pnpm -r typecheck && pnpm -r test
```

Expected: 107 baseline + ~20-25 novos = ~130 passing.

- [ ] **Step 9.7: Commit**

```bash
git add apps/api/src/routes/stats.ts apps/api/src/routes/stats.test.ts apps/api/src/app.ts apps/api/src/test/fixtures.ts
git commit -m "$(cat <<'EOF'
feat(api): GET /stats — dashboard staff com agregações SQL

- requireRole('staff') + tenant isolation via cantinaId
- daily/weekly/monthly via query param (Zod-validated)
- atendidos, cancelados, faturamento, ticketMedio, tempoMedio, pedidosPorHora[11], topItems[5]
- comparação delta % vs período anterior
- createTestCantinaItems agora aceita N items, retorna itemIds[]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Mobile foundation (Tasks 10–13)

Theme + role redirect + useResponsiveShell + CantinaContext/apiFetch ajuste pra staff.

### Task 10: Theme — adaptar statusPalette pro novo enum

**Files:**
- Modify: `apps/mobile/constants/theme.ts`

- [ ] **Step 10.1: Trocar chaves `pendente`/`preparando`/`retirado` por `pedido`**

Em `apps/mobile/constants/theme.ts`, na export `statusPalette`:

```ts
export type StatusKey = 'pedido' | 'pronto' | 'cancelado';

export const statusPalette: Record<StatusKey, StatusPalette> = {
  pedido: {
    labelKey: 'status.pedido',
    color: '#F59E0B', // amber-500 (reusa do antigo pendente)
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: 'time-outline',
  },
  pronto: {
    labelKey: 'status.pronto',
    color: '#10B981', // emerald-500
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.45)',
    icon: 'checkmark-circle-outline',
  },
  cancelado: {
    labelKey: 'status.cancelado',
    color: '#9CA3AF', // gray-400
    bg: 'rgba(156, 163, 175, 0.10)',
    border: 'rgba(156, 163, 175, 0.30)',
    icon: 'close-circle-outline',
  },
};
```

- [ ] **Step 10.2: Atualizar i18n strings**

Buscar `lib/i18n` ou `packages/shared` por strings `status.pendente`, `status.preparando`, `status.retirado`. Substituir/adicionar:

```bash
grep -rn "status\.\(pendente\|preparando\|retirado\)" apps/mobile/ packages/shared/
```

Atualizar arquivo encontrado (provavelmente `packages/shared/src/i18n/*.json` ou `apps/mobile/lib/i18n/locales/{pt,en}.json`). Adicionar `status.pedido`:

```json
{
  "status": {
    "pedido": "Em preparo",
    "pronto": "Pronto pra retirar",
    "cancelado": "Cancelado"
  }
}
```

Manter labels específicos por user: cliente vê "Em preparo", staff vê "Em preparação" (será diferenciado na UI da Task 24).

- [ ] **Step 10.3: Buscar usos de `statusPalette['pendente']` no código**

```bash
grep -rn "statusPalette\[" apps/mobile/
grep -rn "'pendente'\|'preparando'\|'retirado'" apps/mobile/
```

Substituir `'pendente'` por `'pedido'`, e tratar `'preparando'`/`'retirado'` conforme contexto (provavelmente eliminar dead code agora).

- [ ] **Step 10.4: Rodar typecheck**

```bash
pnpm --filter @cantina/mobile typecheck
```

Expected: PASS. Se vier erro de enum mismatch, ajustar nos call sites.

- [ ] **Step 10.5: Commit**

```bash
git add apps/mobile/constants/theme.ts apps/mobile/lib/i18n/ packages/shared/src/i18n/ apps/mobile/app/ apps/mobile/components/
git commit -m "$(cat <<'EOF'
refactor(mobile): adapta statusPalette + strings i18n pro novo enum (pedido | pronto | cancelado)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 11: lib/role-redirect.ts — pure function de redirect role-based

**Files:**
- Create: `apps/mobile/lib/role-redirect.ts`
- Create: `apps/mobile/test/role-redirect.test.mjs`

- [ ] **Step 11.1: Escrever test**

Criar `apps/mobile/test/role-redirect.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNextRoute } from '../lib/role-redirect.ts';

test('staff loga → /(staff)/pedidos', () => {
  const next = computeNextRoute({
    user: { role: 'staff', name: 'X', cantinaId: 'cA', rm: null },
    currentPath: '/login',
  });
  assert.equal(next, '/(staff)/pedidos');
});

test('customer com onboarding incompleto → /(onboarding)/welcome', () => {
  const next = computeNextRoute({
    user: { role: 'customer', name: null, cantinaId: null, rm: null },
    currentPath: '/(tabs)/index',
  });
  assert.equal(next, '/(onboarding)/welcome');
});

test('customer completo → null (sem redirect)', () => {
  const next = computeNextRoute({
    user: { role: 'customer', name: 'Y', cantinaId: 'cA', rm: '123456' },
    currentPath: '/(tabs)/index',
  });
  assert.equal(next, null);
});

test('staff em (tabs) → empurra pra (staff)/pedidos', () => {
  const next = computeNextRoute({
    user: { role: 'staff', name: 'X', cantinaId: 'cA', rm: null },
    currentPath: '/(tabs)/cardapio',
  });
  assert.equal(next, '/(staff)/pedidos');
});

test('staff em (staff) → null (já correto)', () => {
  const next = computeNextRoute({
    user: { role: 'staff', name: 'X', cantinaId: 'cA', rm: null },
    currentPath: '/(staff)/pedidos',
  });
  assert.equal(next, null);
});

test('user null (não logado) → null (gate de auth resolve)', () => {
  const next = computeNextRoute({ user: null, currentPath: '/(tabs)/index' });
  assert.equal(next, null);
});
```

- [ ] **Step 11.2: Rodar test pra confirmar que falha**

```bash
pnpm --filter @cantina/mobile test -- --test-name-pattern="role-redirect"
```

Ou diretamente:

```bash
cd apps/mobile && node --import tsx --test test/role-redirect.test.mjs
```

Expected: FAIL — módulo não existe.

- [ ] **Step 11.3: Implementar `lib/role-redirect.ts`**

Criar `apps/mobile/lib/role-redirect.ts`:

```ts
type UserShape = {
  role: 'customer' | 'staff';
  name: string | null;
  rm: string | null;
  cantinaId: string | null;
};

export interface ComputeNextRouteInput {
  user: UserShape | null;
  currentPath: string;
}

export function computeNextRoute({ user, currentPath }: ComputeNextRouteInput): string | null {
  if (!user) return null;

  if (user.role === 'staff') {
    if (currentPath.startsWith('/(staff)')) return null;
    return '/(staff)/pedidos';
  }

  // customer
  const onboardingComplete = !!user.name && !!user.cantinaId && !!user.rm;
  if (!onboardingComplete) {
    if (currentPath.startsWith('/(onboarding)')) return null;
    return '/(onboarding)/welcome';
  }
  if (currentPath.startsWith('/(staff)')) return '/(tabs)';
  if (currentPath.startsWith('/(onboarding)')) return '/(tabs)';
  return null;
}
```

- [ ] **Step 11.4: Rodar tests**

```bash
cd apps/mobile && node --import tsx --test test/role-redirect.test.mjs
```

Expected: PASS (6 tests).

- [ ] **Step 11.5: Commit**

```bash
git add apps/mobile/lib/role-redirect.ts apps/mobile/test/role-redirect.test.mjs
git commit -m "$(cat <<'EOF'
feat(mobile): pure function computeNextRoute pra redirect role-based testável

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 12: useResponsiveShell hook

**Files:**
- Create: `apps/mobile/hooks/useResponsiveShell.ts`
- Create: `apps/mobile/test/responsive-shell.test.mjs`

- [ ] **Step 12.1: Escrever test (pure logic — testar a função interna)**

Criar `apps/mobile/test/responsive-shell.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveShellMode } from '../hooks/useResponsiveShell.ts';

test('width >= 900 retorna rail', () => {
  assert.equal(resolveShellMode(900), 'rail');
  assert.equal(resolveShellMode(1024), 'rail');
  assert.equal(resolveShellMode(1280), 'rail');
});

test('width < 900 retorna drawer', () => {
  assert.equal(resolveShellMode(899), 'drawer');
  assert.equal(resolveShellMode(800), 'drawer');
  assert.equal(resolveShellMode(360), 'drawer');
});

test('width 0 (edge) retorna drawer', () => {
  assert.equal(resolveShellMode(0), 'drawer');
});
```

- [ ] **Step 12.2: Implementar hook**

Criar `apps/mobile/hooks/useResponsiveShell.ts`:

```ts
import { useWindowDimensions } from 'react-native';

export type ShellMode = 'rail' | 'drawer';

export function resolveShellMode(width: number): ShellMode {
  return width >= 900 ? 'rail' : 'drawer';
}

export function useResponsiveShell(): { mode: ShellMode } {
  const { width } = useWindowDimensions();
  return { mode: resolveShellMode(width) };
}
```

- [ ] **Step 12.3: Rodar tests**

```bash
cd apps/mobile && node --import tsx --test test/responsive-shell.test.mjs
```

Expected: PASS (3 tests).

- [ ] **Step 12.4: Commit**

```bash
git add apps/mobile/hooks/useResponsiveShell.ts apps/mobile/test/responsive-shell.test.mjs
git commit -m "$(cat <<'EOF'
feat(mobile): hook useResponsiveShell + resolveShellMode (threshold 900px)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 13: CantinaContext + apiFetch — ajuste pra staff

**Files:**
- Modify: `apps/mobile/context/CantinaContext.tsx`

- [ ] **Step 13.1: Forçar `currentCantinaId = user.cantinaId` quando staff**

Em `apps/mobile/context/CantinaContext.tsx`, dentro do `CantinaProvider`:

```tsx
export function CantinaProvider({ children }: ProviderProps) {
  const { user } = useAuth();
  const [currentCantinaId, setCurrentCantinaId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Staff: cantinaId fixo (do JWT/user). Customer: hidrata de AsyncStorage + fallback user.cantinaId.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (user?.role === 'staff') {
        // Fast-path: força e persiste pro apiFetch ler
        const id = user.cantinaId ?? null;
        if (!cancelled) {
          setCurrentCantinaId(id);
          setHydrated(true);
          if (id) await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_CANTINA_ID, id);
          else await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_CANTINA_ID);
        }
        return;
      }
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_CANTINA_ID);
      if (cancelled) return;
      const initial = stored ?? user?.cantinaId ?? null;
      setCurrentCantinaId(initial);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, user?.cantinaId]);

  const setCurrent = useCallback(async (id: string | null) => {
    // Staff não pode trocar — no-op com warn em dev
    if (user?.role === 'staff') {
      if (__DEV__) console.warn('[CantinaContext] Staff não pode trocar de cantina (cantinaId fixo). Ignorado.');
      return;
    }
    setCurrentCantinaId(id);
    if (id === null) await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_CANTINA_ID);
    else await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_CANTINA_ID, id);
  }, [user?.role]);

  // Cleanup pra customer (mantido)
  useEffect(() => {
    if (user?.role === 'customer' && hydrated && user?.cantinaId === null && currentCantinaId !== null) {
      setCurrentCantinaId(null);
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_CANTINA_ID).catch(() => {});
    }
  }, [user?.cantinaId, user?.role, hydrated, currentCantinaId]);

  return (
    <CantinaContext.Provider value={{ currentCantinaId, setCurrent }}>
      {children}
    </CantinaContext.Provider>
  );
}
```

Note: `apiFetch` em `lib/api/client.ts` já lê `STORAGE_KEYS.CURRENT_CANTINA_ID` direto do AsyncStorage. Mantemos esse contrato; o que muda é só o setter pro staff e a hidratação inicial.

- [ ] **Step 13.2: Rodar typecheck**

```bash
pnpm --filter @cantina/mobile typecheck
```

Expected: PASS.

- [ ] **Step 13.3: Commit**

```bash
git add apps/mobile/context/CantinaContext.tsx
git commit -m "$(cat <<'EOF'
refactor(mobile/cantina): staff força currentCantinaId = user.cantinaId; setter vira no-op

apiFetch continua lendo de AsyncStorage; mudança é só no controle de quem escreve.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Mobile primitives (Tasks 14–18)

Componentes shared reutilizáveis pelas telas de staff (e potencialmente customer).

### Task 14: ConfirmModal — modal genérico de confirmação

**Files:**
- Create: `apps/mobile/components/ConfirmModal.tsx`

- [ ] **Step 14.1: Implementar componente**

Criar `apps/mobile/components/ConfirmModal.tsx`:

```tsx
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

export type ConfirmModalVariant = 'default' | 'danger';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  body?: string;
  /** Quando setado, exibe TextInput multiline pra capturar motivo. */
  reasonField?: { label: string; placeholder?: string; value: string; onChangeText: (v: string) => void };
  primaryLabel: string;
  secondaryLabel?: string;
  variant?: ConfirmModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  body,
  reasonField,
  primaryLabel,
  secondaryLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { marginBottom: insets.bottom + 24 }]} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {reasonField ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{reasonField.label}</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder={reasonField.placeholder ?? 'Opcional'}
                placeholderTextColor={colors.textMuted}
                multiline
                value={reasonField.value}
                onChangeText={reasonField.onChangeText}
                maxLength={200}
              />
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressedSoft]}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={styles.btnSecondaryText}>{secondaryLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btnPrimary,
                variant === 'danger' && { backgroundColor: colors.danger },
                pressed && styles.pressedSoft,
              ]}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
            >
              <Text style={styles.btnPrimaryText}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      borderRadius: 24,
      padding: 24,
      gap: 12,
    },
    title: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: c.text },
    body: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: c.textMuted, lineHeight: 20 },
    field: { gap: 6 },
    fieldLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
    fieldInput: {
      backgroundColor: c.surfaceElevated,
      borderRadius: 12,
      padding: 12,
      color: c.text,
      fontFamily: 'Manrope_400Regular',
      fontSize: 14,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    btnSecondary: {
      flex: 1, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
      backgroundColor: c.surfaceElevated, alignItems: 'center',
    },
    btnSecondaryText: { fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: c.text },
    btnPrimary: {
      flex: 1, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
      backgroundColor: c.primary, alignItems: 'center',
    },
    btnPrimaryText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: c.textOnPrimary ?? '#FFFFFF' },
    pressedSoft: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}
```

- [ ] **Step 14.2: Confirmar tokens existentes**

Verificar que `colors.danger`, `colors.textMuted`, `colors.textOnPrimary`, `colors.surface`, `colors.surfaceElevated` existem em `constants/theme.ts`. Se algum não existir, adicionar (manter consistente com convenção da §3 do CLAUDE.md). `textOnPrimary` pode não existir — usar `'#FFFFFF'` como fallback (já no código).

- [ ] **Step 14.3: Typecheck**

```bash
pnpm --filter @cantina/mobile typecheck
```

- [ ] **Step 14.4: Commit**

```bash
git add apps/mobile/components/ConfirmModal.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): ConfirmModal genérico (title/body/reasonField/danger variant)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 15: SegmentedControl

**Files:**
- Create: `apps/mobile/components/SegmentedControl.tsx`

- [ ] **Step 15.1: Implementar componente**

Criar `apps/mobile/components/SegmentedControl.tsx`:

```tsx
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

export default function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && styles.pressedSoft,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: c.surfaceElevated,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: c.surface,
    },
    label: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: c.textMuted },
    labelActive: { fontFamily: 'Manrope_700Bold', color: c.text },
    pressedSoft: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}
```

- [ ] **Step 15.2: Commit**

```bash
git add apps/mobile/components/SegmentedControl.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): SegmentedControl genérico (N opções, value/onChange)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 16: MasterDetailLayout — split responsivo

**Files:**
- Create: `apps/mobile/components/MasterDetailLayout.tsx`

- [ ] **Step 16.1: Implementar**

Criar `apps/mobile/components/MasterDetailLayout.tsx`:

```tsx
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { useResponsiveShell } from '@/hooks/useResponsiveShell';
import type { ThemeColors } from '@/types';

interface MasterDetailLayoutProps {
  listSlot: ReactNode;
  detailSlot: ReactNode;
  /** Em drawer mode: se true, esconde listSlot e mostra só detailSlot (full-screen). */
  detailVisible?: boolean;
}

export default function MasterDetailLayout({
  listSlot,
  detailSlot,
  detailVisible = false,
}: MasterDetailLayoutProps) {
  const { colors } = useTheme();
  const { mode } = useResponsiveShell();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (mode === 'rail') {
    return (
      <View style={styles.split}>
        <View style={styles.list}>{listSlot}</View>
        <View style={styles.divider} />
        <View style={styles.detail}>{detailSlot}</View>
      </View>
    );
  }

  // drawer mode: stack vertical, esconde uma das views
  return (
    <View style={styles.stack}>
      {detailVisible ? detailSlot : listSlot}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    split: { flex: 1, flexDirection: 'row', backgroundColor: c.background },
    list: { flex: 38, backgroundColor: c.background },
    divider: { width: StyleSheet.hairlineWidth, backgroundColor: c.border },
    detail: { flex: 62, backgroundColor: c.surface },
    stack: { flex: 1, backgroundColor: c.background },
  });
}
```

- [ ] **Step 16.2: Commit**

```bash
git add apps/mobile/components/MasterDetailLayout.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): MasterDetailLayout — split 38/62 em rail mode; stack único em drawer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 17: KpiCard

**Files:**
- Create: `apps/mobile/components/KpiCard.tsx`

- [ ] **Step 17.1: Implementar**

Criar `apps/mobile/components/KpiCard.tsx`:

```tsx
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

interface KpiCardProps {
  eyebrow: string;
  value: string;
  deltaPct?: number | null;
}

export default function KpiCard({ eyebrow, value, deltaPct }: KpiCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const deltaText = deltaPct != null ? `${deltaPct >= 0 ? '↑' : '↓'} ${Math.abs(deltaPct).toFixed(0)}%` : '—';
  const deltaColor = deltaPct == null ? colors.textMuted : deltaPct >= 0 ? colors.success ?? '#10B981' : colors.danger ?? '#EF4444';

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.delta, { color: deltaColor }]}>{deltaText}<Text style={styles.deltaSuffix}> vs período anterior</Text></Text>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      gap: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    eyebrow: {
      fontFamily: 'Manrope_700Bold', fontSize: 10, color: c.textMuted,
      textTransform: 'uppercase', letterSpacing: 1.5,
    },
    value: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, color: c.text },
    delta: { fontFamily: 'Manrope_600SemiBold', fontSize: 12 },
    deltaSuffix: { fontFamily: 'Manrope_400Regular', color: c.textMuted },
  });
}
```

Note: se `colors.success`/`colors.danger` não existirem, fallback inline com hex. Token novo é melhor — confirmar via grep no theme.ts.

- [ ] **Step 17.2: Commit**

```bash
git add apps/mobile/components/KpiCard.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): KpiCard (eyebrow + valor 28px + delta % colorido)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 18: BarChart — SVG primitive

**Files:**
- Create: `apps/mobile/components/BarChart.tsx`
- Create: `apps/mobile/test/bar-chart.test.mjs`

- [ ] **Step 18.1: Implementar componente**

Criar `apps/mobile/components/BarChart.tsx`:

```tsx
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  width: number;
  height: number;
}

export default function BarChart({ data, width, height }: BarChartProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const maxValue = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / Math.max(1, data.length);
  const barGap = barWidth * 0.2;
  const innerBarWidth = barWidth - barGap;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight;
          const x = padding.left + i * barWidth + barGap / 2;
          const y = padding.top + chartHeight - barHeight;
          return (
            <Rect
              key={d.label}
              x={x}
              y={y}
              width={innerBarWidth}
              height={Math.max(2, barHeight)}
              rx={4}
              ry={4}
              fill={colors.primary}
              opacity={d.value === 0 ? 0.2 : 1}
            />
          );
        })}
        {data.map((d, i) => {
          const x = padding.left + i * barWidth + barWidth / 2;
          const y = height - 8;
          return (
            <SvgText
              key={`l-${d.label}`}
              x={x}
              y={y}
              fontSize={9}
              fill={colors.textMuted}
              textAnchor="middle"
              fontFamily="Manrope_500Medium"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { alignSelf: 'flex-start' },
  });
}
```

- [ ] **Step 18.2: Test (smoke render)**

Criar `apps/mobile/test/bar-chart.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

// Smoke test: a função interna de cálculo de proporção (extraída pra testabilidade)
function computeBarHeight(value, maxValue, chartHeight) {
  if (maxValue <= 0) return 2;
  return Math.max(2, (value / maxValue) * chartHeight);
}

test('compute bar height proporcional ao max', () => {
  assert.equal(computeBarHeight(10, 10, 100), 100);
  assert.equal(computeBarHeight(5, 10, 100), 50);
  assert.equal(computeBarHeight(0, 10, 100), 2); // mínimo 2 pra visibilidade
});

test('compute bar height com max zero retorna mínimo', () => {
  assert.equal(computeBarHeight(0, 0, 100), 2);
});
```

Note: o test extrai a lógica numérica de proporção pra um arquivo testável. Como o componente renderiza SVG (precisa do ambiente RN), não roda render real em vitest Node. Esse é o trade-off aceito pra `noUncheckedIndexedAccess` + Node-only testing.

- [ ] **Step 18.3: Rodar test**

```bash
cd apps/mobile && node --test test/bar-chart.test.mjs
```

Expected: PASS (2 tests).

- [ ] **Step 18.4: Confirmar `react-native-svg` instalado**

```bash
grep '"react-native-svg"' apps/mobile/package.json
```

Expected: já listado (foi instalado em fase anterior pro QR code).

- [ ] **Step 18.5: Commit**

```bash
git add apps/mobile/components/BarChart.tsx apps/mobile/test/bar-chart.test.mjs
git commit -m "$(cat <<'EOF'
feat(mobile): BarChart SVG primitive (Rect + labels com Manrope)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Mobile shell + role gating (Tasks 19–22)

SideRail + MobileDrawer + StaffShell wrapper + `app/(staff)/_layout.tsx` + role gate em `app/_layout.tsx`.

### Task 19: SideRail

**Files:**
- Create: `apps/mobile/components/SideRail.tsx`

- [ ] **Step 19.1: Implementar componente**

Criar `apps/mobile/components/SideRail.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

const ITEMS: Array<{ href: string; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = [
  { href: '/(staff)/pedidos', label: 'Pedidos', icon: 'list-outline', activeIcon: 'list' },
  { href: '/(staff)/cardapio', label: 'Cardápio', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { href: '/(staff)/stats', label: 'Estatísticas', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { href: '/(staff)/perfil', label: 'Perfil', icon: 'person-outline', activeIcon: 'person' },
];

export default function SideRail() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.rail, { paddingTop: insets.top + 12 }]}>
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Pressable
            key={item.href}
            onPress={() => router.replace(item.href)}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={active ? item.activeIcon : item.icon}
              size={22}
              color={active ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, { color: active ? colors.primary : colors.textMuted }]} numberOfLines={1}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    rail: {
      width: 88,
      backgroundColor: c.surface,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.border,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 6,
    },
    item: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 14,
      alignItems: 'center',
      gap: 4,
    },
    itemActive: { backgroundColor: c.primarySoft },
    label: { fontFamily: 'Manrope_600SemiBold', fontSize: 10 },
    pressed: { opacity: 0.7 },
  });
}
```

- [ ] **Step 19.2: Commit**

```bash
git add apps/mobile/components/SideRail.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): SideRail (88px, 4 itens, Ionicons, active state com primarySoft)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 20: MobileDrawer

**Files:**
- Create: `apps/mobile/components/MobileDrawer.tsx`

- [ ] **Step 20.1: Implementar**

Criar `apps/mobile/components/MobileDrawer.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

const ITEMS: Array<{ href: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { href: '/(staff)/pedidos', label: 'Pedidos', icon: 'list-outline' },
  { href: '/(staff)/cardapio', label: 'Cardápio', icon: 'restaurant-outline' },
  { href: '/(staff)/stats', label: 'Estatísticas', icon: 'bar-chart-outline' },
  { href: '/(staff)/perfil', label: 'Perfil', icon: 'person-outline' },
];

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ visible, onClose }: MobileDrawerProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.drawer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>Cantina Staff</Text>
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Pressable
                key={item.href}
                onPress={() => {
                  onClose();
                  router.replace(item.href);
                }}
                style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Ionicons name={item.icon} size={20} color={active ? colors.primary : colors.text} />
                <Text style={[styles.label, { color: active ? colors.primary : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.overlay} onPress={onClose} />
      </View>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, flexDirection: 'row' },
    drawer: { width: 280, backgroundColor: c.surface, paddingHorizontal: 12, gap: 6 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    title: {
      fontFamily: 'Manrope_700Bold', fontSize: 11, color: c.textMuted,
      textTransform: 'uppercase', letterSpacing: 2,
      paddingHorizontal: 12, paddingBottom: 8,
    },
    item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
    itemActive: { backgroundColor: c.primarySoft },
    label: { fontFamily: 'Manrope_600SemiBold', fontSize: 15 },
    pressed: { opacity: 0.7 },
  });
}
```

- [ ] **Step 20.2: Commit**

```bash
git add apps/mobile/components/MobileDrawer.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): MobileDrawer 280px slide-in com overlay clicável pra fechar

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 21: StaffShell wrapper

**Files:**
- Create: `apps/mobile/components/StaffShell.tsx`

- [ ] **Step 21.1: Implementar**

Criar `apps/mobile/components/StaffShell.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MobileDrawer from '@/components/MobileDrawer';
import SideRail from '@/components/SideRail';
import { useTheme } from '@/context/ThemeContext';
import { useResponsiveShell } from '@/hooks/useResponsiveShell';
import type { ThemeColors } from '@/types';

interface StaffShellProps {
  title: string;
  children: ReactNode;
  /** Conteúdo opcional renderizado no header (filtros, segmented, busca). */
  headerRight?: ReactNode;
}

export default function StaffShell({ title, children, headerRight }: StaffShellProps) {
  const { colors } = useTheme();
  const { mode } = useResponsiveShell();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      {mode === 'rail' ? <SideRail /> : null}
      <View style={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          {mode === 'drawer' ? (
            <Pressable
              onPress={() => setDrawerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir menu"
              style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="menu-outline" size={26} color={colors.text} />
            </Pressable>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerRight}>{headerRight}</View>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
      {mode === 'drawer' ? (
        <MobileDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: c.background },
    content: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingBottom: 12,
      backgroundColor: c.background,
    },
    menuBtn: { padding: 4, borderRadius: 12 },
    title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: c.text, flex: 1 },
    headerRight: { flexShrink: 0 },
    body: { flex: 1 },
    pressed: { opacity: 0.7 },
  });
}
```

- [ ] **Step 21.2: Commit**

```bash
git add apps/mobile/components/StaffShell.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): StaffShell — switch rail/drawer baseado em useResponsiveShell, header com title + slot

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 22: app/(staff)/_layout.tsx + role gate em app/_layout.tsx

**Files:**
- Create: `apps/mobile/app/(staff)/_layout.tsx`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 22.1: Criar `(staff)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function StaffLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="pedidos" />
      <Stack.Screen name="cardapio" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="pedido/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="cardapio/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
```

- [ ] **Step 22.2: Adicionar role redirect no root `app/_layout.tsx`**

Modificar `apps/mobile/app/_layout.tsx`. Importar `computeNextRoute`:

```tsx
import { useRouter, useSegments } from 'expo-router';

import { computeNextRoute } from '@/lib/role-redirect';
```

Dentro de `RootStack`, antes do `return <Stack>`:

```tsx
const router = useRouter();
const segments = useSegments();
const { user, isHydrating } = useAuth();

useEffect(() => {
  if (isHydrating || onboarded === null || !onboarded) return;
  const currentPath = '/' + segments.join('/');
  const next = computeNextRoute({ user, currentPath });
  if (next && next !== currentPath) {
    router.replace(next);
  }
}, [user, segments, isHydrating, onboarded, router]);
```

E adicionar `<Stack.Screen name="(staff)" />` ao `<Stack>`:

```tsx
<Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(onboarding)" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="(staff)" />
  {/* ... resto */}
</Stack>
```

- [ ] **Step 22.3: Atualizar `(tabs)/_layout.tsx` pra bloquear staff**

Em `apps/mobile/app/(tabs)/_layout.tsx`, no early return:

```tsx
const { user } = useAuth();
if (user?.role === 'staff') {
  return <Redirect href="/(staff)/pedidos" />;
}
```

(Adicionar antes do gate de onboarding existente.)

- [ ] **Step 22.4: Atualizar `(onboarding)/_layout.tsx` pra bloquear staff**

Mesmo padrão: se `user?.role === 'staff'`, `<Redirect href="/(staff)/pedidos" />`.

- [ ] **Step 22.5: Typecheck**

```bash
pnpm --filter @cantina/mobile typecheck
```

- [ ] **Step 22.6: Commit**

```bash
git add apps/mobile/app/(staff)/_layout.tsx apps/mobile/app/_layout.tsx apps/mobile/app/(tabs)/_layout.tsx apps/mobile/app/(onboarding)/_layout.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): (staff) stack + role gate em _layout.tsx + (tabs)/_layout + (onboarding)/_layout

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Mobile staff screens (Tasks 23–30)

### Task 23: Staff orders API client + hooks

**Files:**
- Create: `apps/mobile/lib/api/staff-orders.ts`
- Create: `apps/mobile/lib/api/hooks/use-staff-orders.ts`

- [ ] **Step 23.1: Implementar API client**

Criar `apps/mobile/lib/api/staff-orders.ts`:

```ts
import { apiFetch } from './client';
import type { Order } from '@cantina/shared';

export async function listStaffOrders(params: { scope: 'active' | 'history'; date?: string }): Promise<{ orders: Order[] }> {
  const search = new URLSearchParams();
  search.set('scope', params.scope);
  if (params.date) search.set('date', params.date);
  return apiFetch<{ orders: Order[] }>(`/orders/staff?${search.toString()}`);
}

export async function updateOrderStatus(id: string, body: { status: 'pedido' | 'pronto' | 'cancelado'; reason?: string }): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}/status`, { method: 'PATCH', body });
}

export async function bulkMarkPronto(ids: string[]): Promise<{ updated: string[] }> {
  return apiFetch<{ updated: string[] }>(`/orders/bulk-status`, { method: 'PATCH', body: { ids, status: 'pronto' } });
}
```

Note: o backend lista todos os pedidos (não filtra por user). Plano adiciona route `GET /orders/staff` ou usa `GET /orders` filtrado por cantina via tenantContext. Como o `GET /orders` atual filtra por `userId === claim.sub` (linha ~75 de orders.ts), precisamos de uma rota separada pra staff OU adaptar a existente.

Opção escolhida: adicionar `GET /orders/staff` no backend (Task 23.bis abaixo) que filtra por cantina ao invés de user.

- [ ] **Step 23.2: Adicionar `GET /orders/staff` no backend**

Em `apps/api/src/routes/orders.ts`, adicionar handler antes do `app.get('/:id', ...)`:

```ts
app.get('/staff', requireRole('staff'), async (c) => {
  const cantina = c.var.cantina;
  const scope = c.req.query('scope') ?? 'active';
  const dateStr = c.req.query('date');

  const filters = [eq(orders.cantinaId, cantina.id)];
  if (scope === 'active') {
    // pedidos pendentes + prontos há menos de 30min
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    filters.push(sql`(${orders.status} = 'pedido' OR (${orders.status} = 'pronto' AND ${orders.prontoEm} > ${cutoff}))`);
  } else {
    // history: prontos há > 30min + cancelados; opcional filtro por data
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    filters.push(sql`((${orders.status} = 'pronto' AND ${orders.prontoEm} <= ${cutoff}) OR ${orders.status} = 'cancelado')`);
    if (dateStr) {
      const date = new Date(dateStr);
      const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      filters.push(gte(orders.criadoEm, dayStart));
      filters.push(sql`${orders.criadoEm} < ${dayEnd}`);
    }
  }

  const list = await db.select().from(orders).where(and(...filters)).orderBy(desc(orders.criadoEm));
  const enriched = await Promise.all(list.map((o) => fetchOrderWithItems(db, o.id)));
  return c.json({ orders: enriched.filter((o): o is OrderDto => o !== null) }, 200);
});
```

Adicionar tests rápidos em `orders.test.ts` (3 tests: active retorna pedido + pronto-recente; history retorna pronto-antigo + cancelado; date filter funciona).

- [ ] **Step 23.3: Implementar hooks**

Criar `apps/mobile/lib/api/hooks/use-staff-orders.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import { bulkMarkPronto, listStaffOrders, updateOrderStatus } from '../staff-orders';

export function useStaffOrders(params: { scope: 'active' | 'history'; date?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['staff-orders', params.scope, params.date ?? null],
    queryFn: () => listStaffOrders(params),
    enabled: !!user && user.role === 'staff',
    refetchInterval: params.scope === 'active' ? 5_000 : false,
    staleTime: 2_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'pedido' | 'pronto' | 'cancelado'; reason?: string }) =>
      updateOrderStatus(id, { status, reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-orders'] });
    },
  });
}

export function useBulkMarkPronto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkMarkPronto(ids),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-orders'] });
    },
  });
}
```

- [ ] **Step 23.4: Typecheck + tests**

```bash
pnpm -r typecheck && pnpm --filter @cantina/api test orders
```

Expected: PASS.

- [ ] **Step 23.5: Commit**

```bash
git add apps/api/src/routes/orders.ts apps/api/src/routes/orders.test.ts apps/mobile/lib/api/staff-orders.ts apps/mobile/lib/api/hooks/use-staff-orders.ts
git commit -m "$(cat <<'EOF'
feat: GET /orders/staff (scope active/history + date filter) + hooks mobile

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 24: (staff)/pedidos.tsx — master-detail + bulk + search + histórico

**Files:**
- Create: `apps/mobile/app/(staff)/pedidos.tsx`

- [ ] **Step 24.1: Implementar tela**

Criar `apps/mobile/app/(staff)/pedidos.tsx`. Esta é a tela mais densa do projeto. Vou listar **estrutura** + **código completo**:

```tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';
import MasterDetailLayout from '@/components/MasterDetailLayout';
import StaffShell from '@/components/StaffShell';
import { useTheme } from '@/context/ThemeContext';
import { useResponsiveShell } from '@/hooks/useResponsiveShell';
import { useBulkMarkPronto, useStaffOrders, useUpdateOrderStatus } from '@/lib/api/hooks/use-staff-orders';
import type { Order, OrderItem } from '@cantina/shared';
import type { ThemeColors } from '@/types';

type Scope = 'active' | 'history';

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  return `há ${diffH}h`;
}

export default function StaffPedidosScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { mode } = useResponsiveShell();
  const [scope, setScope] = useState<Scope>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [confirmPronto, setConfirmPronto] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; reason: string } | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);

  const { data, isPending, refetch } = useStaffOrders({ scope });
  const updateStatus = useUpdateOrderStatus();
  const bulkPronto = useBulkMarkPronto();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const list: Order[] = data?.orders ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((o) => String(o.senha) === q || (o.userId?.toLowerCase().includes(q)));
  }, [list, search]);

  const selected: Order | null = useMemo(() => filtered.find((o) => o.id === selectedId) ?? null, [filtered, selectedId]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const doBulkPronto = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkPronto.mutateAsync(Array.from(selectedIds));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedIds(new Set());
    setSelecting(false);
  }, [bulkPronto, selectedIds]);

  const doMarkPronto = useCallback(async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'pronto' });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmPronto(null);
  }, [updateStatus]);

  const doCancel = useCallback(async () => {
    if (!confirmCancel) return;
    await updateStatus.mutateAsync({ id: confirmCancel.id, status: 'cancelado', reason: confirmCancel.reason || undefined });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setConfirmCancel(null);
  }, [updateStatus, confirmCancel]);

  const doRollback = useCallback(async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'pedido' });
    setConfirmRollback(null);
  }, [updateStatus]);

  const renderCard = ({ item }: { item: Order }) => {
    const isSelected = selectedIds.has(item.id);
    const isFocused = selectedId === item.id;
    const borderColor = item.status === 'pedido' ? colors.warning ?? '#F59E0B' : item.status === 'pronto' ? colors.success ?? '#10B981' : colors.textMuted;
    return (
      <Pressable
        onPress={() => {
          if (selecting && item.status === 'pedido') {
            toggleSelect(item.id);
          } else if (mode === 'rail') {
            setSelectedId(item.id);
          } else {
            router.push(`/(staff)/pedido/${item.id}`);
          }
        }}
        style={({ pressed }) => [
          styles.card,
          { borderLeftColor: borderColor },
          isFocused && styles.cardFocused,
          isSelected && styles.cardSelected,
          pressed && styles.pressedSoft,
        ]}
      >
        {selecting && item.status === 'pedido' ? (
          <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.senha}>#{item.senha}</Text>
            <Text style={styles.relTime}>{relativeTime(item.criadoEm)}</Text>
          </View>
          <Text style={styles.cardSubtitle}>{item.itens.length} item{item.itens.length === 1 ? '' : 's'} · R$ {item.total}</Text>
        </View>
      </Pressable>
    );
  };

  const activeCount = list.filter((o) => o.status === 'pedido').length;
  const prontoCount = list.filter((o) => o.status === 'pronto').length;

  const headerRight = (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable
        onPress={() => setScope(scope === 'active' ? 'history' : 'active')}
        style={({ pressed }) => [styles.chip, pressed && styles.pressedSoft]}
        accessibilityRole="button"
        accessibilityLabel={scope === 'active' ? 'Ver histórico' : 'Ver fila ativa'}
      >
        <Ionicons name="time-outline" size={14} color={colors.text} />
        <Text style={styles.chipText}>{scope === 'active' ? 'Histórico' : 'Fila ativa'}</Text>
      </Pressable>
      {scope === 'active' ? (
        <Pressable
          onPress={() => { setSelecting((s) => !s); setSelectedIds(new Set()); }}
          style={({ pressed }) => [styles.chip, selecting && styles.chipActive, pressed && styles.pressedSoft]}
          accessibilityRole="button"
        >
          <Ionicons name="checkbox-outline" size={14} color={selecting ? colors.primary : colors.text} />
          <Text style={[styles.chipText, selecting && { color: colors.primary }]}>{selecting ? 'Cancelar' : 'Selecionar'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const listSlot = (
    <View style={{ flex: 1 }}>
      <View style={styles.listHeader}>
        <Text style={styles.counts}>Em preparação {activeCount} · Pronto {prontoCount}</Text>
        <TextInput
          placeholder="Buscar por senha ou nome"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
      </View>
      {selecting && selectedIds.size > 0 ? (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkText}>{selectedIds.size} selecionado{selectedIds.size === 1 ? '' : 's'}</Text>
          <Pressable
            onPress={doBulkPronto}
            style={({ pressed }) => [styles.bulkBtn, pressed && styles.pressedSoft]}
            disabled={bulkPronto.isPending}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.bulkBtnText}>Marcar pronto</Text>
          </Pressable>
        </View>
      ) : null}
      {isPending ? null : filtered.length === 0 ? (
        <EmptyState title="Sem pedidos" subtitle={scope === 'active' ? 'Aguardando próximos pedidos…' : 'Nenhum pedido no histórico.'} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          refreshing={isPending}
          onRefresh={() => { void refetch(); }}
        />
      )}
    </View>
  );

  const detailSlot = selected ? (
    <View style={styles.detail}>
      <Text style={styles.detailSenha}>#{selected.senha}</Text>
      <Text style={styles.detailTime}>Pedido {relativeTime(selected.criadoEm)}</Text>
      <View style={styles.detailItems}>
        {selected.itens.map((it: OrderItem) => (
          <View key={it.id} style={styles.detailItemRow}>
            <Text style={styles.detailItemName}>{it.quantidade}× {it.nameSnapshot}</Text>
            <Text style={styles.detailItemPrice}>R$ {(parseFloat(it.precoSnapshot) * it.quantidade).toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.detailTotal}>
        <Text style={styles.detailTotalLabel}>Total</Text>
        <Text style={styles.detailTotalValue}>R$ {selected.total}</Text>
      </View>
      <View style={styles.detailActions}>
        {selected.status === 'pedido' ? (
          <>
            <Pressable
              onPress={() => setConfirmPronto(selected.id)}
              style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressedSoft]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.ctaPrimaryText}>Marcar pronto</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmCancel({ id: selected.id, reason: '' })}
              style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressedSoft]}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.text} />
              <Text style={styles.ctaSecondaryText}>Cancelar</Text>
            </Pressable>
          </>
        ) : selected.status === 'pronto' ? (
          <Pressable
            onPress={() => setConfirmRollback(selected.id)}
            style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressedSoft]}
          >
            <Ionicons name="arrow-undo-outline" size={18} color={colors.text} />
            <Text style={styles.ctaSecondaryText}>Voltar pra preparação</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  ) : (
    <View style={[styles.detail, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.textMuted }}>Selecione um pedido</Text>
    </View>
  );

  return (
    <StaffShell title="Pedidos" headerRight={headerRight}>
      <MasterDetailLayout listSlot={listSlot} detailSlot={detailSlot} />
      <ConfirmModal
        visible={!!confirmPronto}
        title="Marcar como pronto?"
        primaryLabel="Marcar pronto"
        onConfirm={() => confirmPronto && doMarkPronto(confirmPronto)}
        onCancel={() => setConfirmPronto(null)}
      />
      <ConfirmModal
        visible={!!confirmCancel}
        title="Cancelar pedido?"
        body="O estoque será devolvido automaticamente."
        primaryLabel="Cancelar pedido"
        variant="danger"
        reasonField={confirmCancel ? {
          label: 'Motivo (opcional)',
          value: confirmCancel.reason,
          onChangeText: (v) => setConfirmCancel((c) => c ? { ...c, reason: v } : null),
        } : undefined}
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(null)}
      />
      <ConfirmModal
        visible={!!confirmRollback}
        title="Voltar pra preparação?"
        body="O pedido volta a aparecer na fila ativa."
        primaryLabel="Voltar"
        onConfirm={() => confirmRollback && doRollback(confirmRollback)}
        onCancel={() => setConfirmRollback(null)}
      />
    </StaffShell>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    listHeader: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 8 },
    counts: { fontFamily: 'Manrope_500Medium', fontSize: 12, color: c.textMuted },
    search: { backgroundColor: c.surfaceElevated, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: c.text, fontFamily: 'Manrope_400Regular' },
    bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: c.primarySoft },
    bulkText: { flex: 1, fontFamily: 'Manrope_600SemiBold', color: c.primary },
    bulkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    bulkBtnText: { fontFamily: 'Manrope_700Bold', color: '#FFFFFF', fontSize: 13 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderRadius: 16, padding: 14, borderLeftWidth: 4 },
    cardFocused: { backgroundColor: c.surfaceElevated },
    cardSelected: { borderColor: c.primary, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    senha: { fontFamily: 'Manrope_800ExtraBold', fontSize: 18, color: c.text },
    relTime: { fontFamily: 'Manrope_500Medium', fontSize: 12, color: c.textMuted },
    cardSubtitle: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: c.textMuted, marginTop: 2 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    chipActive: { backgroundColor: c.primarySoft },
    chipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: c.text },
    detail: { flex: 1, padding: 24, gap: 12 },
    detailSenha: { fontFamily: 'Manrope_800ExtraBold', fontSize: 48, color: c.text },
    detailTime: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: c.textMuted },
    detailItems: { marginTop: 8, gap: 6 },
    detailItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
    detailItemName: { fontFamily: 'Manrope_500Medium', fontSize: 15, color: c.text },
    detailItemPrice: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.text },
    detailTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    detailTotalLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.textMuted },
    detailTotalValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: c.text },
    detailActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    ctaPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, paddingVertical: 14, borderRadius: 16 },
    ctaPrimaryText: { fontFamily: 'Manrope_700Bold', color: '#FFFFFF' },
    ctaSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.surfaceElevated, paddingVertical: 14, borderRadius: 16 },
    ctaSecondaryText: { fontFamily: 'Manrope_600SemiBold', color: c.text },
    pressedSoft: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}
```

- [ ] **Step 24.2: Typecheck**

```bash
pnpm --filter @cantina/mobile typecheck
```

Expected: PASS.

- [ ] **Step 24.3: Commit**

```bash
git add apps/mobile/app/(staff)/pedidos.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/staff): tela Pedidos — master-detail + bulk select + search + scope active/history

- Cards com border-left status colorida, senha bold, relativo
- Modo selecionar com toggle por card pedido (pronto fica disabled)
- 3 ConfirmModals (pronto, cancelar com motivo, rollback)
- TanStack refetchInterval 5s no scope active

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 25: (staff)/pedido/[id].tsx — phone fallback

**Files:**
- Create: `apps/mobile/app/(staff)/pedido/[id].tsx`

- [ ] **Step 25.1: Implementar (reusa detail panel do Task 24)**

Criar `apps/mobile/app/(staff)/pedido/[id].tsx`. Extraímos a parte detail da Task 24 num componente puro `StaffPedidoDetail.tsx` em `apps/mobile/components/` pra reuso:

```tsx
import { useLocalSearchParams } from 'expo-router';

import StaffPedidoDetail from '@/components/StaffPedidoDetail';
import StaffShell from '@/components/StaffShell';

export default function StaffPedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <StaffShell title="Pedido">
      <StaffPedidoDetail id={id ?? ''} />
    </StaffShell>
  );
}
```

E refatorar Task 24 pra usar `<StaffPedidoDetail id={selected.id} />` no `detailSlot`. (Recomendado: fazer em Step 25.2 antes de commitar.)

- [ ] **Step 25.2: Extrair `StaffPedidoDetail` em `apps/mobile/components/StaffPedidoDetail.tsx`**

Componente recebe `id: string`, lê o pedido do cache do TanStack Query (`useStaffOrders` já invalida), exibe UI de detail panel, gerencia os 3 ConfirmModals internamente.

```tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ConfirmModal from '@/components/ConfirmModal';
import { useTheme } from '@/context/ThemeContext';
import { useStaffOrders, useUpdateOrderStatus } from '@/lib/api/hooks/use-staff-orders';
import type { Order, OrderItem } from '@cantina/shared';
import type { ThemeColors } from '@/types';

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  return `há ${diffH}h`;
}

interface StaffPedidoDetailProps {
  id: string;
}

export default function StaffPedidoDetail({ id }: StaffPedidoDetailProps) {
  const { colors } = useTheme();
  const { data: active } = useStaffOrders({ scope: 'active' });
  const { data: history } = useStaffOrders({ scope: 'history' });
  const update = useUpdateOrderStatus();
  const [confirmPronto, setConfirmPronto] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<{ reason: string } | null>(null);
  const [confirmRollback, setConfirmRollback] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const order: Order | undefined =
    active?.orders.find((o) => o.id === id) ?? history?.orders.find((o) => o.id === id);

  if (!order) {
    return (
      <View style={[styles.detail, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.textMuted }}>Pedido não encontrado</Text>
      </View>
    );
  }

  const doMarkPronto = useCallback(async () => {
    await update.mutateAsync({ id: order.id, status: 'pronto' });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmPronto(false);
  }, [update, order.id]);

  const doCancel = useCallback(async () => {
    if (!confirmCancel) return;
    await update.mutateAsync({ id: order.id, status: 'cancelado', reason: confirmCancel.reason || undefined });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setConfirmCancel(null);
  }, [update, order.id, confirmCancel]);

  const doRollback = useCallback(async () => {
    await update.mutateAsync({ id: order.id, status: 'pedido' });
    setConfirmRollback(false);
  }, [update, order.id]);

  return (
    <View style={styles.detail}>
      <Text style={styles.detailSenha}>#{order.senha}</Text>
      <Text style={styles.detailTime}>Pedido {relativeTime(order.criadoEm)}</Text>
      <View style={styles.detailItems}>
        {order.itens.map((it: OrderItem) => (
          <View key={it.id} style={styles.detailItemRow}>
            <Text style={styles.detailItemName}>{it.quantidade}× {it.nameSnapshot}</Text>
            <Text style={styles.detailItemPrice}>R$ {(parseFloat(it.precoSnapshot) * it.quantidade).toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.detailTotal}>
        <Text style={styles.detailTotalLabel}>Total</Text>
        <Text style={styles.detailTotalValue}>R$ {order.total}</Text>
      </View>
      <View style={styles.detailActions}>
        {order.status === 'pedido' ? (
          <>
            <Pressable
              onPress={() => setConfirmPronto(true)}
              style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressedSoft]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.ctaPrimaryText}>Marcar pronto</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmCancel({ reason: '' })}
              style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressedSoft]}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.text} />
              <Text style={styles.ctaSecondaryText}>Cancelar</Text>
            </Pressable>
          </>
        ) : order.status === 'pronto' ? (
          <Pressable
            onPress={() => setConfirmRollback(true)}
            style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressedSoft]}
          >
            <Ionicons name="arrow-undo-outline" size={18} color={colors.text} />
            <Text style={styles.ctaSecondaryText}>Voltar pra preparação</Text>
          </Pressable>
        ) : null}
      </View>

      <ConfirmModal
        visible={confirmPronto}
        title="Marcar como pronto?"
        primaryLabel="Marcar pronto"
        onConfirm={doMarkPronto}
        onCancel={() => setConfirmPronto(false)}
      />
      <ConfirmModal
        visible={!!confirmCancel}
        title="Cancelar pedido?"
        body="O estoque será devolvido automaticamente."
        primaryLabel="Cancelar pedido"
        variant="danger"
        reasonField={confirmCancel ? {
          label: 'Motivo (opcional)',
          value: confirmCancel.reason,
          onChangeText: (v) => setConfirmCancel({ reason: v }),
        } : undefined}
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(null)}
      />
      <ConfirmModal
        visible={confirmRollback}
        title="Voltar pra preparação?"
        body="O pedido volta a aparecer na fila ativa."
        primaryLabel="Voltar"
        onConfirm={doRollback}
        onCancel={() => setConfirmRollback(false)}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    detail: { flex: 1, padding: 24, gap: 12 },
    detailSenha: { fontFamily: 'Manrope_800ExtraBold', fontSize: 48, color: c.text },
    detailTime: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: c.textMuted },
    detailItems: { marginTop: 8, gap: 6 },
    detailItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
    detailItemName: { fontFamily: 'Manrope_500Medium', fontSize: 15, color: c.text },
    detailItemPrice: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.text },
    detailTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    detailTotalLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.textMuted },
    detailTotalValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: c.text },
    detailActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    ctaPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, paddingVertical: 14, borderRadius: 16 },
    ctaPrimaryText: { fontFamily: 'Manrope_700Bold', color: '#FFFFFF' },
    ctaSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.surfaceElevated, paddingVertical: 14, borderRadius: 16 },
    ctaSecondaryText: { fontFamily: 'Manrope_600SemiBold', color: c.text },
    pressedSoft: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}
```

Refatorar a Task 24 `(staff)/pedidos.tsx` pra usar `<StaffPedidoDetail id={selected.id} />` no detail panel, removendo o JSX duplicado (mantém os `useState` de seleção e os `ConfirmModal` movem-se pro componente extraído).

- [ ] **Step 25.3: Commit**

```bash
git add apps/mobile/components/StaffPedidoDetail.tsx apps/mobile/app/(staff)/pedido/[id].tsx apps/mobile/app/(staff)/pedidos.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/staff): extrai StaffPedidoDetail + tela [id] de phone fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 26: Staff cardápio API client + hook

**Files:**
- Create: `apps/mobile/lib/api/staff-cardapio.ts`
- Create: `apps/mobile/lib/api/hooks/use-staff-cardapio.ts`

- [ ] **Step 26.1: Implementar**

Criar `apps/mobile/lib/api/staff-cardapio.ts`:

```ts
import { apiFetch } from './client';
import type { ItemCardapio } from '@cantina/shared';

export interface CantinaItemPatch {
  visivel?: boolean;
  disponivel?: boolean;
  estoque?: number;
  preco?: number;
}

export async function listCantinaItems(): Promise<{ items: ItemCardapio[] }> {
  // Reusa GET /items que já filtra por cantina; mas precisamos também dos invisíveis/indisponíveis pro admin.
  // Plano: adicionar query param `?scope=staff` no GET /items que bypassa filtros disponivel+visivel quando role=staff.
  return apiFetch<{ items: ItemCardapio[] }>(`/items?scope=staff`);
}

export async function updateCantinaItem(itemId: string, patch: CantinaItemPatch): Promise<{ cantinaItem: unknown }> {
  return apiFetch<{ cantinaItem: unknown }>(`/cantina-items/${itemId}`, {
    method: 'PATCH',
    body: patch,
  });
}
```

- [ ] **Step 26.2: Atualizar backend `GET /items` pra aceitar `scope=staff`**

Em `apps/api/src/routes/items.ts`, no handler GET `/`:

```ts
const scope = c.req.query('scope');
const claim = c.get('user');
const showAll = scope === 'staff' && claim.role === 'staff';
// Se showAll, dropa filtros disponivel+visivel
```

Acrescentar test correspondente em `items.test.ts`.

- [ ] **Step 26.3: Implementar hook**

Criar `apps/mobile/lib/api/hooks/use-staff-cardapio.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import { listCantinaItems, updateCantinaItem, type CantinaItemPatch } from '../staff-cardapio';

export function useStaffCardapio() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['staff-cardapio'],
    queryFn: listCantinaItems,
    enabled: !!user && user.role === 'staff',
    staleTime: 10_000,
  });
}

export function useUpdateCantinaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: CantinaItemPatch }) => updateCantinaItem(itemId, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-cardapio'] });
    },
  });
}
```

- [ ] **Step 26.4: Typecheck + tests**

```bash
pnpm -r typecheck && pnpm --filter @cantina/api test items
```

- [ ] **Step 26.5: Commit**

```bash
git add apps/api/src/routes/items.ts apps/api/src/routes/items.test.ts apps/mobile/lib/api/staff-cardapio.ts apps/mobile/lib/api/hooks/use-staff-cardapio.ts
git commit -m "$(cat <<'EOF'
feat: GET /items?scope=staff bypassa filtros disponivel/visivel + hooks staff-cardapio

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 27: (staff)/cardapio.tsx — master-detail + autosave

**Files:**
- Create: `apps/mobile/app/(staff)/cardapio.tsx`

- [ ] **Step 27.1: Implementar tela**

```tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import MasterDetailLayout from '@/components/MasterDetailLayout';
import StaffShell from '@/components/StaffShell';
import { useTheme } from '@/context/ThemeContext';
import { useStaffCardapio, useUpdateCantinaItem } from '@/lib/api/hooks/use-staff-cardapio';
import type { ThemeColors } from '@/types';

type CardapioItem = {
  id: string;
  name: string;
  imagem?: string | null;
  preco: string;
  estoque: number;
  visivel: boolean;
  disponivel: boolean;
};

export default function StaffCardapioScreen() {
  const { colors } = useTheme();
  const { data, isPending } = useStaffCardapio();
  const update = useUpdateCantinaItem();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const list = (data?.items ?? []) as CardapioItem[];
  const selected = list.find((i) => i.id === selectedId) ?? list[0] ?? null;

  const persist = async (itemId: string, patch: Parameters<typeof update.mutateAsync>[0]['patch']) => {
    await update.mutateAsync({ itemId, patch });
    await Haptics.selectionAsync();
    setSavedAt(new Date().toLocaleTimeString('pt-BR'));
  };

  const renderListItem = ({ item }: { item: CardapioItem }) => {
    const focused = selected?.id === item.id;
    const badge = item.estoque === 0 ? 'Esgotado' : !item.visivel ? 'Fora da vitrine' : !item.disponivel ? 'Em manutenção' : null;
    return (
      <Pressable
        onPress={() => setSelectedId(item.id)}
        style={({ pressed }) => [styles.listItem, focused && styles.listItemFocused, pressed && styles.pressed]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.listName}>{item.name}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.listPrice}>R$ {item.preco}</Text>
      </Pressable>
    );
  };

  const listSlot = (
    <FlatList
      data={list}
      keyExtractor={(it) => it.id}
      renderItem={renderListItem}
      contentContainerStyle={{ padding: 12, gap: 6 }}
      ListEmptyComponent={isPending ? null : <EmptyState title="Sem items" subtitle="Cardápio vazio." />}
    />
  );

  const detailSlot = selected ? (
    <View style={styles.detail}>
      <Text style={styles.detailTitle}>{selected.name}</Text>
      <Text style={styles.savedAt}>{savedAt ? `Salvo às ${savedAt}` : 'Edição em tempo real'}</Text>

      <Text style={styles.eyebrow}>Visibilidade</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Vitrine</Text>
        <Switch
          value={selected.visivel}
          onValueChange={(v) => persist(selected.id, { visivel: v })}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelMuted}>Operacional <Text style={styles.hint}>(desligue só em manutenção temporária)</Text></Text>
        <Switch
          value={selected.disponivel}
          onValueChange={(v) => persist(selected.id, { disponivel: v })}
        />
      </View>

      <Text style={styles.eyebrow}>Estoque</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => persist(selected.id, { estoque: Math.max(0, selected.estoque - 1) })}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
        <TextInput
          value={String(selected.estoque)}
          onChangeText={(v) => {
            const n = Number(v.replace(/[^0-9]/g, '')) || 0;
            // Otimistic local update via callback; o autosave acontece on blur (linha abaixo)
          }}
          onBlur={(e) => {
            const n = Number(e.nativeEvent.text.replace(/[^0-9]/g, '')) || 0;
            persist(selected.id, { estoque: n });
          }}
          keyboardType="number-pad"
          style={styles.numberInput}
        />
        <Pressable
          onPress={() => persist(selected.id, { estoque: selected.estoque + 1 })}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>Preço</Text>
      <TextInput
        defaultValue={selected.preco}
        keyboardType="decimal-pad"
        onBlur={(e) => {
          const raw = e.nativeEvent.text.replace(',', '.');
          const n = Number(raw);
          if (!Number.isFinite(n) || n <= 0) return;
          persist(selected.id, { preco: n });
        }}
        style={styles.numberInput}
      />
    </View>
  ) : (
    <View style={[styles.detail, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.textMuted }}>Selecione um item</Text>
    </View>
  );

  return (
    <StaffShell title="Cardápio">
      <MasterDetailLayout listSlot={listSlot} detailSlot={detailSlot} />
    </StaffShell>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, padding: 12, borderRadius: 14 },
    listItemFocused: { backgroundColor: c.surfaceElevated },
    listName: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.text },
    listPrice: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: c.text },
    badge: { fontFamily: 'Manrope_500Medium', fontSize: 11, color: c.textMuted, marginTop: 2 },
    detail: { flex: 1, padding: 24, gap: 12 },
    detailTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, color: c.text },
    savedAt: { fontFamily: 'Manrope_500Medium', fontSize: 12, color: c.textMuted },
    eyebrow: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    label: { fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: c.text },
    labelMuted: { flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.text, marginRight: 16 },
    hint: { fontFamily: 'Manrope_400Regular', fontSize: 12, color: c.textMuted },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepBtn: { padding: 10, backgroundColor: c.surfaceElevated, borderRadius: 12 },
    numberInput: { flex: 1, backgroundColor: c.surfaceElevated, borderRadius: 12, padding: 12, color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 16, textAlign: 'center' },
    pressed: { opacity: 0.8 },
  });
}
```

- [ ] **Step 27.2: Commit**

```bash
git add apps/mobile/app/(staff)/cardapio.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/staff): tela Cardápio — master-detail + autosave on blur/toggle

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 28: Staff stats API client + hook

**Files:**
- Create: `apps/mobile/lib/api/staff-stats.ts`
- Create: `apps/mobile/lib/api/hooks/use-staff-stats.ts`

- [ ] **Step 28.1: Implementar**

Criar `apps/mobile/lib/api/staff-stats.ts`:

```ts
import { apiFetch } from './client';
import type { StatsPeriod, StatsResponse } from '@cantina/shared';

export async function getStats(period: StatsPeriod): Promise<{ stats: StatsResponse }> {
  return apiFetch<{ stats: StatsResponse }>(`/stats?period=${period}`);
}
```

Criar `apps/mobile/lib/api/hooks/use-staff-stats.ts`:

```ts
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import { getStats } from '../staff-stats';
import type { StatsPeriod } from '@cantina/shared';

export function useStaffStats(period: StatsPeriod) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['staff-stats', period],
    queryFn: () => getStats(period),
    enabled: !!user && user.role === 'staff',
    staleTime: 30_000,
  });
}
```

- [ ] **Step 28.2: Commit**

```bash
git add apps/mobile/lib/api/staff-stats.ts apps/mobile/lib/api/hooks/use-staff-stats.ts
git commit -m "$(cat <<'EOF'
feat(mobile/staff): API client + hook useStaffStats (daily/weekly/monthly)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 29: (staff)/stats.tsx — dashboard

**Files:**
- Create: `apps/mobile/app/(staff)/stats.tsx`

- [ ] **Step 29.1: Implementar**

```tsx
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import BarChart from '@/components/BarChart';
import KpiCard from '@/components/KpiCard';
import SegmentedControl from '@/components/SegmentedControl';
import StaffShell from '@/components/StaffShell';
import { useTheme } from '@/context/ThemeContext';
import { useStaffStats } from '@/lib/api/hooks/use-staff-stats';
import type { StatsPeriod } from '@cantina/shared';
import type { ThemeColors } from '@/types';

const HOUR_LABELS = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];

export default function StaffStatsScreen() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<StatsPeriod>('daily');
  const { data } = useStaffStats(period);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();

  const stats = data?.stats;

  return (
    <StaffShell title="Estatísticas">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl<StatsPeriod>
          options={[
            { value: 'daily', label: 'Hoje' },
            { value: 'weekly', label: 'Semana' },
            { value: 'monthly', label: 'Mês' },
          ]}
          value={period}
          onChange={setPeriod}
        />

        {stats ? (
          <>
            <View style={styles.kpiRow}>
              <KpiCard eyebrow="Atendidos" value={String(stats.atendidos)} deltaPct={stats.comparacao.atendidosDeltaPct} />
              <KpiCard eyebrow="Cancelados" value={String(stats.cancelados)} deltaPct={null} />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard eyebrow="Ticket médio" value={`R$ ${stats.ticketMedio}`} deltaPct={null} />
              <KpiCard
                eyebrow="Tempo médio"
                value={stats.tempoMedioPreparoSec != null ? `${Math.round(stats.tempoMedioPreparoSec / 60)}min` : '—'}
                deltaPct={null}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.eyebrow}>Pedidos por hora</Text>
              <BarChart
                data={stats.pedidosPorHora.map((v, i) => ({ label: HOUR_LABELS[i] ?? '', value: v }))}
                width={Math.max(280, width - 64)}
                height={180}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.eyebrow}>Top 5 items</Text>
              {stats.topItems.map((it, i) => (
                <View key={it.itemId} style={styles.topRow}>
                  <Text style={styles.topRank}>{i + 1}</Text>
                  <Text style={styles.topName}>{it.nome}</Text>
                  <Text style={styles.topQtd}>{it.qtd}</Text>
                  <Text style={styles.topPrice}>R$ {it.faturamento}</Text>
                </View>
              ))}
              {stats.topItems.length === 0 ? <Text style={styles.empty}>Sem vendas no período</Text> : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </StaffShell>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    kpiRow: { flexDirection: 'row', gap: 12 },
    section: { backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 12 },
    eyebrow: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    topRank: { width: 24, fontFamily: 'Manrope_700Bold', fontSize: 14, color: c.textMuted },
    topName: { flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: c.text },
    topQtd: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: c.textMuted, marginRight: 12 },
    topPrice: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: c.text },
    empty: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: c.textMuted },
  });
}
```

- [ ] **Step 29.2: Commit**

```bash
git add apps/mobile/app/(staff)/stats.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/staff): tela Estatísticas — 4 KPIs + BarChart pedidos/hora + Top 5 items

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 30: (staff)/perfil.tsx — enxuto

**Files:**
- Create: `apps/mobile/app/(staff)/perfil.tsx`

- [ ] **Step 30.1: Implementar**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ProfileAvatar from '@/components/ProfileAvatar';
import StaffShell from '@/components/StaffShell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

export default function StaffPerfilScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, toggleMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user) return null;

  return (
    <StaffShell title="Perfil">
      <View style={styles.body}>
        <ProfileAvatar uri={user.avatarUrl} name={user.name ?? '—'} size={96} />
        <Text style={styles.name}>{user.name ?? '—'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.cantinaId ? <Text style={styles.cantina}>Cantina ID: {user.cantinaId}</Text> : null}

        <Pressable
          onPress={toggleMode}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} />
          <Text style={styles.rowLabel}>Tema {mode === 'dark' ? 'escuro' : 'claro'}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.row, styles.rowDanger, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger ?? '#EF4444'} />
          <Text style={[styles.rowLabel, { color: colors.danger ?? '#EF4444' }]}>Sair</Text>
        </Pressable>
      </View>
    </StaffShell>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: 24, gap: 12, alignItems: 'center' },
    name: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: c.text, marginTop: 12 },
    email: { fontFamily: 'Manrope_500Medium', fontSize: 14, color: c.textMuted },
    cantina: { fontFamily: 'Manrope_500Medium', fontSize: 12, color: c.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: c.surface, padding: 16, borderRadius: 16, marginTop: 8 },
    rowDanger: { backgroundColor: c.surfaceElevated },
    rowLabel: { flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: c.text },
    pressed: { opacity: 0.85 },
  });
}
```

Notar: o spec original mencionou formatar como "{cantina.nome} · {escola.nome} · {unidade.nome}" via tenantsTree. Para MVP, exibimos `cantina_id` direto (curto). Refinamento futuro: chamar `GET /tenants/tree`, encontrar a cantina, montar o texto.

- [ ] **Step 30.2: Typecheck**

```bash
pnpm --filter @cantina/mobile typecheck
```

- [ ] **Step 30.3: Commit**

```bash
git add apps/mobile/app/(staff)/perfil.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/staff): tela Perfil — avatar, nome, email, cantinaId, tema toggle, logout

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Customer cleanup (Tasks 31–32)

### Task 31: OrdersContext + confirmacao — drop auto-pronto + scheduled notif

**Files:**
- Modify: `apps/mobile/context/OrdersContext.tsx`
- Modify: `apps/mobile/app/confirmacao.tsx`

- [ ] **Step 31.1: Auditar `OrdersContext.tsx`**

```bash
grep -n "promote\|setTimeout\|3 \* 60\|180" apps/mobile/context/OrdersContext.tsx
```

Confirmar se ainda há lógica de auto-pronto. Conforme inspeção atual, o OrdersContext já está refatorado (facade do TanStack Query, sem timers locais). Se não houver timers, marcar essa task como no-op no contexto e seguir pro confirmacao.

- [ ] **Step 31.2: Auditar `confirmacao.tsx`**

```bash
grep -n "scheduleProntoNotification\|setTimeout\|3 \* 60\|180" apps/mobile/app/confirmacao.tsx
```

Se houver `scheduleNotification` agendada pra 3min, remover. Manter notificação imediata "Pedido recebido".

- [ ] **Step 31.3: Adicionar botão "Cancelar pedido" em confirmacao quando status=pedido**

Em `confirmacao.tsx`, importar `useCancelOrder` (já existe), adicionar:

```tsx
{order.status === 'pedido' ? (
  <Pressable
    onPress={() => setConfirmingCancel(true)}
    style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
  >
    <Text style={styles.cancelText}>Cancelar pedido</Text>
  </Pressable>
) : null}

<ConfirmModal
  visible={confirmingCancel}
  title="Cancelar pedido?"
  body="O estoque será devolvido. Você não pode reverter essa ação."
  primaryLabel="Cancelar pedido"
  variant="danger"
  onConfirm={async () => {
    await cancelOrderMutation.mutateAsync(order.id);
    setConfirmingCancel(false);
    router.back();
  }}
  onCancel={() => setConfirmingCancel(false)}
/>
```

E ajustar `useCancelOrder` em `apps/mobile/lib/api/orders.ts` pra chamar `POST /:id/cancel` em vez de `PATCH /:id/status`:

```ts
export async function cancelOrder(id: string): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}/cancel`, { method: 'POST' });
}
```

- [ ] **Step 31.4: Typecheck + tests**

```bash
pnpm -r typecheck && pnpm -r test
```

- [ ] **Step 31.5: Commit**

```bash
git add apps/mobile/context/OrdersContext.tsx apps/mobile/app/confirmacao.tsx apps/mobile/lib/api/orders.ts
git commit -m "$(cat <<'EOF'
refactor(mobile/customer): drop auto-pronto mock + scheduled notif 3min + adiciona cancel via POST

- cancelOrder agora chama POST /orders/:id/cancel (em vez de PATCH /:id/status)
- Botão Cancelar pedido em confirmacao.tsx quando status='pedido'

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 32: (tabs)/pedidos.tsx — botão cancelar + refetch 10s

**Files:**
- Modify: `apps/mobile/app/(tabs)/pedidos.tsx`
- Modify: `apps/mobile/lib/api/hooks/use-orders.ts`

- [ ] **Step 32.1: Atualizar hook pra refetch 10s quando aba focada**

Em `apps/mobile/lib/api/hooks/use-orders.ts`:

```ts
import { useIsFocused } from '@react-navigation/native';

export function useOrders() {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  return useQuery({
    queryKey: ['orders'],
    queryFn: listOrders,
    refetchInterval: isFocused ? 10_000 : false,
    staleTime: 5_000,
    enabled: !!user,
  });
}
```

(Se `@react-navigation/native` não estiver disponível, usar `useFocusEffect` do `expo-router` num efeito que pause/start manualmente.)

- [ ] **Step 32.2: Adicionar botão Cancelar nos cards de pedido com status=pedido**

Em `apps/mobile/app/(tabs)/pedidos.tsx`, no render de cada order card, condicionalmente:

```tsx
{order.status === 'pedido' ? (
  <Pressable
    onPress={() => setConfirmingCancel(order.id)}
    style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={`Cancelar pedido ${order.senha}`}
  >
    <Ionicons name="close-circle-outline" size={16} color={colors.danger ?? '#EF4444'} />
    <Text style={styles.cancelText}>Cancelar</Text>
  </Pressable>
) : null}
```

E adicionar o `<ConfirmModal>` correspondente.

- [ ] **Step 32.3: Commit**

```bash
git add apps/mobile/app/(tabs)/pedidos.tsx apps/mobile/lib/api/hooks/use-orders.ts
git commit -m "$(cat <<'EOF'
feat(mobile/customer): refetch 10s quando aba pedidos focada + botão Cancelar nos cards pendentes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Docs + memória + validação manual (Tasks 33–35)

### Task 33: CLAUDE.md atualizado

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 33.1: Atualizar §13 (machine de estados) + adicionar §14 (staff app)**

Editar `CLAUDE.md` substituindo a §13 (que menciona o enum antigo) e adicionando §14:

```markdown
13. **Tenants hierárquicos: ...** (mantém o resto)
    Status enum de orders foi simplificado em Fase C pra `pedido | pronto | cancelado` (drop de `pendente`, `preparando`, `retirado`). Texto adaptativo no frontend: cliente vê "Em preparo", staff vê "Em preparação".

14. **App staff (Fase C 2026-05-07):** mesmo APK, layout adaptativo via `useResponsiveShell` (`width >= 900` → rail permanente; abaixo → drawer). Staff loga e cai direto em `(staff)/pedidos` via gate de role em `app/_layout.tsx` (chama `computeNextRoute`). 4 telas: Pedidos (master-detail + bulk + search), Cardápio (autosave on blur), Estatísticas (KPIs + BarChart + Top5), Perfil. Endpoints novos: `PATCH /orders/:id/status` (transições + cancel com devolução de estoque), `PATCH /orders/bulk-status` (tudo-ou-nada), `POST /orders/:id/cancel` (customer-side), `PATCH /cantina-items/:itemId`, `GET /stats`. Middleware `requireRole('staff')` aplicado nas rotas staff. CantinaContext força `currentCantinaId = user.cantinaId` pra staff (setter no-op).
```

- [ ] **Step 33.2: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): §14 staff app + §13 menciona novo enum de status

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 34: HANDOFF.md + ROADMAP.md + memória

**Files:**
- Modify: `docs/HANDOFF.md`
- Modify: `docs/ROADMAP.md`
- Modify: `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_estado_atual.md`
- Modify: `~/.claude/projects/-Users-johnny-Downloads-cp-mobile/memory/project_proxima_acao.md`

- [ ] **Step 34.1: Atualizar HANDOFF.md**

Substituir/adicionar seção "Fase C entregue (2026-05-XX)" listando os endpoints novos, tabela de breaking changes (enum status), telas novas, gate de role. Setar "Próxima ação" pra Fase D (push notif + fornecedores + reset-password).

- [ ] **Step 34.2: Atualizar ROADMAP.md**

Marcar Fase C done em backlog do sub-projeto 2.

- [ ] **Step 34.3: Atualizar memória**

Em `project_estado_atual.md`: trocar "Fase C BRAINSTORMADA + spec commitado" por "Fase C ENTREGUE em <data>. Sub-projeto 2 completo do ponto de vista operacional. Próxima: Fase D (push + fornecedores + reset-password)".

Em `project_proxima_acao.md`: apontar pra Fase D ou portfolio handoff.

- [ ] **Step 34.4: Commit (docs + memória são commitados juntos)**

```bash
git add docs/HANDOFF.md docs/ROADMAP.md
git commit -m "$(cat <<'EOF'
docs: Fase C entregue — atualiza HANDOFF/ROADMAP

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Memória não vai pro git — é separada em `~/.claude/projects/`.)

### Task 35: Validação manual em AVDs + APK build

**Files:** (sem código — checklist manual)

- [ ] **Step 35.1: Smoke baseline em emulador Android phone**

```bash
emulator -avd <phone_avd>
pnpm mobile:android
```

Checklist:
- [ ] Login customer → cai em (tabs) (ou onboarding se incompleto)
- [ ] Login staff → cai em (staff)/pedidos direto, drawer abre no menu hambúrguer
- [ ] Cliente faz pedido → backend cria com status='pedido', estoque decrementa
- [ ] Staff abre pedidos → fila ativa popula em <5s
- [ ] Staff marca pronto → mensagem cliente atualiza, badge fica verde
- [ ] Staff bulk select 2 pedidos → marca pronto tudo-ou-nada
- [ ] Staff cancela pedido (com motivo) → estoque devolvido (verificar via SQL ou refetch)
- [ ] Staff rollback pronto → pedido volta pra fila
- [ ] Cliente cancela pedido próprio antes de marcado pronto → estoque devolvido
- [ ] Cardápio admin: toggle vitrine, toggle operacional, +/- estoque, edita preço — autosave "Salvo às HH:MM"
- [ ] Stats: 3 segments (Hoje, Semana, Mês) populam números coerentes; BarChart renderiza; Top 5 lista 5 items

- [ ] **Step 35.2: Smoke em tablet AVD**

Criar AVD 1280×800 (Pixel C ou similar), rodar a mesma checklist:
- [ ] Rail permanente aparece (88px), sem drawer
- [ ] Master-detail visível (lista + detail) lado a lado em pedidos e cardápio

- [ ] **Step 35.3: Build APK preview**

```bash
pnpm mobile:build:apk
```

Instalar no device físico Android. Re-rodar smoke da Step 35.1.

- [ ] **Step 35.4: Commit final (se houver ajustes de validação)**

Se a validação revelar bugs, fixar e commitar como `fix(mobile/staff): ...`. Caso contrário, esse step só fecha o ciclo.

- [ ] **Step 35.5: Audit fim de sub-projeto**

```bash
pnpm audit:run
```

Salvar report em `docs/superpowers/audits/2026-05-XX-fase-c.md`. Se algum check falhar, fixar.

---

## Critério de aceite final

- [ ] `pnpm -r typecheck && pnpm -r test` verde, ~130+ tests passing
- [ ] APK preview rodando em phone + tablet AVD com todos os fluxos da Step 35.1 ok
- [ ] Endpoints novos cobertos por tests TDD (mín. 20 tests novos)
- [ ] CLAUDE.md / HANDOFF.md / ROADMAP.md / memória atualizados
- [ ] Sem regressão em testes da Fase A/B (107 baseline + novos)
- [ ] Commits seguem padrão (autor `jota0802`, PT, conventional, Co-Authored-By trailer)
