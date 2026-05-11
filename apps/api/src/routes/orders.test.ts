import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createOrdersRoutes } from './orders.js';
import { createTestUser, createTestTenants, createTestCantinaItems } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;
let token: string;
let userId: string;
let cantinaId: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/orders', createOrdersRoutes(testDb));
  app.onError(errorHandler);

  const tenants = await createTestTenants(testDb);
  cantinaId = tenants.cantinaId;

  const u = await createTestUser(testDb, { cantinaId });
  token = u.token;
  userId = u.user.id;
});

afterEach(async () => { await close(); });

const headers = (tk: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${tk}`,
  'X-Cantina-Id': cantinaId,
});

describe('POST /orders', () => {
  it('rejeita sem header X-Cantina-Id (400)', async () => {
    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: [{ itemId: 'x', quantidade: 1 }] }),
    });
    expect(res.status).toBe(400);
  });

  it('cria pedido com itens e calcula total', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '10.00', estoque: 10 },
      { slug: 'b', name: 'B', preco: '5.50', estoque: 10 },
    ]);
    const a = created[0]!.item;
    const b = created[1]!.item;

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [
        { itemId: a.id, quantidade: 2 },
        { itemId: b.id, quantidade: 1, observacoes: 'sem cebola' },
      ]}),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { order: { status: string; total: string; itens: Array<{ quantidade: number; observacoes: string | null }>; senha: number } };
    expect(json.order.status).toBe('pedido');
    expect(parseFloat(json.order.total)).toBe(25.50);
    expect(json.order.itens).toHaveLength(2);
    expect(json.order.senha).toBeGreaterThan(0);
  });

  it('rejeita item inexistente com 404 ou 422', async () => {
    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId: 'nope', quantidade: 1 }] }),
    });
    expect([404, 422]).toContain(res.status);
  });

  it('rejeita carrinho vazio', async () => {
    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [] }),
    });
    expect(res.status).toBe(422);
  });
});

describe('POST /orders — concorrência e estoque', () => {
  it('decrementa estoque atomicamente; 2 orders paralelos pro último item: 1 ok + 1 conflict', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 1 },
    ]);
    const itemId = created[0]!.item.id;

    const u1 = await createTestUser(testDb, { email: 'u1@t.com', cantinaId });
    const u2 = await createTestUser(testDb, { email: 'u2@t.com', cantinaId });

    const requests = [
      app.request('/api/v1/orders', {
        method: 'POST',
        headers: headers(u1.token),
        body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
      }),
      app.request('/api/v1/orders', {
        method: 'POST',
        headers: headers(u2.token),
        body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
      }),
    ];

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
  });

  it('rejeita order com estoque insuficiente (409)', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 2 },
    ]);
    const itemId = created[0]!.item.id;

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 5 }] }),
    });
    expect(res.status).toBe(409);
  });

  it('precoSnapshot vem de cantina_items.preco (não items.preco)', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'cafe', name: 'Café', preco: '4.20', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 2 }] }),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { order: { total: string; itens: Array<{ precoSnapshot: string }> } };
    expect(json.order.total).toBe('8.40');
    expect(json.order.itens[0]?.precoSnapshot).toBe('4.20');
  });
});

describe('GET /orders', () => {
  it('lista apenas pedidos do usuario', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });

    const res = await app.request('/api/v1/orders', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { orders: Array<{ userId: string }> };
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0]?.userId).toBe(userId);
  });
});

describe('GET /orders/:id', () => {
  it('retorna pedido com itens', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });
    const createdOrder = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${createdOrder.order.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
  });

  it('404 pra pedido de outro usuario', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });
    const createdOrder = await create.json() as { order: { id: string } };

    const other = await createTestUser(testDb, { email: 'other@x.com', cantinaId });
    const res = await app.request(`/api/v1/orders/${createdOrder.order.id}`, {
      headers: { Authorization: `Bearer ${other.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(404);
  });
});

