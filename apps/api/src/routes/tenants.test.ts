import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createTestDb, type TestDb } from '../test/db.js';
import { createTenantsRoutes } from './tenants.js';
import { errorHandler } from '../middleware/error-handler.js';
import { unidades, escolas, cantinas } from '../db/schema.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  app = new Hono();
  app.route('/api/v1/tenants', createTenantsRoutes(testDb));
  app.onError(errorHandler);
});

afterEach(async () => { await close(); });

describe('GET /api/v1/tenants/tree', () => {
  it('retorna árvore vazia quando não há tenants', async () => {
    const res = await app.request('/api/v1/tenants/tree');
    expect(res.status).toBe(200);
    const json = await res.json() as { unidades: unknown[] };
    expect(json.unidades).toEqual([]);
  });

  it('retorna árvore completa com unidades/escolas/cantinas', async () => {
    await testDb.insert(unidades).values([
      { id: 'u1', nome: 'Unidade 1' },
      { id: 'u2', nome: 'Unidade 2' },
    ]);
    await testDb.insert(escolas).values([
      { id: 'e1', unidadeId: 'u1', nome: 'Escola 1', tipo: 'main' },
      { id: 'e2', unidadeId: 'u2', nome: 'Escola 2', tipo: 'school' },
    ]);
    await testDb.insert(cantinas).values([
      { id: 'c1', escolaId: 'e1', nome: 'Cantina 1', andar: '1' },
      { id: 'c2', escolaId: 'e1', nome: 'Cantina 2', andar: '2' },
      { id: 'c3', escolaId: 'e2', nome: 'Cantina 3', andar: 'T' },
    ]);

    const res = await app.request('/api/v1/tenants/tree');
    expect(res.status).toBe(200);
    const json = await res.json() as { unidades: Array<{ id: string; escolas: Array<{ cantinas: unknown[] }> }> };
    expect(json.unidades).toHaveLength(2);
    expect(json.unidades[0]?.escolas[0]?.cantinas).toHaveLength(2);
    expect(json.unidades[1]?.escolas[0]?.cantinas).toHaveLength(1);
  });

  it('exclui unidades inativas', async () => {
    await testDb.insert(unidades).values([
      { id: 'u1', nome: 'Ativa' },
      { id: 'u2', nome: 'Inativa', ativo: false },
    ]);
    const res = await app.request('/api/v1/tenants/tree');
    const json = await res.json() as { unidades: Array<{ id: string }> };
    expect(json.unidades).toHaveLength(1);
    expect(json.unidades[0]?.id).toBe('u1');
  });

  it('exclui escolas e cantinas inativas', async () => {
    await testDb.insert(unidades).values({ id: 'u1', nome: 'U' });
    await testDb.insert(escolas).values([
      { id: 'e1', unidadeId: 'u1', nome: 'E1', tipo: 'main' },
      { id: 'e2', unidadeId: 'u1', nome: 'E2 inativa', tipo: 'main', ativo: false },
    ]);
    await testDb.insert(cantinas).values([
      { id: 'c1', escolaId: 'e1', nome: 'C1', andar: '1' },
      { id: 'c2', escolaId: 'e1', nome: 'C2 inativa', andar: '2', ativo: false },
    ]);

    const res = await app.request('/api/v1/tenants/tree');
    const json = await res.json() as { unidades: Array<{ escolas: Array<{ id: string; cantinas: Array<{ id: string }> }> }> };
    expect(json.unidades[0]?.escolas).toHaveLength(1);
    expect(json.unidades[0]?.escolas[0]?.cantinas).toHaveLength(1);
    expect(json.unidades[0]?.escolas[0]?.cantinas[0]?.id).toBe('c1');
  });

  it('retorna header Cache-Control public, max-age=3600', async () => {
    const res = await app.request('/api/v1/tenants/tree');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('é endpoint público (sem auth necessária)', async () => {
    const res = await app.request('/api/v1/tenants/tree');
    expect(res.status).toBe(200);
  });
});
