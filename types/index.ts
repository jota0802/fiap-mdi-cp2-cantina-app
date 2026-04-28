export type Categoria = 'Bebidas' | 'Lanches' | 'Sobremesas';

export type ItemCardapio = {
  id: number;
  nome: string;
  preco: number;
  descricao: string;
  emoji: string;
  imagem?: string;
  categoria: Categoria;
};

export type CartItem = {
  itemId: number;
  quantidade: number;
};

export type User = {
  id: string;
  nome: string;
  email: string;
  fotoUri?: string;
  criadoEm: string;
};

export type Order = {
  id: string;
  userId: string;
  senha: number;
  items: CartItem[];
  total: number;
  resumo: string;
  criadoEm: string;
  status: 'pendente' | 'pronto' | 'retirado';
};

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  card: string;
  cardElevated: string;
  border: string;
  borderStrong: string;
  separator: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryDeep: string;
  primaryText: string;
  primarySoft: string;
  success: string;
  error: string;
  overlay: string;
  tabBar: string;
  inputBg: string;
};

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;
