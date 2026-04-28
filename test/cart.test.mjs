// Testes da lógica do carrinho (CartContext) replicada em Node puro.
// Garante que as fórmulas de totalItens, totalPreco e a manipulação
// imutável dos items funcionam para todos os cenários do CP2.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const CARDAPIO = [
  { id: 1, nome: 'Café Espresso', preco: 5.0, categoria: 'Bebidas' },
  { id: 2, nome: 'Cappuccino', preco: 8.0, categoria: 'Bebidas' },
  { id: 3, nome: 'Suco Natural', preco: 7.0, categoria: 'Bebidas' },
  { id: 4, nome: 'Pão de Queijo', preco: 4.5, categoria: 'Lanches' },
  { id: 5, nome: 'Coxinha', preco: 6.0, categoria: 'Lanches' },
  { id: 6, nome: 'X-Burger', preco: 12.0, categoria: 'Lanches' },
  { id: 7, nome: 'Misto Quente', preco: 8.5, categoria: 'Lanches' },
  { id: 8, nome: 'Açaí Bowl', preco: 15.0, categoria: 'Sobremesas' },
];

function addItem(items, itemId) {
  const existing = items.find((i) => i.itemId === itemId);
  if (existing) {
    return items.map((i) =>
      i.itemId === itemId ? { ...i, quantidade: i.quantidade + 1 } : i,
    );
  }
  return [...items, { itemId, quantidade: 1 }];
}

function removeItem(items, itemId) {
  const existing = items.find((i) => i.itemId === itemId);
  if (!existing) return items;
  if (existing.quantidade <= 1) {
    return items.filter((i) => i.itemId !== itemId);
  }
  return items.map((i) =>
    i.itemId === itemId ? { ...i, quantidade: i.quantidade - 1 } : i,
  );
}

function totalItens(items) {
  return items.reduce((acc, i) => acc + i.quantidade, 0);
}

function totalPreco(items) {
  return items.reduce((acc, ci) => {
    const item = CARDAPIO.find((i) => i.id === ci.itemId);
    return acc + (item?.preco ?? 0) * ci.quantidade;
  }, 0);
}

function buildResumo(items) {
  return items
    .map((ci) => {
      const item = CARDAPIO.find((i) => i.id === ci.itemId);
      return `${ci.quantidade}x ${item?.nome ?? ''}`;
    })
    .join(', ');
}

function buscar(termo) {
  const t = termo.trim().toLowerCase();
  if (!t) return CARDAPIO;
  return CARDAPIO.filter(
    (i) =>
      i.nome.toLowerCase().includes(t) ||
      i.categoria.toLowerCase().includes(t),
  );
}

test('carrinho começa vazio', () => {
  const c = [];
  assert.equal(totalItens(c), 0);
  assert.equal(totalPreco(c), 0);
});

test('addItem adiciona item novo com quantidade 1', () => {
  const c = addItem([], 1);
  assert.deepEqual(c, [{ itemId: 1, quantidade: 1 }]);
  assert.equal(totalItens(c), 1);
  assert.equal(totalPreco(c), 5.0);
});

test('addItem incrementa quantidade quando item já existe', () => {
  let c = addItem([], 1);
  c = addItem(c, 1);
  c = addItem(c, 1);
  assert.deepEqual(c, [{ itemId: 1, quantidade: 3 }]);
  assert.equal(totalItens(c), 3);
  assert.equal(totalPreco(c), 15.0);
});

test('removeItem decrementa quantidade ou remove o item', () => {
  let c = [{ itemId: 6, quantidade: 2 }];
  c = removeItem(c, 6);
  assert.deepEqual(c, [{ itemId: 6, quantidade: 1 }]);
  c = removeItem(c, 6);
  assert.deepEqual(c, []);
});

test('removeItem em item inexistente não quebra', () => {
  const c = removeItem([], 99);
  assert.deepEqual(c, []);
});

test('totalPreco soma corretamente itens variados', () => {
  const c = [
    { itemId: 1, quantidade: 2 }, // 2 x 5.00 = 10.00
    { itemId: 6, quantidade: 1 }, // 1 x 12.00 = 12.00
    { itemId: 8, quantidade: 1 }, // 1 x 15.00 = 15.00
  ];
  assert.equal(totalItens(c), 4);
  assert.equal(totalPreco(c), 37.0);
});

test('totalPreco ignora itemId desconhecido', () => {
  const c = [{ itemId: 999, quantidade: 5 }];
  assert.equal(totalPreco(c), 0);
});

test('buildResumo formata como "QTDx Nome, ..."', () => {
  const c = [
    { itemId: 5, quantidade: 2 },
    { itemId: 1, quantidade: 1 },
  ];
  assert.equal(buildResumo(c), '2x Coxinha, 1x Café Espresso');
});

test('busca filtra por nome (case-insensitive)', () => {
  assert.equal(buscar('coxinha').length, 1);
  assert.equal(buscar('COXINHA').length, 1);
  assert.equal(buscar('café').length, 1);
});

test('busca filtra por categoria', () => {
  assert.equal(buscar('lanches').length, 4);
  assert.equal(buscar('bebidas').length, 3);
});

test('busca vazia retorna o cardápio inteiro', () => {
  assert.equal(buscar('').length, CARDAPIO.length);
  assert.equal(buscar('   ').length, CARDAPIO.length);
});

test('busca sem resultado retorna array vazio', () => {
  assert.deepEqual(buscar('pizza'), []);
});

test('imutabilidade — addItem nunca muta o array original', () => {
  const original = [{ itemId: 1, quantidade: 1 }];
  const novo = addItem(original, 1);
  assert.notEqual(original, novo);
  assert.equal(original[0].quantidade, 1); // intacto
  assert.equal(novo[0].quantidade, 2);
});
