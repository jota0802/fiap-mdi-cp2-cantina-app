import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';
import { users, items, cantinaItems, unidades, escolas, cantinas } from '../db/schema.js';
import type { TestDb } from './db.js';

export async function createTestUser(
  db: TestDb,
  overrides: Partial<{
    email: string;
    name: string | null;
    password: string;
    role: 'customer' | 'staff';
    rm: string | null;
    cantinaId: string | null;
  }> = {},
) {
  const id = createId();
  const password = overrides.password ?? 'senha-teste';
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    id,
    name: overrides.name === undefined ? `User ${id}` : overrides.name,
    email: overrides.email ?? `${id}@test.com`,
    passwordHash,
    role: overrides.role ?? 'customer',
    locale: 'pt',
    rm: overrides.rm ?? null,
    cantinaId: overrides.cantinaId ?? null,
  }).returning();
  if (!user) throw new Error('failed to create user');
  const validRole: 'customer' | 'staff' = user.role === 'staff' ? 'staff' : 'customer';
  const token = await signJwt({
    sub: user.id,
    email: user.email,
    role: validRole,
    locale: user.locale,
    cantinaId: user.cantinaId ?? undefined,
  });
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

export async function createTestTenants(db: TestDb) {
  await db.insert(unidades).values({ id: 'u_test', nome: 'Test Unidade' });
  await db.insert(escolas).values({ id: 'e_test', unidadeId: 'u_test', nome: 'Test Escola', tipo: 'main' });
  await db.insert(cantinas).values({ id: 'c_test', escolaId: 'e_test', nome: 'Test Cantina', andar: '1' });
  return { unidadeId: 'u_test', escolaId: 'e_test', cantinaId: 'c_test' };
}

export async function createTestStaff(
  db: TestDb,
  cantinaId: string,
  overrides: Partial<{ email: string; name: string; password: string }> = {},
) {
  const id = createId();
  const password = overrides.password ?? 'senha-teste';
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    id,
    name: overrides.name ?? 'Test Staff',
    email: overrides.email ?? `staff-${id}@test.com`,
    passwordHash,
    role: 'staff',
    locale: 'pt',
    cantinaId,
  }).returning();
  if (!user) throw new Error('failed to create staff');
  const token = await signJwt({
    sub: user.id,
    email: user.email,
    role: 'staff',
    locale: user.locale,
    cantinaId: user.cantinaId ?? undefined,
  });
  return { user, password, token };
}

export async function createTestCantinaItems(
  db: TestDb,
  cantinaId: string,
  itemsData: Array<{
    slug: string;
    name: string;
    preco: string;
    estoque?: number;
    disponivel?: boolean;
    visivel?: boolean;
  }>,
) {
  const inserted: Array<{
    item: typeof items.$inferSelect;
    cantinaItem: typeof cantinaItems.$inferSelect;
  }> = [];
  for (const it of itemsData) {
    const itemId = createId();
    const [item] = await db
      .insert(items)
      .values({
        id: itemId,
        slug: it.slug,
        name: it.name,
        descricao: 'Descricao de teste',
        preco: it.preco,
        categoria: 'lanches',
        tags: [],
        disponivel: true,
      })
      .returning();
    if (!item) throw new Error(`failed to insert item ${it.slug}`);

    const [ci] = await db
      .insert(cantinaItems)
      .values({
        cantinaId,
        itemId,
        preco: it.preco,
        estoque: it.estoque ?? 100,
        disponivel: it.disponivel ?? true,
        visivel: it.visivel ?? true,
      })
      .returning();
    if (!ci) throw new Error('failed to insert cantina_item');
    inserted.push({ item, cantinaItem: ci });
  }
  return inserted;
}
