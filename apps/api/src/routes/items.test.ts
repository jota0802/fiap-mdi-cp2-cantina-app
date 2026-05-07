import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createItemsRoutes } from './items.js';
import { createTestUser, createTestTenants, createTestCantinaItems } from '../test/fixtures.js';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;
let token: string;
let cantinaId: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/items', createItemsRoutes(testDb));
  app.onError(errorHandler);

  const tenants = await createTestTenants(testDb);
  cantinaId = tenants.cantinaId;

  await createTestCantinaItems(testDb, cantinaId, [
    { slug: 'cafe', name: 'Café', preco: '3.50', estoque: 100 },
    { slug: 'misto', name: 'Misto', preco: '8.50', estoque: 0 },
    { slug: 'oculto', name: 'Oculto', preco: '5.00', visivel: false },
    { slug: 'indisp', name: 'Indisp', preco: '5.00', disponivel: false },
  ]);

  const u = await createTestUser(testDb, { cantinaId });
  token = u.token;
});

afterEach(async () => { await close(); });

describe('GET /items', () => {
  it('rejeita sem auth (401)', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(401);
  });

  it('rejeita sem header X-Cantina-Id (400)', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  it('lista items disponivel + visivel (inclui esgotado, exclui visivel=false e disponivel=false)', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { items: Array<{ slug: string; estoque: number }> };
    const slugs = json.items.map((i) => i.slug);
    expect(slugs).toContain('cafe');
    expect(slugs).toContain('misto');
    expect(slugs).not.toContain('oculto');
    expect(slugs).not.toContain('indisp');
    expect(json.items.find((i) => i.slug === 'misto')?.estoque).toBe(0);
  });

  it('preço vem de cantina_items.preco', async () => {
    const res = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    const json = await res.json() as { items: Array<{ slug: string; preco: string }> };
    expect(json.items.find((i) => i.slug === 'cafe')?.preco).toBe('3.50');
  });

  it('filtra por categoria (categoria fica em items)', async () => {
    // Todos os items dos fixtures usam categoria 'lanches'
    const res = await app.request('/api/v1/items?categoria=lanches', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { items: Array<{ slug: string }> };
    // cafe e misto: visivel + disponivel; oculto e indisp filtrados
    expect(json.items).toHaveLength(2);
    expect(json.items.every((i) => ['cafe', 'misto'].includes(i.slug))).toBe(true);
  });
});

describe('GET /items/:id', () => {
  it('retorna item por id (com preco da cantina)', async () => {
    // Pega id do item cafe via list
    const list = await app.request('/api/v1/items', {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    const listJson = await list.json() as { items: Array<{ id: string; slug: string }> };
    const cafeId = listJson.items.find((i) => i.slug === 'cafe')!.id;

    const res = await app.request(`/api/v1/items/${cafeId}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { item: { slug: string; preco: string } };
    expect(json.item.slug).toBe('cafe');
    expect(json.item.preco).toBe('3.50');
  });

  it('404 quando id nao existe', async () => {
    const res = await app.request(`/api/v1/items/nope_id_inexistente`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(404);
  });

  it('404 quando item existe globalmente mas é oculto na cantina (visivel=false)', async () => {
    // Pega id do item oculto via DB direto
    const { items: itemsTable, cantinaItems: ciTable } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');
    const [ocultoCi] = await testDb.select().from(ciTable).where(eq(ciTable.visivel, false)).limit(1);
    expect(ocultoCi).toBeDefined();
    const [oculto] = await testDb.select().from(itemsTable).where(eq(itemsTable.id, ocultoCi!.itemId)).limit(1);
    expect(oculto).toBeDefined();

    const res = await app.request(`/api/v1/items/${oculto!.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(404);
  });
});
