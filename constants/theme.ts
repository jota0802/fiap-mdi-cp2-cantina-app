import type { ThemeColors, ThemeMode } from '@/types';

export const FIAP_PRIMARY = '#ED145B';
export const FIAP_PRIMARY_DEEP = '#B8104A';
export const FIAP_PRIMARY_GRADIENT_END = '#FF4F8B';

export const palette: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: '#0E0E16',
    bgElevated: '#13131F',
    surface: '#181826',
    surfaceElevated: '#1F1F30',
    surfaceHover: '#26263A',
    card: '#181826',
    cardElevated: '#1F1F30',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    separator: 'rgba(255,255,255,0.04)',
    text: '#F5F5F7',
    textMuted: '#A0A0B0',
    textSubtle: '#6B6B80',
    primary: FIAP_PRIMARY,
    primaryDeep: FIAP_PRIMARY_DEEP,
    primaryText: '#FFFFFF',
    primarySoft: 'rgba(237, 20, 91, 0.14)',
    success: '#10B981',
    error: '#F87171',
    errorSoft: 'rgba(248, 113, 113, 0.14)',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: 'rgba(14, 14, 22, 0.85)',
    inputBg: '#181826',
  },
  light: {
    bg: '#F7F7F8',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F2F2F4',
    card: '#FFFFFF',
    cardElevated: '#FAFAFB',
    border: 'rgba(10, 10, 20, 0.06)',
    borderStrong: 'rgba(10, 10, 20, 0.12)',
    separator: 'rgba(10, 10, 20, 0.04)',
    text: '#0A0A14',
    textMuted: '#5C5C70',
    textSubtle: '#9090A0',
    primary: FIAP_PRIMARY,
    primaryDeep: FIAP_PRIMARY_DEEP,
    primaryText: '#FFFFFF',
    primarySoft: 'rgba(237, 20, 91, 0.10)',
    success: '#059669',
    error: '#DC2626',
    errorSoft: 'rgba(220, 38, 38, 0.10)',
    overlay: 'rgba(10, 10, 20, 0.4)',
    tabBar: 'rgba(255, 255, 255, 0.85)',
    inputBg: '#FFFFFF',
  },
};

export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const fontSize = {
  xs: 10,
  sm: 11,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 32,
  '5xl': 48,
  '6xl': 72,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

export const letterSpacing = {
  tight: 0,
  normal: 1,
  wide: 2,
  wider: 3,
  widest: 4,
  ultra: 6,
} as const;

/**
 * Sombras por nível de elevação. Cada level retorna o objeto de estilo
 * pronto para spread em StyleSheet — inclui versão iOS (shadow*) e Android (elevation).
 * Usar com parcimônia: zero em dark, ~level 1-2 em light theme.
 */
export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  primary: {
    shadowColor: FIAP_PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export type StatusKey = 'pendente' | 'pronto' | 'retirado' | 'cancelado';

export type StatusPalette = {
  /** Chave i18n — consumer chama t(labelKey) e .toUpperCase() se quiser. */
  labelKey: string;
  color: string;
  bg: string;
  border: string;
  icon:
    | 'time-outline'
    | 'checkmark-circle-outline'
    | 'bag-check-outline'
    | 'close-circle-outline';
};

/**
 * Cores semânticas para os status de pedido. Funciona em dark e light theme.
 * Os labels saem via i18n (labelKey) — telas chamam t(palette.labelKey).
 */
export const statusPalette: Record<StatusKey, StatusPalette> = {
  pendente: {
    labelKey: 'status.pendente',
    color: '#F59E0B', // amber-500
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: 'time-outline',
  },
  pronto: {
    labelKey: 'status.pronto',
    color: '#10B981', // emerald-500
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.45)',
    icon: 'checkmark-circle-outline',
  },
  retirado: {
    labelKey: 'status.retirado',
    color: '#6B7280', // gray-500
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.35)',
    icon: 'bag-check-outline',
  },
  cancelado: {
    labelKey: 'status.cancelado',
    color: '#9CA3AF', // gray-400
    bg: 'rgba(156, 163, 175, 0.10)',
    border: 'rgba(156, 163, 175, 0.30)',
    icon: 'close-circle-outline',
  },
};

export type TagKey =
  | 'vegano'
  | 'vegetariano'
  | 'sem-gluten'
  | 'sem-lactose'
  | 'quente'
  | 'frio'
  | 'popular'
  | 'novo';

export type TagInfo = {
  /** Chave i18n — consumer chama t(labelKey). */
  labelKey: string;
  color: string;
  bg: string;
};

/**
 * Cores para tags de itens do cardápio (vegano verde, picante laranja, etc.).
 * Usados como pequenos chips abaixo da descrição dos itens.
 * Os labels saem via i18n (labelKey).
 */
export const tagPalette: Record<TagKey, TagInfo> = {
  vegano: { labelKey: 'tag.vegano', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.12)' },
  vegetariano: {
    labelKey: 'tag.vegetariano',
    color: '#65A30D',
    bg: 'rgba(101, 163, 13, 0.12)',
  },
  'sem-gluten': {
    labelKey: 'tag.sem-gluten',
    color: '#0891B2',
    bg: 'rgba(8, 145, 178, 0.12)',
  },
  'sem-lactose': {
    labelKey: 'tag.sem-lactose',
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.12)',
  },
  quente: { labelKey: 'tag.quente', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.12)' },
  frio: { labelKey: 'tag.frio', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)' },
  popular: {
    labelKey: 'tag.popular',
    color: '#DB2777',
    bg: 'rgba(219, 39, 119, 0.12)',
  },
  novo: { labelKey: 'tag.novo', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' },
};
