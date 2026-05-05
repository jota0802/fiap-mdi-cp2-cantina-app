import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { CategoriaSchema, type Item as ItemDto } from '@cantina/shared';
import { items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, badRequest } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function toPublicItem(i: typeof items.$inferSelect): ItemDto {
  return {
    id: i.id,
    slug: i.slug,
    name: i.name,
    nameKey: i.nameKey,
    descricao: i.descricao,
    descricaoKey: i.descricaoKey,
    preco: i.preco,
    // Trust DB writes (seed/createTestItem): no CHECK constraint, but writers are typed
    categoria: i.categoria as ItemDto['categoria'],
    tags: i.tags,
    imagem: i.imagem,
    disponivel: i.disponivel,
  };
}

export function createItemsRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const categoriaRaw = c.req.query('categoria');
    const conditions = [eq(items.disponivel, true)];
    if (categoriaRaw !== undefined) {
      const parsed = CategoriaSchema.safeParse(categoriaRaw);
      if (!parsed.success) throw badRequest(`Categoria inválida: ${categoriaRaw}`);
      conditions.push(eq(items.categoria, parsed.data));
    }
    const list = await db.select().from(items).where(and(...conditions));
    return c.json({ items: list.map(toPublicItem) }, 200);
  });

  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!item) throw notFound('Item not found');
    return c.json({ item: toPublicItem(item) }, 200);
  });

  return app;
}
