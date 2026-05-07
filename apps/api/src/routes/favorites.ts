import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { favorites, items, cantinaItems } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant-context.js';
import { notFound } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createFavoritesRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);
  app.use('*', tenantContext(db));

  app.get('/', async (c) => {
    const claim = c.get('user');
    const cantinaId = c.var.cantina.id;
    const favs = await db.select({ itemId: favorites.itemId }).from(favorites).where(eq(favorites.userId, claim.sub));
    if (favs.length === 0) return c.json({ items: [] }, 200);
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
      .where(and(
        eq(cantinaItems.cantinaId, cantinaId),
        inArray(items.id, favs.map((f) => f.itemId)),
      ));
    return c.json({ items: list }, 200);
  });

  app.post('/:itemId', async (c) => {
    const claim = c.get('user');
    const itemId = c.req.param('itemId');
    const [item] = await db.select({ id: items.id }).from(items).where(eq(items.id, itemId)).limit(1);
    if (!item) throw notFound('Item not found');
    await db.insert(favorites)
      .values({ userId: claim.sub, itemId })
      .onConflictDoNothing();
    return c.body(null, 204);
  });

  app.delete('/:itemId', async (c) => {
    const claim = c.get('user');
    const itemId = c.req.param('itemId');
    await db.delete(favorites).where(and(eq(favorites.userId, claim.sub), eq(favorites.itemId, itemId)));
    return c.body(null, 204);
  });

  return app;
}
