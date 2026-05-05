import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { favorites, items } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { toPublicItem } from './items.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createFavoritesRoutes(db: DB | TestDb) {
  const app = new Hono();
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const claim = c.get('user');
    const favs = await db.select({ itemId: favorites.itemId }).from(favorites).where(eq(favorites.userId, claim.sub));
    if (favs.length === 0) return c.json({ items: [] }, 200);
    const list = await db.select().from(items).where(inArray(items.id, favs.map((f) => f.itemId)));
    return c.json({ items: list.map(toPublicItem) }, 200);
  });

  app.post('/:itemId', async (c) => {
    const claim = c.get('user');
    const itemId = c.req.param('itemId');
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
