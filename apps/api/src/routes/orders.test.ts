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
    expect(json.order.status).toBe('pendente');
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

describe('PATCH /orders/:id/status', () => {
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
