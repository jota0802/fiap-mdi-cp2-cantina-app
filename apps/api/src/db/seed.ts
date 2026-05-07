import { createDb } from './client.js';
import { unidades, escolas, cantinas, items, cantinaItems } from './schema.js';
import { logger } from '../lib/logger.js';
import { createId } from '@paralleldrive/cuid2';

const SEED_UNIDADES = [
  { id: 'u_paulista', nome: 'Paulista' },
  { id: 'u_lins',     nome: 'Lins' },
] as const;

const SEED_ESCOLAS = [
  { id: 'e_paulista_main',  unidadeId: 'u_paulista', nome: 'FIAP Paulista',  tipo: 'main' },
  { id: 'e_lins_school',    unidadeId: 'u_lins',     nome: 'FIAP School',    tipo: 'school' },
  { id: 'e_lins_faculdade', unidadeId: 'u_lins',     nome: 'FIAP Faculdade', tipo: 'faculdade' },
] as const;

const SEED_CANTINAS = [
  { id: 'c_pa_5',       escolaId: 'e_paulista_main',  nome: '5º andar', andar: '5' },
  { id: 'c_pa_7',       escolaId: 'e_paulista_main',  nome: '7º andar', andar: '7' },
  { id: 'c_lins_sc_1',  escolaId: 'e_lins_school',    nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_fac_1', escolaId: 'e_lins_faculdade', nome: 'Térreo',   andar: 'T' },
] as const;

const PRICE_MULTIPLIER_BY_UNIDADE: Record<string, number> = {
  u_paulista: 1.0,
  u_lins:     0.85,
};

const CANTINA_TO_UNIDADE: Record<string, string> = {
  c_pa_5: 'u_paulista', c_pa_7: 'u_paulista',
  c_lins_sc_1: 'u_lins', c_lins_fac_1: 'u_lins',
};

const SEED_ITEMS = [
  { slug: 'cafe',           name: 'Café',                  preco: '3.50', categoria: 'bebidas',  descricao: 'Café preto coado', tags: ['quente', 'sem-acucar'] },
  { slug: 'cafe-com-leite', name: 'Café com leite',        preco: '5.00', categoria: 'bebidas',  descricao: 'Café com leite vaporizado', tags: ['quente'] },
  { slug: 'suco-laranja',   name: 'Suco de laranja',       preco: '7.00', categoria: 'bebidas',  descricao: 'Suco natural 300ml', tags: ['gelado', 'natural'] },
  { slug: 'agua',           name: 'Água mineral',          preco: '4.00', categoria: 'bebidas',  descricao: 'Água sem gás 500ml', tags: ['gelado'] },
  { slug: 'misto-quente',   name: 'Misto quente',          preco: '8.50', categoria: 'lanches',  descricao: 'Pão de forma, queijo e presunto', tags: ['quente', 'bestseller'] },
  { slug: 'pao-de-queijo',  name: 'Pão de queijo',         preco: '4.50', categoria: 'lanches',  descricao: 'Tradicional mineiro', tags: ['quente'] },
  { slug: 'salgado-frango', name: 'Coxinha de frango',     preco: '6.00', categoria: 'lanches',  descricao: 'Coxinha tradicional', tags: ['quente'] },
  { slug: 'wrap-frango',    name: 'Wrap de frango',        preco: '15.00', categoria: 'pratos',  descricao: 'Tortilla integral, frango grelhado, salada', tags: ['integral'] },
  { slug: 'salada-cesar',   name: 'Salada César',          preco: '18.00', categoria: 'pratos',  descricao: 'Alface, croutons, frango, parmesão', tags: ['fit'] },
  { slug: 'brownie',        name: 'Brownie',               preco: '7.50', categoria: 'doces',    descricao: 'Chocolate meio amargo', tags: ['doce'] },
  { slug: 'bolo-cenoura',   name: 'Bolo de cenoura',       preco: '6.50', categoria: 'doces',    descricao: 'Cobertura de chocolate', tags: ['doce'] },
  { slug: 'fruta',          name: 'Fruta da estação',      preco: '5.00', categoria: 'doces',    descricao: 'Banana, maçã ou laranja', tags: ['fit', 'natural'] },
] as const;

function precoPara(itemPreco: string, unidadeId: string): string {
  const mult = PRICE_MULTIPLIER_BY_UNIDADE[unidadeId] ?? 1.0;
  return (parseFloat(itemPreco) * mult).toFixed(2);
}

function estoqueRandom(): number {
  return Math.floor(Math.random() * 251) + 100;
}

async function main() {
  const db = await createDb();
  logger.info('Seeding hierarquia + catálogo + cantina_items...');

  await db.insert(unidades).values([...SEED_UNIDADES]).onConflictDoNothing({ target: unidades.id });
  logger.info(`  ↳ ${SEED_UNIDADES.length} unidades`);

  await db.insert(escolas).values([...SEED_ESCOLAS]).onConflictDoNothing({ target: escolas.id });
  logger.info(`  ↳ ${SEED_ESCOLAS.length} escolas`);

  await db.insert(cantinas).values([...SEED_CANTINAS]).onConflictDoNothing({ target: cantinas.id });
  logger.info(`  ↳ ${SEED_CANTINAS.length} cantinas`);

  const itemsToInsert = SEED_ITEMS.map((it) => ({
    id: createId(),
    slug: it.slug,
    name: it.name,
    descricao: it.descricao,
    preco: it.preco,
    categoria: it.categoria,
    tags: it.tags as unknown as string[],
    disponivel: true,
  }));

  await db.insert(items).values(itemsToInsert).onConflictDoNothing({ target: items.slug });
  logger.info(`  ↳ ${itemsToInsert.length} items`);

  const cantinaItemsRows = SEED_CANTINAS.flatMap((cantina) =>
    itemsToInsert.map((item) => ({
      cantinaId: cantina.id,
      itemId: item.id,
      preco: precoPara(item.preco, CANTINA_TO_UNIDADE[cantina.id]!),
      estoque: estoqueRandom(),
      disponivel: true,
      visivel: true,
    })),
  );

  await db.insert(cantinaItems).values(cantinaItemsRows).onConflictDoNothing({ target: [cantinaItems.cantinaId, cantinaItems.itemId] });
  logger.info(`  ↳ ${cantinaItemsRows.length} cantina_items`);

  logger.info('Seed completo ✅');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
