import { createId } from '@paralleldrive/cuid2';
import { createDb } from './client.js';
import { items } from './schema.js';
import { logger } from '../lib/logger.js';

interface SeedItem {
  slug: string;
  nameKey: string;
  descricaoKey: string;
  preco: string; // numeric stored as string
  categoria: 'lanches' | 'bebidas' | 'sobremesas';
  tags: string[];
  imagem: string | null;
}

const UNSPLASH_PARAMS = '?w=240&h=240&fit=crop&q=80';

// Espelha apps/mobile/data/cardapio.ts. Pratos brasileiros (pao-de-queijo,
// coxinha, brigadeiro, acai-bowl, cappuccino, croissant) nao tem nomeKey
// dedicado no mobile, entao usamos a convencao item.<slug>.name como
// fallback (mobile cai no nome literal quando t() nao acha a key).
const SEED_ITEMS: SeedItem[] = [
  {
    slug: 'cafe-espresso',
    nameKey: 'item.espresso.name',
    descricaoKey: 'item.espresso.desc',
    preco: '5.00',
    categoria: 'bebidas',
    tags: ['quente', 'sem-lactose'],
    imagem: `https://images.unsplash.com/photo-1510707577719-ae7c14805e3a${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'cappuccino',
    nameKey: 'item.cappuccino.name',
    descricaoKey: 'item.cappuccino.desc',
    preco: '8.00',
    categoria: 'bebidas',
    tags: ['quente', 'popular'],
    imagem: `https://images.unsplash.com/photo-1572442388796-11668a67e53d${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'suco-natural',
    nameKey: 'item.juice.name',
    descricaoKey: 'item.juice.desc',
    preco: '7.00',
    categoria: 'bebidas',
    tags: ['frio', 'vegano', 'sem-lactose'],
    imagem: `https://images.unsplash.com/photo-1546549032-9571cd6b27df${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'pao-de-queijo',
    nameKey: 'item.paodequeijo.name',
    descricaoKey: 'item.paodequeijo.desc',
    preco: '4.50',
    categoria: 'lanches',
    tags: ['quente', 'vegetariano', 'popular'],
    imagem: `https://images.unsplash.com/photo-1518779578993-ec3579fee39f${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'coxinha',
    nameKey: 'item.coxinha.name',
    descricaoKey: 'item.coxinha.desc',
    preco: '6.00',
    categoria: 'lanches',
    tags: ['quente', 'popular'],
    imagem: `https://images.unsplash.com/photo-1559847844-5315695dadae${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'x-burger',
    nameKey: 'item.burger.name',
    descricaoKey: 'item.burger.desc',
    preco: '12.00',
    categoria: 'lanches',
    tags: ['quente', 'popular'],
    imagem: `https://images.unsplash.com/photo-1568901346375-23c9450c58cd${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'misto-quente',
    nameKey: 'item.toast.name',
    descricaoKey: 'item.toast.desc',
    preco: '8.50',
    categoria: 'lanches',
    tags: ['quente'],
    imagem: `https://images.unsplash.com/photo-1528736235302-52922df5c122${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'acai-bowl',
    nameKey: 'item.acai.name',
    descricaoKey: 'item.acai.desc',
    preco: '15.00',
    categoria: 'sobremesas',
    tags: ['frio', 'vegetariano', 'sem-lactose'],
    imagem: `https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'brigadeiro-gourmet',
    nameKey: 'item.brigadeiro.name',
    descricaoKey: 'item.brigadeiro.desc',
    preco: '4.00',
    categoria: 'sobremesas',
    tags: ['vegetariano', 'sem-gluten'],
    imagem: `https://images.unsplash.com/photo-1481391032119-d89fee407e44${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'salada-caesar',
    nameKey: 'item.caesar.name',
    descricaoKey: 'item.caesar.desc',
    preco: '14.00',
    categoria: 'lanches',
    tags: ['frio', 'novo'],
    imagem: `https://images.unsplash.com/photo-1546793665-c74683f339c1${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'refrigerante-lata',
    nameKey: 'item.soda.name',
    descricaoKey: 'item.soda.desc',
    preco: '5.50',
    categoria: 'bebidas',
    tags: ['frio'],
    imagem: `https://images.unsplash.com/photo-1581636625402-29b2a704ef13${UNSPLASH_PARAMS}`,
  },
  {
    slug: 'croissant',
    nameKey: 'item.croissant.name',
    descricaoKey: 'item.croissant.desc',
    preco: '7.50',
    categoria: 'lanches',
    tags: ['quente', 'vegetariano', 'novo'],
    imagem: `https://images.unsplash.com/photo-1555507036-ab1f4038808a${UNSPLASH_PARAMS}`,
  },
];

async function main() {
  const db = await createDb();
  logger.info(`Seeding ${SEED_ITEMS.length} items...`);
  const rows = SEED_ITEMS.map((s) => ({ id: createId(), ...s }));
  await db.insert(items).values(rows).onConflictDoNothing({ target: items.slug });
  logger.info(`Inserted ${rows.length} items ✅`);
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
