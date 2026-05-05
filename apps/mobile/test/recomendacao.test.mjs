// Testes da lógica de recomendação de combo (lib/recomendacao.ts) replicada
// em Node puro. Foca nas regras críticas: período, recência, filtragem de
// items já no carrinho, e fallback para o combo padrão.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const RECENCY_WINDOW = 10;

function getPeriodoAtual(date) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'manha';
  if (h >= 11 && h < 15) return 'almoco';
  if (h >= 15 && h < 19) return 'tarde';
  return 'noite';
}

const COMBOS_PADRAO = {
  manha: { periodo: 'manha', itemIds: [1, 4], fonte: 'padrao' },
  almoco: { periodo: 'almoco', itemIds: [6, 3], fonte: 'padrao' },
  tarde: { periodo: 'tarde', itemIds: [2, 5], fonte: 'padrao' },
  noite: { periodo: 'noite', itemIds: [7, 2], fonte: 'padrao' },
};
const COMBOS_ALT = {
  manha: { periodo: 'manha', itemIds: [12, 1], fonte: 'alternativo' },
  almoco: { periodo: 'almoco', itemIds: [10, 3], fonte: 'alternativo' },
  tarde: { periodo: 'tarde', itemIds: [9, 2], fonte: 'alternativo' },
  noite: { periodo: 'noite', itemIds: [8, 11], fonte: 'alternativo' },
};

function getComboHistorico(periodo, orders) {
  const recentes = [...orders]
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, RECENCY_WINDOW);
  if (recentes.length < 2) return null;
  const contagem = new Map();
  for (const order of recentes) {
    for (const ci of order.items) {
      contagem.set(ci.itemId, (contagem.get(ci.itemId) ?? 0) + ci.quantidade);
    }
  }
  const top = Array.from(contagem.entries())
    .filter(([, q]) => q >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);
  if (top.length < 2) return null;
  return { periodo, itemIds: [top[0], top[1]], fonte: 'historico' };
}

function getCombosDisponiveis(periodo, orders, cartItemIds = []) {
  const cartSet = new Set(cartItemIds);
  const cand = [];
  const h = getComboHistorico(periodo, orders);
  if (h) cand.push(h);
  cand.push(COMBOS_PADRAO[periodo]);
  cand.push(COMBOS_ALT[periodo]);
  const filt = cand.filter(
    (c) => !(cartSet.has(c.itemIds[0]) && cartSet.has(c.itemIds[1])),
  );
  const visto = new Set();
  const unicos = [];
  for (const c of filt) {
    const k = [c.itemIds[0], c.itemIds[1]].sort().join('|');
    if (visto.has(k)) continue;
    visto.add(k);
    unicos.push(c);
  }
  return unicos.length > 0 ? unicos : [COMBOS_PADRAO[periodo]];
}

function makeOrder(itemIds, dataIso = '2026-04-29T10:00:00') {
  return {
    items: itemIds.map((id) => ({ itemId: id, quantidade: 1 })),
    criadoEm: dataIso,
  };
}

test('getPeriodoAtual classifica horários corretamente', () => {
  assert.equal(getPeriodoAtual(new Date('2026-04-29T08:00:00')), 'manha');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T13:00:00')), 'almoco');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T16:00:00')), 'tarde');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T22:00:00')), 'noite');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T03:00:00')), 'noite');
});

test('sem histórico retorna apenas padrão + alternativo', () => {
  const lista = getCombosDisponiveis('almoco', []);
  assert.equal(lista.length, 2);
  assert.equal(lista[0].fonte, 'padrao');
  assert.equal(lista[1].fonte, 'alternativo');
});

test('com histórico forte (≥2 itens recorrentes) inclui combo personalizado primeiro', () => {
  const orders = [
    makeOrder([6, 4], '2026-04-29T12:00:00'),
    makeOrder([6, 4], '2026-04-28T12:00:00'),
    makeOrder([6, 5], '2026-04-27T12:00:00'),
  ];
  const lista = getCombosDisponiveis('almoco', orders);
  assert.equal(lista[0].fonte, 'historico');
  // 6 e 4 são os mais frequentes
  assert.deepEqual([...lista[0].itemIds].sort(), [4, 6]);
});

test('histórico com só 1 pedido NÃO gera combo personalizado', () => {
  const orders = [makeOrder([6, 4])];
  const lista = getCombosDisponiveis('almoco', orders);
  assert.equal(lista[0].fonte, 'padrao');
});

test('respeita janela de recência (RECENCY_WINDOW=10)', () => {
  // 50 pedidos antigos com [7,8] + 10 pedidos recentes com [1,4].
  // Como só os 10 mais recentes contam, [1,4] vence completamente.
  const antigos = Array.from({ length: 50 }, (_, i) =>
    makeOrder([7, 8], `2025-01-01T10:${String(i % 60).padStart(2, '0')}:00`),
  );
  const recentes = Array.from({ length: 10 }, (_, i) =>
    makeOrder([1, 4], `2026-04-${String(20 + (i % 9)).padStart(2, '0')}T10:00:00`),
  );
  const lista = getCombosDisponiveis('manha', [...antigos, ...recentes]);
  assert.equal(lista[0].fonte, 'historico');
  assert.deepEqual([...lista[0].itemIds].sort(), [1, 4]);
});

test('descarta combo cujo par inteiro está no carrinho', () => {
  // Combo padrão do almoço é [6,3]. Se ambos no carrinho, sumir.
  const lista = getCombosDisponiveis('almoco', [], [6, 3]);
  assert.ok(lista.every((c) => !(c.itemIds[0] === 6 && c.itemIds[1] === 3)));
  assert.ok(lista.length >= 1);
});

test('mantém combo se só 1 dos itens está no carrinho', () => {
  const lista = getCombosDisponiveis('almoco', [], [6]);
  assert.ok(lista.some((c) => c.fonte === 'padrao'));
});

test('fallback para padrão se tudo foi filtrado', () => {
  // Coloca todos os itens dos combos do almoço no carrinho.
  const lista = getCombosDisponiveis('almoco', [], [6, 3, 10]);
  assert.equal(lista.length, 1);
  assert.equal(lista[0].fonte, 'padrao'); // fallback final
});

test('dedup: combos com mesmo par (em qualquer ordem) aparecem só 1x', () => {
  // Manha: padrao=[1,4], alt=[12,1]. Forçar histórico [4,1] que coincide com padrão.
  const orders = [
    makeOrder([1, 4]),
    makeOrder([1, 4]),
    makeOrder([1, 5]),
  ];
  const lista = getCombosDisponiveis('manha', orders);
  // Não deve haver 2 combos com par {1,4}
  const pares = lista.map((c) => [...c.itemIds].sort().join(','));
  const unicos = new Set(pares);
  assert.equal(pares.length, unicos.size);
});
