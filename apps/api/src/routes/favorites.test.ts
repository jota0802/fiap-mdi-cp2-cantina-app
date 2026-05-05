import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createFavoritesRoutes } from './favorites.js';
import { createTestUser, createTestItem } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb; let close: () => Promise<void>; let app: Hono; let token: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/favorites', createFavoritesRoutes(testDb));
  app.onError(errorHandler);
  const u = await createTestUser(testDb);
  token = u.token;
});

afterEach(async () => { await close(); });

describe('Favorites', () => {
  it('add + list + remove', async () => {
    const item = await createTestItem(testDb);

    let res = await app.request(`/api/v1/favorites/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(204);

    res = await app.request('/api/v1/favorites', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const list = await res.json() as { items: Array<{ id: string }> };
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.id).toBe(item.id);

    res = await app.request(`/api/v1/favorites/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(204);

    res = await app.request('/api/v1/favorites', { headers: { Authorization: `Bearer ${token}` } });
    const empty = await res.json() as { items: unknown[] };
    expect(empty.items).toHaveLength(0);
  });

  it('add idempotente', async () => {
    const item = await createTestItem(testDb);
    await app.request(`/api/v1/favorites/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const res = await app.request(`/api/v1/favorites/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(204);
  });
});
