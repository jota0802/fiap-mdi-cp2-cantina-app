import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { CategoriaSchema } from '@cantina/shared';
import { items, cantinaItems } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant-context.js';
import { notFound, badRequest } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createItemsRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);
  app.use('*', tenantContext(db));

  app.get('/', async (c) => {
    const cantinaId = c.var.cantina.id;
    const categoriaRaw = c.req.query('categoria');
    const conditions = [
      eq(cantinaItems.cantinaId, cantinaId),
      eq(cantinaItems.disponivel, true),
      eq(cantinaItems.visivel, true),
    ];
    if (categoriaRaw !== undefined) {
      const parsed = CategoriaSchema.safeParse(categoriaRaw);
      if (!parsed.success) throw badRequest(`Categoria inválida: ${categoriaRaw}`);
      conditions.push(eq(items.categoria, parsed.data));
    }

    const list = await db
      .select({
        id: items.id,
        slug: items.slug,
        name: items.name,
        nameKey: items.nameKey,
        descricao: items.descricao,
        descricaoKey: items.descricaoKey,
        categoria: items.categoria,
        tags: items.tags,
        imagem: items.imagem,
        preco: cantinaItems.preco,
        estoque: cantinaItems.estoque,
        disponivel: cantinaItems.disponivel,
      })
      .from(cantinaItems)
      .innerJoin(items, eq(cantinaItems.itemId, items.id))
      .where(and(...conditions));

    return c.json({ items: list }, 200);
  });

  app.get('/:id', async (c) => {
    const cantinaId = c.var.cantina.id;
    const id = c.req.param('id');

    const [row] = await db
      .select({
        id: items.id,
        slug: items.slug,
        name: items.name,
        nameKey: items.nameKey,
        descricao: items.descricao,
        descricaoKey: items.descricaoKey,
        categoria: items.categoria,
        tags: items.tags,
        imagem: items.imagem,
        preco: cantinaItems.preco,
        estoque: cantinaItems.estoque,
        disponivel: cantinaItems.disponivel,
      })
      .from(cantinaItems)
      .innerJoin(items, eq(cantinaItems.itemId, items.id))
      .where(and(
        eq(cantinaItems.cantinaId, cantinaId),
        eq(items.id, id),
        eq(cantinaItems.disponivel, true),
        eq(cantinaItems.visivel, true),
      ))
      .limit(1);

    if (!row) throw notFound('Item não disponível nesta cantina');
    return c.json({ item: row }, 200);
  });

  return app;
}