// Legacy: customer cancelava via PATCH /orders/:id/status. Na Fase C, esse
// endpoint virou staff-only (Task 5) e customer ganhou POST /orders/:id/cancel
// (Task 7). Tests legados ficam skipped pra documentação.
describe.skip('PATCH /orders/:id/status — customer (legacy, substituído por POST /:id/cancel)', () => {
  it('cliente cancela pedido pendente', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });
    const createdOrder = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${createdOrder.order.id}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ status: 'cancelado' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { order: { status: string; canceladoEm: string | null } };
    expect(json.order.status).toBe('cancelado');
    expect(json.order.canceladoEm).toBeTruthy();
  });

  it('rejeita cancelar pedido de outro usuario com 404 (nao 400)', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });
    const createdOrder = await create.json() as { order: { id: string } };

    const other = await createTestUser(testDb, { email: 'other@x.com', cantinaId });
    const res = await app.request(`/api/v1/orders/${createdOrder.order.id}/status`, {
      method: 'PATCH',
      headers: headers(other.token),
      body: JSON.stringify({ status: 'cancelado' }),
    });
    expect(res.status).toBe(404); // não 400, pra não vazar existência
  });

  it('rejeita cancelar pedido ja cancelado com 400', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'a', name: 'A', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created[0]!.item.id;

    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });
    const createdOrder = await create.json() as { order: { id: string } };

    // primeiro cancel — sucesso
    await app.request(`/api/v1/orders/${createdOrder.order.id}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ status: 'cancelado' }),
    });

    // segundo cancel — deve dar 400
    const res = await app.request(`/api/v1/orders/${createdOrder.order.id}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ status: 'cancelado' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /orders/:id/status (staff)', () => {
  let staffToken: string;
  let customerToken: string;
  let customerId: string;

  beforeEach(async () => {
    const staff = await createTestUser(testDb, { role: 'staff', cantinaId, name: 'Staff', email: `staff-${Date.now()}@x.com` });
    staffToken = staff.token;
    customerToken = token;
    customerId = userId;
  });

  it('staff marca pedido → pronto', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'sa', name: 'SA', preco: '5.00', estoque: 10 },
    ]);
    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId: created.itemId, quantidade: 1 }] }),
    });
    const co = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { order: { status: string; prontoEm: string | null } };
    expect(body.order.status).toBe('pronto');
    expect(body.order.prontoEm).toBeTruthy();
  });

  it('staff cancela pedido → estoque devolvido', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'sb', name: 'SB', preco: '5.00', estoque: 10 },
    ]);
    const itemId = created.itemId;
    const cantinaItem = created[0]!.cantinaItem;

    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 3 }] }),
    });
    expect(create.status).toBe(201);

    // Estoque foi de 10 → 7 após o POST
    const { cantinaItems } = await import('../db/schema.js');
    const { and, eq } = await import('drizzle-orm');
    const [postPost] = await testDb.select().from(cantinaItems)
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));
    expect(postPost!.estoque).toBe(7);

    const co = await create.json() as { order: { id: string } };
    const res = await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'cancelado', reason: 'teste' }),
    });
    expect(res.status).toBe(200);

    const [postCancel] = await testDb.select().from(cantinaItems)
      .where(and(eq(cantinaItems.cantinaId, cantinaId), eq(cantinaItems.itemId, itemId)));
    expect(postCancel!.estoque).toBe(10);
  });

  it('staff faz rollback pronto → pedido', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'sc', name: 'SC', preco: '5.00', estoque: 10 },
    ]);
    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId: created.itemId, quantidade: 1 }] }),
    });
    const co = await create.json() as { order: { id: string } };

    await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'pronto' }),
    });

    const res = await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'pedido' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { order: { status: string; prontoEm: string | null } };
    expect(body.order.status).toBe('pedido');
    expect(body.order.prontoEm).toBeNull();
  });

  it('rejeita customer (403)', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'sd', name: 'SD', preco: '5.00', estoque: 10 },
    ]);
    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId: created.itemId, quantidade: 1 }] }),
    });
    const co = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(customerToken),
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(403);
  });

  it('rejeita transição inválida cancelado → pronto (409)', async () => {
    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'se', name: 'SE', preco: '5.00', estoque: 10 },
    ]);
    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId: created.itemId, quantidade: 1 }] }),
    });
    const co = await create.json() as { order: { id: string } };

    await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'cancelado' }),
    });

    const res = await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(409);
  });

  it('staff de outra cantina nao pode mudar pedido (403)', async () => {
    const otherTenants = await createTestTenants(testDb, { unidadeId: 'u2', escolaId: 'e2', cantinaId: 'cB' });
    const otherStaff = await createTestUser(testDb, {
      role: 'staff', cantinaId: 'cB', name: 'Staff B', email: `staffb-${Date.now()}@x.com`,
    });

    const created = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'sf', name: 'SF', preco: '5.00', estoque: 10 },
    ]);
    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId: created.itemId, quantidade: 1 }] }),
    });
    const co = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${co.order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherStaff.token}`,
        'X-Cantina-Id': 'cB',
      },
      body: JSON.stringify({ status: 'pronto' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /orders/bulk-status (staff)', () => {
  let staffToken: string;
  let customerToken: string;

  beforeEach(async () => {
    const staff = await createTestUser(testDb, { role: 'staff', cantinaId, name: 'Staff', email: `staff-bulk-${Date.now()}@x.com` });
    staffToken = staff.token;
    customerToken = token;
  });

  async function createPedido(itemId: string): Promise<string> {
    const create = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ itens: [{ itemId, quantidade: 1 }] }),
    });
    const co = await create.json() as { order: { id: string } };
    return co.order.id;
  }

  it('marca 3 pedidos pendentes como pronto numa só chamada', async () => {
    const cis = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'b1', name: 'B1', preco: '5.00', estoque: 10 },
    ]);
    const id1 = await createPedido(cis.itemId);
    const id2 = await createPedido(cis.itemId);
    const id3 = await createPedido(cis.itemId);

    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ ids: [id1, id2, id3], status: 'pronto' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { updated: string[] };
    expect(body.updated).toEqual(expect.arrayContaining([id1, id2, id3]));
  });

  it('rejeita tudo se ao menos 1 id já não está em pedido (409 com failedIds)', async () => {
    const cis = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'b2', name: 'B2', preco: '5.00', estoque: 10 },
    ]);
    const id1 = await createPedido(cis.itemId);
    const id2 = await createPedido(cis.itemId);
    // Marca id2 como pronto antes
    await app.request(`/api/v1/orders/${id2}/status`, {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ status: 'pronto' }),
    });

    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ ids: [id1, id2], status: 'pronto' }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { details?: { failedIds?: string[] } } };
    expect(body.error.details?.failedIds).toContain(id2);

    const { orders } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');
    const [r1] = await testDb.select().from(orders).where(eq(orders.id, id1));
    expect(r1!.status).toBe('pedido');
  });

  it('rejeita customer (403)', async () => {
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: headers(customerToken),
      body: JSON.stringify({ ids: ['x'], status: 'pronto' }),
    });
    expect(res.status).toBe(403);
  });

  it('valida body — array vazio retorna 422', async () => {
    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ ids: [], status: 'pronto' }),
    });
    expect(res.status).toBe(422);
  });

  it('rejeita ids de outra cantina', async () => {
    await createTestTenants(testDb, { unidadeId: 'u3', escolaId: 'e3', cantinaId: 'cZ' });
    const cisLocal = await createTestCantinaItems(testDb, cantinaId, [
      { slug: 'b3', name: 'B3', preco: '5.00', estoque: 10 },
    ]);
    const id1 = await createPedido(cisLocal.itemId);

    // Cria pedido na cantina Z (insert direto pra não usar tenant context customer)
    const { createTestOrder } = await import('../test/fixtures.js');
    const { orderId: foreignId } = await createTestOrder(testDb, {
      userId, cantinaId: 'cZ', status: 'pedido',
    });

    const res = await app.request('/api/v1/orders/bulk-status', {
      method: 'PATCH',
      headers: headers(staffToken),
      body: JSON.stringify({ ids: [id1, foreignId], status: 'pronto' }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { details?: { failedIds?: string[] } } };
    expect(body.error.details?.failedIds).toContain(foreignId);
  });
});
