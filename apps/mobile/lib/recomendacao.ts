import type { Item } from '@cantina/shared';

import type { Order } from '@/types';

export type Periodo = 'manha' | 'almoco' | 'tarde' | 'noite';

/**
 * Combo retorna CHAVES i18n em vez de texto. O consumer (Home) usa
 * `t(combo.tituloKey)` e `t(combo.subtituloKey, { count })` pra obter
 * a string traduzida no idioma ativo.
 *
 * itemSlugs migrou de itemIds: [number, number] para slugs string em Task 7.1.
 */
export type Combo = {
  periodo: Periodo;
  tituloKey: string;
  subtituloKey: string;
  itemSlugs: [string, string];
  fonte: 'padrao' | 'historico' | 'alternativo';
  /** Apenas para combo personalizado: qtd de pedidos considerados */
  recencyCount?: number;
};

const RECENCY_WINDOW = 10;

/**
 * Identifica o período do dia atual baseado na hora.
 * 5h-11h manhã · 11h-15h almoço · 15h-19h tarde · 19h-5h noite.
 */
export function getPeriodoAtual(date: Date = new Date()): Periodo {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'manha';
  if (h >= 11 && h < 15) return 'almoco';
  if (h >= 15 && h < 19) return 'tarde';
  return 'noite';
}

// Mapeamento numerico legado → slug (para referencia de derivacao):
// 1=cafe-espresso 2=cappuccino 3=suco-natural 4=pao-de-queijo 5=coxinha
// 6=x-burger 7=misto-quente 8=acai-bowl 9=brigadeiro-gourmet
// 10=salada-caesar 11=refrigerante-lata 12=croissant

const COMBOS_PADRAO: Record<Periodo, Combo> = {
  manha: {
    periodo: 'manha',
    tituloKey: 'combo.breakfast.title',
    subtituloKey: 'combo.breakfast.subtitle',
    itemSlugs: ['cafe-espresso', 'pao-de-queijo'],
    fonte: 'padrao',
  },
  almoco: {
    periodo: 'almoco',
    tituloKey: 'combo.lunch.title',
    subtituloKey: 'combo.lunch.subtitle',
    itemSlugs: ['x-burger', 'suco-natural'],
    fonte: 'padrao',
  },
  tarde: {
    periodo: 'tarde',
    tituloKey: 'combo.afternoon.title',
    subtituloKey: 'combo.afternoon.subtitle',
    itemSlugs: ['cappuccino', 'coxinha'],
    fonte: 'padrao',
  },
  noite: {
    periodo: 'noite',
    tituloKey: 'combo.night.title',
    subtituloKey: 'combo.night.subtitle',
    itemSlugs: ['misto-quente', 'cappuccino'],
    fonte: 'padrao',
  },
};

const COMBOS_ALTERNATIVOS: Record<Periodo, Combo> = {
  manha: {
    periodo: 'manha',
    tituloKey: 'combo.alt_breakfast.title',
    subtituloKey: 'combo.alt_breakfast.subtitle',
    itemSlugs: ['croissant', 'cafe-espresso'],
    fonte: 'alternativo',
  },
  almoco: {
    periodo: 'almoco',
    tituloKey: 'combo.alt_lunch.title',
    subtituloKey: 'combo.alt_lunch.subtitle',
    itemSlugs: ['salada-caesar', 'suco-natural'],
    fonte: 'alternativo',
  },
  tarde: {
    periodo: 'tarde',
    tituloKey: 'combo.alt_afternoon.title',
    subtituloKey: 'combo.alt_afternoon.subtitle',
    itemSlugs: ['brigadeiro-gourmet', 'cappuccino'],
    fonte: 'alternativo',
  },
  noite: {
    periodo: 'noite',
    tituloKey: 'combo.alt_night.title',
    subtituloKey: 'combo.alt_night.subtitle',
    itemSlugs: ['acai-bowl', 'refrigerante-lata'],
    fonte: 'alternativo',
  },
};

/**
 * Constroi um combo personalizado baseado no historico de pedidos recentes.
 * Usa slug dos itens resolvido via order.itens[].itemId (string cuid2 da API).
 * Para derivar slugs, recebe a lista de items da API.
 */
function getComboHistorico(
  periodo: Periodo,
  orders: Order[],
  allItems: Item[],
): Combo | null {
  const recentes = [...orders]
    .sort(
      (a, b) =>
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    )
    .slice(0, RECENCY_WINDOW);

  if (recentes.length < 2) return null;

  // Contagem por itemId (string cuid2)
  const contagem = new Map<string, number>();
  for (const order of recentes) {
    for (const oi of order.itens) {
      contagem.set(oi.itemId, (contagem.get(oi.itemId) ?? 0) + oi.quantidade);
    }
  }

  const topDois = Array.from(contagem.entries())
    .filter(([, qtd]) => qtd >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  if (topDois.length < 2) return null;

  const [idA, idB] = topDois;
  if (idA === undefined || idB === undefined) return null;

  // Resolve slugs a partir dos IDs
  const slugA = allItems.find((i) => i.id === idA)?.slug;
  const slugB = allItems.find((i) => i.id === idB)?.slug;
  if (!slugA || !slugB) return null;

  return {
    periodo,
    tituloKey: 'combo.personalized_title',
    subtituloKey: 'combo.personalized_subtitle',
    itemSlugs: [slugA, slugB],
    fonte: 'historico',
    recencyCount: recentes.length,
  };
}

/**
 * Retorna combos disponíveis em ordem de prioridade: histórico > padrão >
 * alternativo. Filtra combos cujo PAR completo ja esta no carrinho (por slug).
 * Sempre retorna ao menos 1 combo.
 */
export function getCombosDisponiveis(
  periodo: Periodo,
  orders: Order[],
  cartSlugs: string[] = [],
  allItems: Item[] = [],
): Combo[] {
  const cartSet = new Set(cartSlugs);
  const candidatos: Combo[] = [];

  const historico = getComboHistorico(periodo, orders, allItems);
  if (historico) candidatos.push(historico);
  candidatos.push(COMBOS_PADRAO[periodo]);
  candidatos.push(COMBOS_ALTERNATIVOS[periodo]);

  const filtrados = candidatos.filter(
    (c) => !(cartSet.has(c.itemSlugs[0]) && cartSet.has(c.itemSlugs[1])),
  );

  const visto = new Set<string>();
  const unicos: Combo[] = [];
  for (const c of filtrados) {
    const chave = [c.itemSlugs[0], c.itemSlugs[1]].sort().join('|');
    if (visto.has(chave)) continue;
    visto.add(chave);
    unicos.push(c);
  }

  return unicos.length > 0 ? unicos : [COMBOS_PADRAO[periodo]];
}

export function getComboRecomendado(
  periodo: Periodo,
  orders: Order[],
  allItems: Item[] = [],
): Combo {
  const lista = getCombosDisponiveis(periodo, orders, [], allItems);
  return lista[0] ?? COMBOS_PADRAO[periodo];
}

/**
 * Calcula o preco total de um combo buscando os itens por slug na lista da API.
 * item.preco e string (decimal do Postgres) — usa parseFloat.
 */
export function precoCombo(combo: Combo, items: Item[]): number {
  const a = items.find((i) => i.slug === combo.itemSlugs[0]);
  const b = items.find((i) => i.slug === combo.itemSlugs[1]);
  return (a ? parseFloat(a.preco) : 0) + (b ? parseFloat(b.preco) : 0);
}
