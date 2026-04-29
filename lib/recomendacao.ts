import type { ItemCardapio, Order } from '@/types';

export type Periodo = 'manha' | 'almoco' | 'tarde' | 'noite';

export type Combo = {
  periodo: Periodo;
  titulo: string;
  subtitulo: string;
  itemIds: [number, number];
  fonte: 'padrao' | 'historico' | 'alternativo';
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
    titulo: 'Combo café da manhã',
    subtitulo: 'Pra começar bem o dia',
    itemIds: [1, 4],
    fonte: 'padrao',
  },
  almoco: {
    periodo: 'almoco',
    titulo: 'Combo do almoço',
    subtitulo: 'Bem pesado pra dar conta da tarde',
    itemIds: [6, 3],
    fonte: 'padrao',
  },
  tarde: {
    periodo: 'tarde',
    titulo: 'Combo café da tarde',
    subtitulo: 'Aquela pausa que merece',
    itemIds: [2, 5],
    fonte: 'padrao',
  },
  noite: {
    periodo: 'noite',
    titulo: 'Combo lanche da noite',
    subtitulo: 'Pra quem ainda tá na firma',
    itemIds: [7, 2],
    fonte: 'padrao',
  },
};

const COMBOS_ALTERNATIVOS: Record<Periodo, Combo> = {
  manha: {
    periodo: 'manha',
    titulo: 'Quero algo mais leve',
    subtitulo: 'Croissant fresquinho com café',
    itemIds: [12, 1],
    fonte: 'alternativo',
  },
  almoco: {
    periodo: 'almoco',
    titulo: 'Opção mais leve',
    subtitulo: 'Salada Caesar com suco natural',
    itemIds: [10, 3],
    fonte: 'alternativo',
  },
  tarde: {
    periodo: 'tarde',
    titulo: 'Doce e café',
    subtitulo: 'Brigadeiro com cappuccino',
    itemIds: [9, 2],
    fonte: 'alternativo',
  },
  noite: {
    periodo: 'noite',
    titulo: 'Pra refrescar',
    subtitulo: 'Açaí com refrigerante gelado',
    itemIds: [8, 11],
    fonte: 'alternativo',
  },
};

/**
 * Combo personalizado: se o usuário tem ≥2 items recorrentes nos últimos
 * pedidos, sugere os 2 mais frequentes. Considera apenas os pedidos recentes
 * pra não deixar comportamento antigo dominar a sugestão.
 */
function getComboHistorico(
  periodo: Periodo,
  orders: Order[],
): Combo | null {
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
    titulo: 'Seus favoritos',
    subtitulo: `Baseado nos seus últimos ${recentes.length} pedidos`,
    itemIds: [a, b],
    fonte: 'historico',
  };
}

/**
 * Retorna os combos disponíveis pro horário atual, em ordem de prioridade:
 * 1. Personalizado (se houver histórico forte)
 * 2. Combo padrão do período
 * 3. Combo alternativo do período
 *
 * Se `cartItemIds` for passado, descarta combos cujo PAR DE ITENS já está
 * inteiro no carrinho — não tem sentido sugerir o que já foi adicionado.
 * Sempre retorna ao menos 1 combo (fallback no padrão).
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

  // Remove combos cujos 2 itens já estão no carrinho (sugerir item já comprado é ruim)
  const filtrados = candidatos.filter(
    (c) => !(cartSet.has(c.itemIds[0]) && cartSet.has(c.itemIds[1])),
  );

  // Dedup por par (a,b) ignorando ordem
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

/**
 * Retorna o combo recomendado primário (compat com chamadas antigas).
 */
export function getComboRecomendado(
  periodo: Periodo,
  orders: Order[],
): Combo {
  const lista = getCombosDisponiveis(periodo, orders);
  return lista[0] ?? COMBOS_PADRAO[periodo];
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
