import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDb } from '../test/db.js';
import { tickOnce } from './promote-orders.js';
import { orders } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { createTestUser } from '../test/fixtures.js';

let testDb: TestDb; let close: () => Promise<void>; let userId: string;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
  const u = await createTestUser(testDb);
  userId = u.user.id;
});

afterEach(async () => { await close(); });

async function insertOrder(prontoEmEstimadoOffsetMs: number): Promise<string> {
  const id = createId();
  const prontoEmEstimado = new Date(Date.now() + prontoEmEstimadoOffsetMs);
  await testDb.insert(orders).values({
    id,
    userId,
    status: 'pendente',
    total: '10.00',
    senha: 1,
    prontoEmEstimado,
  });
  return id;
}

describe('tickOnce (auto-promote pendente -> pronto)', () => {
  it('promove pedido cujo prontoEmEstimado ja passou', async () => {
    const id = await insertOrder(-1000); // 1s no passado
    const promoted = await tickOnce(testDb);
    expect(promoted).toBe(1);

    const [row] = await testDb.select().from(orders).where(eq(orders.id, id)).limit(1);
    expect(row?.status).toBe('pronto');
    expect(row?.prontoEm).toBeTruthy();
  });

  it('mantem pedido cujo prontoEmEstimado ainda nao chegou', async () => {
    const id = await insertOrder(60_000); // 1min no futuro
    const promoted = await tickOnce(testDb);
    expect(promoted).toBe(0);

    const [row] = await testDb.select().from(orders).where(eq(orders.id, id)).limit(1);
    expect(row?.status).toBe('pendente');
    expect(row?.prontoEm).toBeNull();
  });

  it('promove varios pedidos atrasados de uma vez', async () => {
    await insertOrder(-1000);
    await insertOrder(-500);
    await insertOrder(60_000); // este nao
    const promoted = await tickOnce(testDb);
    expect(promoted).toBe(2);
  });

  it('idempotente — ja promovido nao volta a ser', async () => {
    await insertOrder(-1000);
    await tickOnce(testDb);
    const second = await tickOnce(testDb);
    expect(second).toBe(0);
  });
});
