// Testes da lógica de recomendação de combo importando o módulo de produção.
// Usa --experimental-strip-types (Node 22+) para importar .ts diretamente.
// As importações de tipo-only em recomendacao.ts (@cantina/shared, @/types) são
// eliminadas pelo strip-types — sem dependência de runtime.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCombosDisponiveis,
  getComboRecomendado,
  getPeriodoAtual,
} from '../lib/recomendacao.ts';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// allItems: shape mínimo compatível com Item de @cantina/shared
// IDs são strings fake que simulam cuid2 — o que importa é a correspondência
// com os orderItems abaixo.
const ALL_ITEMS = [
  { id: 'item-1', slug: 'cafe-espresso',    name: 'Café Espresso',   preco: '5.00' },
  { id: 'item-2', slug: 'pao-de-queijo',    name: 'Pão de Queijo',   preco: '4.50' },
  { id: 'item-3', slug: 'x-burger',         name: 'X-Burger',        preco: '12.00' },
  { id: 'item-4', slug: 'suco-natural',     name: 'Suco Natural',    preco: '7.00' },
  { id: 'item-5', slug: 'croissant',        name: 'Croissant',       preco: '8.00' },
  { id: 'item-6', slug: 'cappuccino',       name: 'Cappuccino',      preco: '8.00' },
  { id: 'item-7', slug: 'coxinha',          name: 'Coxinha',         preco: '6.00' },
  { id: 'item-8', slug: 'salada-caesar',    name: 'Salada Caesar',   preco: '14.00' },
];

/**
 * Cria um Order com shape compatível com `Order` de @cantina/shared.
 * itemIdsList: array de item IDs (strings) que compõem o pedido.
 */
function makeOrder(itemIdsList, dataIso = '2026-04-29T10:00:00') {
  return {
    id: `order-${Math.random()}`,
    userId: 'user-1',
    status: 'pendente',
    itens: itemIdsList.map((itemId) => ({ itemId, quantidade: 1 })),
    criadoEm: dataIso,
    atualizadoEm: dataIso,
  };
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

test('getPeriodoAtual classifica horários corretamente', () => {
  assert.equal(getPeriodoAtual(new Date('2026-04-29T08:00:00')), 'manha');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T13:00:00')), 'almoco');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T16:00:00')), 'tarde');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T22:00:00')), 'noite');
  assert.equal(getPeriodoAtual(new Date('2026-04-29T03:00:00')), 'noite');
});

test('getCombosDisponiveis — sem histórico retorna padrao + alternativo', () => {
  const lista = getCombosDisponiveis('almoco', [], [], ALL_ITEMS);
  assert.equal(lista.length, 2);
  assert.equal(lista[0].fonte, 'padrao');
  assert.equal(lista[1].fonte, 'alternativo');
  // itemSlugs são arrays de 2 strings
  assert.equal(lista[0].itemSlugs.length, 2);
  assert.ok(typeof lista[0].itemSlugs[0] === 'string');
});

test('getCombosDisponiveis — histórico forte inclui combo personalizado primeiro', () => {
  // item-3 = x-burger, item-4 = suco-natural aparecem 2+ vezes nas ordens recentes
  const orders = [
    makeOrder(['item-3', 'item-4'], '2026-04-29T12:00:00'),
    makeOrder(['item-3', 'item-4'], '2026-04-28T12:00:00'),
    makeOrder(['item-3', 'item-7'], '2026-04-27T12:00:00'),
  ];
  const lista = getCombosDisponiveis('almoco', orders, [], ALL_ITEMS);
  assert.equal(lista[0].fonte, 'historico');
  // O combo deve conter os slugs de item-3 e item-4
  const slugsHistorico = [...lista[0].itemSlugs].sort();
  assert.deepEqual(slugsHistorico, ['suco-natural', 'x-burger']);
});

test('getCombosDisponiveis — histórico com só 1 pedido NÃO gera combo personalizado', () => {
  const orders = [makeOrder(['item-3', 'item-4'])];
  const lista = getCombosDisponiveis('almoco', orders, [], ALL_ITEMS);
  assert.equal(lista[0].fonte, 'padrao');
});

test('getCombosDisponiveis — filtro de carrinho: exclui combo cujo par completo está no cart', () => {
  // combo padrão do almoço = ['x-burger', 'suco-natural']
  const cartSlugs = ['x-burger', 'suco-natural'];
  const lista = getCombosDisponiveis('almoco', [], cartSlugs, ALL_ITEMS);
  // o padrão do almoço deve sumir
  const temPadrao = lista.some(
    (c) => c.itemSlugs.includes('x-burger') && c.itemSlugs.includes('suco-natural'),
  );
  assert.equal(temPadrao, false);
  // mas ainda há ao menos 1 combo (fallback)
  assert.ok(lista.length >= 1);
});

test('getCombosDisponiveis — mantém combo se só 1 dos itens está no carrinho', () => {
  const lista = getCombosDisponiveis('almoco', [], ['x-burger'], ALL_ITEMS);
  // padrão do almoço tem x-burger mas não o par completo — deve aparecer
  assert.ok(lista.some((c) => c.fonte === 'padrao'));
});

test('getCombosDisponiveis — fallback para padrão se tudo foi filtrado', () => {
  // almoco padrão = [x-burger, suco-natural], alt = [salada-caesar, suco-natural]
  const cartSlugs = ['x-burger', 'suco-natural', 'salada-caesar'];
  const lista = getCombosDisponiveis('almoco', [], cartSlugs, ALL_ITEMS);
  // só 1 resultado: fallback padrão
  assert.equal(lista.length, 1);
  assert.equal(lista[0].fonte, 'padrao');
});

test('getCombosDisponiveis — dedup: mesmo par de slugs aparece só 1x', () => {
  // café-espresso + pao-de-queijo é o combo padrão da manhã.
  // Se o histórico resolver para o mesmo par, não deve duplicar.
  const orders = [
    makeOrder(['item-1', 'item-2'], '2026-04-29T08:00:00'),
    makeOrder(['item-1', 'item-2'], '2026-04-28T08:00:00'),
    makeOrder(['item-1', 'item-5'], '2026-04-27T08:00:00'),
  ];
  const lista = getCombosDisponiveis('manha', orders, [], ALL_ITEMS);
  const pares = lista.map((c) => [...c.itemSlugs].sort().join('|'));
  const unicos = new Set(pares);
  assert.equal(pares.length, unicos.size);
});

test('getComboRecomendado — retorna sempre 1 combo', () => {
  const combo = getComboRecomendado('tarde', [], ALL_ITEMS);
  assert.ok(combo);
  assert.equal(combo.itemSlugs.length, 2);
  assert.ok(['padrao', 'historico', 'alternativo'].includes(combo.fonte));
});
