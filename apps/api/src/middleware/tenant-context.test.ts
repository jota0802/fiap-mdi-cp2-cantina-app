import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createTestDb, type TestDb } from '../test/db.js';
import { tenantContext } from './tenant-context.js';
import { requireAuth } from './auth.js';
import { errorHandler } from './error-handler.js';
import { createTestTenants, createTestStaff, createTestUser } from '../test/fixtures.js';
import { cantinas } from '../db/schema.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db;
  close = f.close;
  app = new Hono();
  app.use('/protected', requireAuth);
  app.use('/protected', tenantContext(testDb));
  app.get('/protected', (c) => c.json({ cantina: c.get('cantina') }, 200));
  app.onError(errorHandler);
});

afterEach(async () => { await close(); });

describe('tenantContext middleware', () => {
  it('rejeita request sem header X-Cantina-Id (400)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}` },
    });
    expect(res.status).toBe(400);
  });

  it('rejeita cantina inexistente (404)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}`, 'X-Cantina-Id': 'c_inexistente' },
    });
    expect(res.status).toBe(404);
  });

  it('rejeita cantina inativa (404)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await testDb.update(cantinas).set({ ativo: false }).where(eq(cantinas.id, cantinaId));
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(404);
  });

  it('aceita customer com qualquer cantina ativa', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const u = await createTestUser(testDb);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${u.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { cantina: { id: string } };
    expect(json.cantina.id).toBe(cantinaId);
  });

  it('aceita staff acessando a própria cantina', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const s = await createTestStaff(testDb, cantinaId);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${s.token}`, 'X-Cantina-Id': cantinaId },
    });
    expect(res.status).toBe(200);
  });

  it('rejeita staff acessando OUTRA cantina (403)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await testDb.insert(cantinas).values({ id: 'c_outra', escolaId: 'e_test', nome: 'Outra', andar: '2' });
    const s = await createTestStaff(testDb, cantinaId);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${s.token}`, 'X-Cantina-Id': 'c_outra' },
    });
    expect(res.status).toBe(403);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe('FORBIDDEN');
  });
});

describe('CHECK constraint users_staff_must_have_cantina', () => {
  it('rejeita INSERT users com role=staff e cantina_id NULL', async () => {
    const { users } = await import('../db/schema.js');
    const { createId } = await import('@paralleldrive/cuid2');
    const { hashPassword } = await import('../lib/password.js');

    await expect(
      testDb.insert(users).values({
        id: createId(),
        name: 'Bad Staff',
        email: 'bad@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'staff',
        cantinaId: null,
        locale: 'pt',
      })
    ).rejects.toThrow(/users_staff_must_have_cantina|check/i);
  });

  it('aceita INSERT users com role=customer e cantina_id NULL', async () => {
    const { users } = await import('../db/schema.js');
    const { createId } = await import('@paralleldrive/cuid2');
    const { hashPassword } = await import('../lib/password.js');

    const [user] = await testDb.insert(users).values({
      id: createId(),
      name: 'Customer Sem Cantina',
      email: 'c@t.com',
      passwordHash: await hashPassword('senha123'),
      role: 'customer',
      cantinaId: null,
      locale: 'pt',
    }).returning();
    expect(user?.cantinaId).toBeNull();
  });
});
