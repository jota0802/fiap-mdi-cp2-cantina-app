import { eq, and, lte, isNotNull } from 'drizzle-orm';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';
import { orders } from '../db/schema.js';
import { logger } from '../lib/logger.js';

const POLL_INTERVAL_MS = 30_000;

/**
 * Single tick of the promote-orders job. Returns the number of orders promoted.
 * Exported separately so tests can drive it deterministically without setInterval.
 */
export async function tickOnce(db: DB | TestDb): Promise<number> {
  const result = await db
    .update(orders)
    .set({ status: 'pronto', prontoEm: new Date() })
    .where(and(
      eq(orders.status, 'pendente'),
      isNotNull(orders.prontoEmEstimado),
      lte(orders.prontoEmEstimado, new Date()),
    ))
    .returning();
  return result.length;
}

export function startPromoteJob(db: DB): () => void {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const promoted = await tickOnce(db);
      if (promoted > 0) {
        logger.info({ promoted }, 'orders auto-promoted to pronto');
      }
    } catch (err) {
      logger.error({ err }, 'promote-orders tick failed');
    } finally {
      running = false;
    }
  };

  const interval = setInterval(tick, POLL_INTERVAL_MS);
  void tick(); // run immediately on startup
  return () => clearInterval(interval);
}
