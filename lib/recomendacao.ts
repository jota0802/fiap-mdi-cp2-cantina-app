import type { ItemCardapio, Order } from '@/types';

export type Periodo = 'manha' | 'almoco' | 'tarde' | 'noite';

export type Combo = {
  periodo: Periodo;
  titulo: string;
  subtitulo: string;
  itemIds: [number, number];
  fonte: 'padrao' | 'historico';
};

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
    titulo: 'Combo café da manhã',
    subtitulo: 'Pra começar bem o dia',
    itemIds: [1, 4], // Café Espresso + Pão de Queijo
    fonte: 'padrao',
  },
  almoco: {
    periodo: 'almoco',
    titulo: 'Combo do almoço',
    subtitulo: 'Bem pesado pra dar conta da tarde',
    itemIds: [6, 3], // X-Burger + Suco
    fonte: 'padrao',
  },
  tarde: {
    periodo: 'tarde',
    titulo: 'Combo café da tarde',
    subtitulo: 'Aquela pausa que merece',
    itemIds: [2, 5], // Cappuccino + Coxinha
    fonte: 'padrao',
  },
  noite: {
    periodo: 'noite',
    titulo: 'Combo lanche da noite',
    subtitulo: 'Pra quem ainda tá na firma',
    itemIds: [7, 2], // Misto Quente + Cappuccino
    fonte: 'padrao',
  },
};

/**
 * Gera o combo recomendado pro horário atual. Se o usuário tem histórico
 * com items repetidos (≥2 pedidos do mesmo item), substitui o combo padrão
 * pelos 2 itens mais frequentes — recomendação personalizada.
 */
export function getComboRecomendado(
  periodo: Periodo,
  orders: Order[],
): Combo {
  const base = COMBOS_PADRAO[periodo];

  if (orders.length < 2) {
    return base;
  }

  const contagem = new Map<number, number>();
  for (const order of orders) {
    for (const ci of order.items) {
      contagem.set(ci.itemId, (contagem.get(ci.itemId) ?? 0) + ci.quantidade);
    }
  }

  const topDois = Array.from(contagem.entries())
    .filter(([, qtd]) => qtd >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  if (topDois.length < 2) {
    return base;
  }

  const [a, b] = topDois;
  if (a === undefined || b === undefined) return base;

  return {
    periodo,
    titulo: 'Seus favoritos',
    subtitulo: 'Os items que você mais pede',
    itemIds: [a, b],
    fonte: 'historico',
  };
}

/**
 * Calcula o preço total do combo somando os 2 items.
 * Retorna 0 se algum item não for encontrado.
 */
export function precoCombo(combo: Combo, cardapio: ItemCardapio[]): number {
  const a = cardapio.find((i) => i.id === combo.itemIds[0]);
  const b = cardapio.find((i) => i.id === combo.itemIds[1]);
  return (a?.preco ?? 0) + (b?.preco ?? 0);
}
