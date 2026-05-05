import type { ItemCardapio, Order } from '@/types';

export type Periodo = 'manha' | 'almoco' | 'tarde' | 'noite';

/**
 * Combo retorna CHAVES i18n em vez de texto. O consumer (Home) usa
 * `t(combo.tituloKey)` e `t(combo.subtituloKey, { count })` pra obter
 * a string traduzida no idioma ativo.
 */
export type Combo = {
  periodo: Periodo;
  tituloKey: string;
  subtituloKey: string;
  itemIds: [number, number];
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

const COMBOS_PADRAO: Record<Periodo, Combo> = {
  manha: {
    periodo: 'manha',
    tituloKey: 'combo.breakfast.title',
    subtituloKey: 'combo.breakfast.subtitle',
    itemIds: [1, 4],
    fonte: 'padrao',
  },
  almoco: {
    periodo: 'almoco',
    tituloKey: 'combo.lunch.title',
    subtituloKey: 'combo.lunch.subtitle',
    itemIds: [6, 3],
    fonte: 'padrao',
  },
  tarde: {
    periodo: 'tarde',
    tituloKey: 'combo.afternoon.title',
    subtituloKey: 'combo.afternoon.subtitle',
    itemIds: [2, 5],
    fonte: 'padrao',
  },
  noite: {
    periodo: 'noite',
    tituloKey: 'combo.night.title',
    subtituloKey: 'combo.night.subtitle',
    itemIds: [7, 2],
    fonte: 'padrao',
  },
};

const COMBOS_ALTERNATIVOS: Record<Periodo, Combo> = {
  manha: {
    periodo: 'manha',
    tituloKey: 'combo.alt_breakfast.title',
    subtituloKey: 'combo.alt_breakfast.subtitle',
    itemIds: [12, 1],
    fonte: 'alternativo',
  },
  almoco: {
    periodo: 'almoco',
    tituloKey: 'combo.alt_lunch.title',
    subtituloKey: 'combo.alt_lunch.subtitle',
    itemIds: [10, 3],
    fonte: 'alternativo',
  },
  tarde: {
    periodo: 'tarde',
    tituloKey: 'combo.alt_afternoon.title',
    subtituloKey: 'combo.alt_afternoon.subtitle',
    itemIds: [9, 2],
    fonte: 'alternativo',
  },
  noite: {
    periodo: 'noite',
    tituloKey: 'combo.alt_night.title',
    subtituloKey: 'combo.alt_night.subtitle',
    itemIds: [8, 11],
    fonte: 'alternativo',
  },
};

function getComboHistorico(periodo: Periodo, orders: Order[]): Combo | null {
  const recentes = [...orders]
    .sort(
      (a, b) =>
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    )
    .slice(0, RECENCY_WINDOW);

  if (recentes.length < 2) return null;

  const contagem = new Map<number, number>();
  for (const order of recentes) {
    for (const ci of order.items) {
      contagem.set(ci.itemId, (contagem.get(ci.itemId) ?? 0) + ci.quantidade);
    }
  }

  const topDois = Array.from(contagem.entries())
    .filter(([, qtd]) => qtd >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  if (topDois.length < 2) return null;

  const [a, b] = topDois;
  if (a === undefined || b === undefined) return null;

  return {
    periodo,
    tituloKey: 'combo.personalized_title',
    subtituloKey: 'combo.personalized_subtitle',
    itemIds: [a, b],
    fonte: 'historico',
    recencyCount: recentes.length,
  };
}

/**
 * Retorna combos disponíveis em ordem de prioridade: histórico > padrão >
 * alternativo. Filtra combos cujo PAR completo já está no carrinho.
 * Sempre retorna ao menos 1 combo.
 */
export function getCombosDisponiveis(
  periodo: Periodo,
  orders: Order[],
  cartItemIds: number[] = [],
): Combo[] {
  const cartSet = new Set(cartItemIds);
  const candidatos: Combo[] = [];

  const historico = getComboHistorico(periodo, orders);
  if (historico) candidatos.push(historico);
  candidatos.push(COMBOS_PADRAO[periodo]);
  candidatos.push(COMBOS_ALTERNATIVOS[periodo]);

  const filtrados = candidatos.filter(
    (c) => !(cartSet.has(c.itemIds[0]) && cartSet.has(c.itemIds[1])),
  );

  const visto = new Set<string>();
  const unicos: Combo[] = [];
  for (const c of filtrados) {
    const chave = [c.itemIds[0], c.itemIds[1]].sort().join('|');
    if (visto.has(chave)) continue;
    visto.add(chave);
    unicos.push(c);
  }

  return unicos.length > 0 ? unicos : [COMBOS_PADRAO[periodo]];
}

export function getComboRecomendado(periodo: Periodo, orders: Order[]): Combo {
  const lista = getCombosDisponiveis(periodo, orders);
  return lista[0] ?? COMBOS_PADRAO[periodo];
}

export function precoCombo(combo: Combo, cardapio: ItemCardapio[]): number {
  const a = cardapio.find((i) => i.id === combo.itemIds[0]);
  const b = cardapio.find((i) => i.id === combo.itemIds[1]);
  return (a?.preco ?? 0) + (b?.preco ?? 0);
}
