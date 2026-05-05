// Re-exporta tipos da API. Mobile nao define mais ItemCardapio/Categoria localmente.
export type { Item, Categoria, OrderStatus, OrderItemDto, Order, CreateOrderInput } from '@cantina/shared';

// Alias de retrocompatibilidade — consumers que importavam ItemCardapio continuam
// funcionando. Phase 7.2 vai substituir os usos restantes por `Item` diretamente
// e entao remover este alias.
import type { Item } from '@cantina/shared';
export type ItemCardapio = Item;

// Tag — API retorna tags como string[]. Mobile precisa do tipo union so para
// indexar tagPalette em constants/theme.ts. API nao impoe este enum.
export type Tag =
  | 'vegano'
  | 'vegetariano'
  | 'sem-gluten'
  | 'sem-lactose'
  | 'quente'
  | 'frio'
  | 'popular'
  | 'novo';

// CartItem agora usa string itemId (cuid2 vindo da API).
export type CartItem = {
  itemId: string;
  quantidade: number;
};

// User fica com shape mobile (traduzido na fronteira do AuthContext — Task 6.2).
export type User = {
  id: string;
  nome: string;
  email: string;
  fotoUri?: string;
  criadoEm: string;
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
