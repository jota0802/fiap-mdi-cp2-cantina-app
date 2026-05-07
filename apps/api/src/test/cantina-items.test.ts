import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb, type TestDb } from './db.js';
import { createTestTenants } from './fixtures.js';
import { items, cantinaItems, users } from '../db/schema.js';
import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from '../lib/password.js';

let testDb: TestDb;
let close: () => Promise<void>;

beforeEach(async () => {
  const f = await createTestDb();
  testDb = f.db; close = f.close;
});

afterEach(async () => { await close(); });

describe('CHECK constraint cantina_items_estoque_positivo', () => {
  it('rejeita INSERT com estoque negativo', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const itemId = createId();
    await testDb.insert(items).values({
      id: itemId,
      slug: 'x',
      name: 'X',
      descricao: 'd',
      preco: '1.00',
      categoria: 'lanches',
      tags: [],
      disponivel: true,
    });

    await expect(
      testDb.insert(cantinaItems).values({
        cantinaId, itemId, preco: '1.00', estoque: -1,
      }),
    ).rejects.toThrow(/estoque_positivo|check/i);
  });

  it('rejeita UPDATE que deixaria estoque negativo', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const itemId = createId();
    await testDb.insert(items).values({
      id: itemId,
      slug: 'x',
      name: 'X',
      descricao: 'd',
      preco: '1.00',
      categoria: 'lanches',
      tags: [],
      disponivel: true,
    });
    await testDb.insert(cantinaItems).values({
      cantinaId, itemId, preco: '1.00', estoque: 5,
    });

    await expect(
      testDb.update(cantinaItems).set({ estoque: -3 }).where(eq(cantinaItems.itemId, itemId)),
    ).rejects.toThrow(/estoque_positivo|check/i);
  });
});

describe('CHECK constraints em users', () => {
  it('users_staff_must_have_name barra INSERT staff sem name', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await expect(
      testDb.insert(users).values({
        id: createId(),
        email: 'bad@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'staff',
        name: null,
        cantinaId,
        locale: 'pt',
      }),
    ).rejects.toThrow(/staff_must_have_name|check/i);
  });

  it('users_rm_formato barra rm com 5 dígitos', async () => {
    await expect(
      testDb.insert(users).values({
        id: createId(),
        email: 'a@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'customer',
        name: 'X',
        rm: '12345',
        locale: 'pt',
      }),
    ).rejects.toThrow(/rm_formato|check/i);
  });

  it('users_rm_formato barra rm com letras', async () => {
    await expect(
      testDb.insert(users).values({
        id: createId(),
        email: 'b@t.com',
        passwordHash: await hashPassword('senha123'),
        role: 'customer',
        name: 'Y',
        rm: 'abc123',
        locale: 'pt',
      }),
    ).rejects.toThrow(/rm_formato|check/i);
  });

  it('users_rm_formato aceita rm com exatamente 6 dígitos', async () => {
    const [user] = await testDb.insert(users).values({
      id: createId(),
      email: 'c@t.com',
      passwordHash: await hashPassword('senha123'),
      role: 'customer',
      name: 'Z',
      rm: '999999',
      locale: 'pt',
    }).returning();
    expect(user?.rm).toBe('999999');
  });
});
