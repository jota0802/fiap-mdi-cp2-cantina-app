import { Hono } from 'hono';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { CreateOrderSchema, UpdateOrderStatusSchema, type Order as OrderDto, type OrderItemDto } from '@cantina/shared';
import { orders, orderItems, items, cantinaItems } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant-context.js';
import { notFound, badRequest, forbidden, conflict } from '../lib/errors.js';
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
    // Trust DB writes: CHECK orders_status_validos garante valores válidos.
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

// Aceita DB outer ou tx de transação (estruturalmente compatíveis em drizzle).
type DbOrTx = Pick<DB | TestDb, 'select' | 'insert' | 'update' | 'delete'>;

async function nextSenha(db: DbOrTx, cantinaId: string): Promise<number> {
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
  app.use('*', tenantContext(db));

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
    const cantinaId = c.var.cantina.id;
    const { itens } = c.req.valid('json');

    if (itens.length === 0) throw badRequest('Carrinho vazio');

    const orderId = createId();
    const orderItemRows: typeof orderItems.$inferInsert[] = [];
    let total = 0;
    let senha = 0;
    let prontoEmEstimado = new Date();

    await db.transaction(async (tx) => {
      // 1. Decrementa estoque atomicamente pra cada item
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

        // Decrementa atomicamente — race-safe (UPDATE ... WHERE estoque >= qtd)
        const result = await tx.update(cantinaItems)
          .set({ estoque: sql`${cantinaItems.estoque} - ${reqItem.quantidade}` })
          .where(and(
            eq(cantinaItems.cantinaId, cantinaId),
            eq(cantinaItems.itemId, reqItem.itemId),
            gte(cantinaItems.estoque, reqItem.quantidade),
          ))
          .returning();

        if (result.length === 0) {
          throw conflict(`Estoque insuficiente para ${reqItem.itemId}`);
        }

        // Busca item details pro snapshot
        const [item] = await tx.select().from(items).where(eq(items.id, reqItem.itemId)).limit(1);
        if (!item) throw notFound('Item not found');

        const subtotal = parseFloat(ci.preco) * reqItem.quantidade;
        total += subtotal;

        orderItemRows.push({
          id: createId(),
          orderId,
          itemId: item.id,
          nameSnapshot: item.name,
          precoSnapshot: ci.preco, // cantina_items.preco — NÃO items.preco
          quantidade: reqItem.quantidade,
          observacoes: reqItem.observacoes ?? null,
        });
      }

      // 2. Calcular estimativa baseada em pendentes da cantina
      const pendingResult = await tx.select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(eq(orders.cantinaId, cantinaId), eq(orders.status, 'pedido')));
      const pendingCount = Number(pendingResult[0]?.count ?? 0);
      const estimadoSec = calcularEstimativa(pendingCount);
      prontoEmEstimado = new Date(Date.now() + estimadoSec * 1000);

      // 3. Senha real (per-cantina, per-day)
      senha = await nextSenha(tx, cantinaId);

      // 4. Insert order (cantina_id real)
      await tx.insert(orders).values({
        id: orderId,
        userId: claim.sub,
        cantinaId,
        status: 'pedido',
        total: total.toFixed(2),
        senha,
        prontoEmEstimado,
      });

      // 5. Insert order_items
      await tx.insert(orderItems).values(orderItemRows);
    });

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
    if (order.status !== 'pedido') throw badRequest('Só pedidos pendentes podem ser cancelados');

    await db.update(orders).set({
      status,
      ...(status === 'cancelado' ? { canceladoEm: new Date(), canceledBy: 'customer' } : {}),
    }).where(eq(orders.id, id));
    const enriched = await fetchOrderWithItems(db, id);
    return c.json({ order: enriched }, 200);
  });

  return app;
}
