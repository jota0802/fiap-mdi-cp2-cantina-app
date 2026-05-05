import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createOrdersRoutes } from './orders.js';
import { createTestUser, createTestItem } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb; let close: () => Promise<void>; let app: Hono; let token: string; let userId: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/orders', createOrdersRoutes(testDb));
  app.onError(errorHandler);
  const u = await createTestUser(testDb);
  token = u.token;
  userId = u.user.id;
});

afterEach(async () => { await close(); });

describe('POST /orders', () => {
  it('cria pedido com itens e calcula total', async () => {
    const a = await createTestItem(testDb, { preco: '10.00' });
    const b = await createTestItem(testDb, { preco: '5.50' });

    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: [{ itemId: 'nope', quantidade: 1 }] }),
    });
    expect([404, 422]).toContain(res.status);
  });

  it('rejeita carrinho vazio', async () => {
    const res = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: [] }),
    });
    expect(res.status).toBe(422);
  });
});

describe('GET /orders', () => {
  it('lista apenas pedidos do usuario', async () => {
    const item = await createTestItem(testDb);
    await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });

    const res = await app.request('/api/v1/orders', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const json = await res.json() as { orders: Array<{ userId: string }> };
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0]?.userId).toBe(userId);
  });
});

describe('GET /orders/:id', () => {
  it('retorna pedido com itens', async () => {
    const item = await createTestItem(testDb);
    const create = await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });
    const created = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${created.order.id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
  });

  it('404 pra pedido de outro usuario', async () => {
    const item = await createTestItem(testDb);
    const create = await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });
    const created = await create.json() as { order: { id: string } };

    const other = await createTestUser(testDb, { email: 'other@x.com' });
    const res = await app.request(`/api/v1/orders/${created.order.id}`, { headers: { Authorization: `Bearer ${other.token}` } });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /orders/:id/status', () => {
  it('cliente cancela pedido pendente', async () => {
    const item = await createTestItem(testDb);
    const create = await app.request('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itens: [{ itemId: item.id, quantidade: 1 }] }) });
    const created = await create.json() as { order: { id: string } };

    const res = await app.request(`/api/v1/orders/${created.order.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'cancelado' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { order: { status: string; canceladoEm: string | null } };
    expect(json.order.status).toBe('cancelado');
    expect(json.order.canceladoEm).toBeTruthy();
  });
});
