import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { unidades, escolas, cantinas } from '../db/schema.js';
import type { TenantTree } from '@cantina/shared';
import type { DB } from '../db/client.js';
import type { TestDb } from '../test/db.js';

export function createTenantsRoutes(db: DB | TestDb) {
  const app = new Hono();

  app.get('/tree', async (c) => {
    const us = await db.select().from(unidades)
      .where(eq(unidades.ativo, true))
      .orderBy(asc(unidades.nome));
    const es = await db.select().from(escolas)
      .where(eq(escolas.ativo, true))
      .orderBy(asc(escolas.nome));
    const cs = await db.select().from(cantinas)
      .where(eq(cantinas.ativo, true))
      .orderBy(sql`${cantinas.andar} ASC NULLS LAST`, asc(cantinas.nome));

    const tree: TenantTree = {
      unidades: us.map((u) => ({
        id: u.id,
        nome: u.nome,
        escolas: es
          .filter((e) => e.unidadeId === u.id)
          .map((e) => ({
            id: e.id,
            nome: e.nome,
            tipo: e.tipo,
            cantinas: cs
              .filter((cn) => cn.escolaId === e.id)
              .map((cn) => ({ id: cn.id, nome: cn.nome, andar: cn.andar })),
          })),
      })),
    };

    c.header('Cache-Control', 'public, max-age=3600');
    return c.json(tree, 200);
  });

  return app;
}
