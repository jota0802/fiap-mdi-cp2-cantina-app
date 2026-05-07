import { Hono } from 'hono';
import { eq, and, sql, gte, desc, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { CreateOrderSchema, UpdateOrderStatusSchema, type Order as OrderDto, type OrderItemDto } from '@cantina/shared';
import { orders, orderItems, items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, badRequest, forbidden } from '../lib/errors.js';
import { calcularEstimativa } from '../lib/estimativa.js';
import { validateJson } from '../lib/zod-hono.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

function toPublicOrderItem(oi: typeof orderItems.$inferSelect): OrderItemDto {
  return {
    id: oi.id,
    itemId: oi.itemId,
    nameSnapshot: oi.nameSnapshot,
    precoSnapshot: oi.precoSnapshot,
    quantidade: oi.quantidade,
    observacoes: oi.observacoes,
  };
}

function toPublicOrder(o: typeof orders.$inferSelect, itens: typeof orderItems.$inferSelect[]): OrderDto {
  return {
    id: o.id,
    userId: o.userId,
    // Trust DB writes: no CHECK constraint on status, but writers are typed via CreateOrderSchema/UpdateOrderStatusSchema
    status: o.status as OrderDto['status'],
    total: o.total,
    senha: o.senha,
    prontoEmEstimado: o.prontoEmEstimado?.toISOString() ?? null,
    prontoEm: o.prontoEm?.toISOString() ?? null,
    retiradoEm: o.retiradoEm?.toISOString() ?? null,
    canceladoEm: o.canceladoEm?.toISOString() ?? null,
    criadoEm: o.criadoEm.toISOString(),
    itens: itens.map(toPublicOrderItem),
  };
}

async function nextSenha(db: DB | TestDb, cantinaId: string): Promise<number> {
  // Per-day senha reset uses UTC midnight (not cantina-local timezone). Acceptable
  // trade-off: senhas restart ~21:00 BRT in summer / 21:00 BRT year-round, but stay
  // unique within a UTC day. Future: derive timezone from cantinaId in Fase B.
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(and(
      eq(orders.cantinaId, cantinaId),
      gte(orders.criadoEm, startOfDay),
    ));
  return Number(result[0]?.count ?? 0) + 1;
}

async function fetchOrderWithItems(db: DB | TestDb, orderId: string): Promise<OrderDto | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  const itens = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return toPublicOrder(order, itens);
}

export function createOrdersRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const claim = c.get('user');
    const list = await db.select().from(orders).where(eq(orders.userId, claim.sub)).orderBy(desc(orders.criadoEm));
    const enriched = await Promise.all(list.map((o) => fetchOrderWithItems(db, o.id)));
    return c.json({ orders: enriched.filter((o): o is OrderDto => o !== null) }, 200);
  });

  app.get('/:id', async (c) => {
    const claim = c.get('user');
    const id = c.req.param('id');
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || order.userId !== claim.sub) throw notFound('Order not found');
    const enriched = await fetchOrderWithItems(db, id);
    return c.json({ order: enriched }, 200);
  });

  app.post('/', validateJson(CreateOrderSchema), async (c) => {
    const claim = c.get('user');
    const { itens } = c.req.valid('json');

    const itemIds = itens.map((i) => i.itemId);
    const dbItems = await db.select().from(items).where(inArray(items.id, itemIds));
    if (dbItems.length !== new Set(itemIds).size) throw notFound('Item(s) not found');

    const itemMap = new Map(dbItems.map((i) => [i.id, i]));
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
        // nameSnapshot uses `item.name` (raw, always notNull) — nameKey is nullable
        // post-commit 884d1e4. Future i18n on order history reuses `name` directly (PT).
        nameSnapshot: item.name,
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

    // TODO(Task 2): validate cantinaId via tenant-context middleware; reject if missing
    const cantinaId = c.req.header('x-cantina-id') ?? 'unknown';
    const senha = await nextSenha(db, cantinaId);

    await db.insert(orders).values({
      id: orderId,
      userId: claim.sub,
      cantinaId,
      status: 'pendente',
      total: total.toFixed(2),
      senha,
      prontoEmEstimado,
    });
    await db.insert(orderItems).values(orderItemRows);

    const enriched = await fetchOrderWithItems(db, orderId);
    return c.json({ order: enriched }, 201);
  });

  app.patch('/:id/status', validateJson(UpdateOrderStatusSchema), async (c) => {
    const claim = c.get('user');
    const id = c.req.param('id');
    const { status } = c.req.valid('json');

    // Defense-in-depth: customer so pode cancelar. Quando o sub-projeto 2 (admin)
    // ampliar UpdateOrderStatusSchema pra aceitar 'pronto'/'retirado', staff usa
    // outro endpoint protegido por requireRole — esse aqui continua so cancel.
    if (status !== 'cancelado') throw forbidden('Customer só pode cancelar o próprio pedido');

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || order.userId !== claim.sub) throw notFound('Order not found');
    if (order.status !== 'pendente') throw badRequest('Só pedidos pendentes podem ser cancelados');

    await db.update(orders).set({
      status,
      ...(status === 'cancelado' ? { canceladoEm: new Date() } : {}),
    }).where(eq(orders.id, id));
    const enriched = await fetchOrderWithItems(db, id);
    return c.json({ order: enriched }, 200);
  });

  return app;
}
