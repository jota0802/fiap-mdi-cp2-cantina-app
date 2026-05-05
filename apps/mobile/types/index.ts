export type Categoria = 'Bebidas' | 'Lanches' | 'Sobremesas';

export type Tag =
  | 'vegano'
  | 'vegetariano'
  | 'sem-gluten'
  | 'sem-lactose'
  | 'quente'
  | 'frio'
  | 'popular'
  | 'novo';

export type ItemCardapio = {
  id: number;
  /** Nome em PT (default e fallback). Pratos brasileiros (Pão de Queijo,
   *  Coxinha, etc.) ficam só aqui — não traduzem. */
  nome: string;
  /** Chave i18n opcional pro nome. Se presente, telas exibem t(nomeKey).
   *  Usar em itens internacionais (Cheeseburger, Caesar Salad, etc.). */
  nomeKey?: string;
  preco: number;
  /** Descrição em PT (default). */
  descricao: string;
  /** Chave i18n opcional pra descrição. */
  descricaoKey?: string;
  emoji: string;
  imagem?: string;
  categoria: Categoria;
  tags?: Tag[];
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
  prontoEm?: string;
  status: 'pendente' | 'pronto' | 'retirado' | 'cancelado';
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
  errorSoft: string;
  overlay: string;
  tabBar: string;
  inputBg: string;
};

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;
