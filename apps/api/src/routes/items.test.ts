import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createItemsRoutes } from './items.js';
import { createTestItem, createTestUser } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb; let close: () => Promise<void>; let app: Hono; let token: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/items', createItemsRoutes(testDb));
  app.onError(errorHandler);
  const u = await createTestUser(testDb);
  token = u.token;
});

afterEach(async () => { await close(); });

describe('GET /items', () => {
  it('lista itens disponiveis', async () => {
    await createTestItem(testDb, { slug: 'a' });
    await createTestItem(testDb, { slug: 'b' });
    await createTestItem(testDb, { slug: 'c', disponivel: false });

    const res = await app.request('/api/v1/items', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const json = await res.json() as { items: Array<{ slug: string; disponivel: boolean }> };
    expect(json.items).toHaveLength(2); // só os 2 disponíveis
    expect(json.items.every(i => i.disponivel)).toBe(true);
  });

  it('filtra por categoria', async () => {
    await createTestItem(testDb, { slug: 'a', categoria: 'lanches' });
    await createTestItem(testDb, { slug: 'b', categoria: 'bebidas' });

    const res = await app.request('/api/v1/items?categoria=bebidas', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json() as { items: Array<{ slug: string }> };
    expect(json.items).toHaveLength(1);
    expect(json.items[0]?.slug).toBe('b');
  });

  it('rejeita sem auth', async () => {
    const res = await app.request('/api/v1/items');
    expect(res.status).toBe(401);
  });
});

describe('GET /items/:id', () => {
  it('retorna item por id', async () => {
    const item = await createTestItem(testDb, { slug: 'x' });
    const res = await app.request(`/api/v1/items/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const json = await res.json() as { item: { slug: string } };
    expect(json.item.slug).toBe('x');
  });

  it('404 quando nao existe', async () => {
    const res = await app.request('/api/v1/items/nope', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(404);
  });
});
