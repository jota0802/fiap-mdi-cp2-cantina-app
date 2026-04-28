import type { ItemCardapio } from '@/types';

const UNSPLASH_PARAMS = '?w=240&h=240&fit=crop&q=80';

const CARDAPIO: ItemCardapio[] = [
  {
    id: 1,
    nome: 'Café Espresso',
    preco: 5.0,
    descricao: 'Café forte e encorpado',
    emoji: '☕',
    imagem: `https://images.unsplash.com/photo-1510707577719-ae7c14805e3a${UNSPLASH_PARAMS}`,
    categoria: 'Bebidas',
  },
  {
    id: 2,
    nome: 'Cappuccino',
    preco: 8.0,
    descricao: 'Com espuma cremosa',
    emoji: '☕',
    imagem: `https://images.unsplash.com/photo-1572442388796-11668a67e53d${UNSPLASH_PARAMS}`,
    categoria: 'Bebidas',
  },
  {
    id: 3,
    nome: 'Suco Natural',
    preco: 7.0,
    descricao: 'Laranja, limão ou maracujá',
    emoji: '🧃',
    imagem: `https://images.unsplash.com/photo-1546549032-9571cd6b27df${UNSPLASH_PARAMS}`,
    categoria: 'Bebidas',
  },
  {
    id: 4,
    nome: 'Pão de Queijo',
    preco: 4.5,
    descricao: 'Quentinho e crocante',
    emoji: '🧀',
    imagem: `https://images.unsplash.com/photo-1518779578993-ec3579fee39f${UNSPLASH_PARAMS}`,
    categoria: 'Lanches',
  },
  {
    id: 5,
    nome: 'Coxinha',
    preco: 6.0,
    descricao: 'Frango com catupiry',
    emoji: '🍗',
    imagem: `https://images.unsplash.com/photo-1559847844-5315695dadae${UNSPLASH_PARAMS}`,
    categoria: 'Lanches',
  },
  {
    id: 6,
    nome: 'X-Burger',
    preco: 12.0,
    descricao: 'Hambúrguer artesanal completo',
    emoji: '🍔',
    imagem: `https://images.unsplash.com/photo-1568901346375-23c9450c58cd${UNSPLASH_PARAMS}`,
    categoria: 'Lanches',
  },
  {
    id: 7,
    nome: 'Misto Quente',
    preco: 8.5,
    descricao: 'Presunto e queijo na chapa',
    emoji: '🥪',
    imagem: `https://images.unsplash.com/photo-1528736235302-52922df5c122${UNSPLASH_PARAMS}`,
    categoria: 'Lanches',
  },
  {
    id: 8,
    nome: 'Açaí Bowl',
    preco: 15.0,
    descricao: 'Com granola e banana',
    emoji: '🍇',
    imagem: `https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea${UNSPLASH_PARAMS}`,
    categoria: 'Sobremesas',
  },
];

export default CARDAPIO;
