import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';
import { users, items } from '../db/schema.js';
import type { TestDb } from './db.js';

export async function createTestUser(
  db: TestDb,
  overrides: Partial<{ email: string; name: string; password: string; role: 'customer' | 'staff' }> = {},
) {
  const id = createId();
  const password = overrides.password ?? 'senha-teste';
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    id,
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `${id}@test.com`,
    passwordHash,
    role: overrides.role ?? 'customer',
    locale: 'pt',
  }).returning();
  if (!user) throw new Error('failed to create user');
  const validRole: 'customer' | 'staff' = user.role === 'staff' ? 'staff' : 'customer';
  const token = await signJwt({ sub: user.id, email: user.email, role: validRole, locale: user.locale });
  return { user, password, token };
}

export async function createTestItem(db: TestDb, overrides: Partial<typeof items.$inferInsert> = {}) {
  const id = createId();
  const [item] = await db.insert(items).values({
    id,
    slug: overrides.slug ?? `slug-${id.slice(0, 6)}`,
    name: overrides.name ?? 'Item de teste',
    nameKey: overrides.nameKey ?? 'item.test.nome',
    descricao: overrides.descricao ?? 'Descricao de teste',
    descricaoKey: overrides.descricaoKey ?? 'item.test.desc',
    preco: overrides.preco ?? '10.00',
    categoria: overrides.categoria ?? 'lanches',
    tags: overrides.tags ?? [],
    imagem: overrides.imagem ?? null,
    disponivel: overrides.disponivel ?? true,
    ...overrides,
  }).returning();
  if (!item) throw new Error('failed to create item');
  return item;
}
