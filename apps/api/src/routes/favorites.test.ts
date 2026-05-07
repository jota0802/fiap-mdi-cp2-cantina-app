import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createFavoritesRoutes } from './favorites.js';
import { createTestUser, createTestTenants, createTestCantinaItems } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;
let token: string;
let cantinaId: string;
let itemId: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/favorites', createFavoritesRoutes(testDb));
  app.onError(errorHandler);

  const tenants = await createTestTenants(testDb);
  cantinaId = tenants.cantinaId;
  const created = await createTestCantinaItems(testDb, cantinaId, [
    { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 100 },
  ]);
  itemId = created[0]!.item.id;

  const u = await createTestUser(testDb, { cantinaId });
  token = u.token;
});

afterEach(async () => { await close(); });

describe('Favorites', () => {
  it('rejeita sem header X-Cantina-Id (400)', async () => {
    const res = await app.request('/api/v1/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  it('add + list + remove', async () => {
    let res = await app.request(`/api/v1/favorites/${itemId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(204);

    res = await app.request('/api/v1/favorites', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const list = await res.json() as { items: Array<{ id: string }> };
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.id).toBe(itemId);

    res = await app.request(`/api/v1/favorites/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(204);

    res = await app.request('/api/v1/favorites', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    const empty = await res.json() as { items: unknown[] };
    expect(empty.items).toHaveLength(0);
  });

  it('add idempotente', async () => {
    await app.request(`/api/v1/favorites/${itemId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    const res = await app.request(`/api/v1/favorites/${itemId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(204);
  });
});
