import type { MiddlewareHandler } from 'hono';
import { eq, and } from 'drizzle-orm';
import { cantinas } from '../db/schema.js';
import type { Cantina } from '../db/schema.js';
import { badRequest, notFound, forbidden } from '../lib/errors.js';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

declare module 'hono' {
  interface ContextVariableMap {
    cantina: Cantina;
  }
}

export function tenantContext(db: DB | TestDb): MiddlewareHandler {
  return async (c, next) => {
    const cantinaId = c.req.header('X-Cantina-Id');
    if (!cantinaId) throw badRequest('Header X-Cantina-Id obrigatório nesta rota');

    const [cantina] = await db
      .select()
      .from(cantinas)
      .where(and(eq(cantinas.id, cantinaId), eq(cantinas.ativo, true)))
      .limit(1);
    if (!cantina) throw notFound('Cantina não existe ou inativa');

    const claim = c.get('user');
    if (claim.role === 'staff' && claim.cantinaId !== cantinaId) {
      throw forbidden('Staff só pode acessar a própria cantina');
    }

    c.set('cantina', cantina);
    await next();
  };
}
