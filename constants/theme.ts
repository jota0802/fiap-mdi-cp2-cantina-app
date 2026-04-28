import type { ThemeColors, ThemeMode } from '@/types';

export const FIAP_PRIMARY = '#ED145B';

export const palette: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: '#0A0A0A',
    card: '#111111',
    cardElevated: '#1A1A1A',
    border: '#1A1A1A',
    text: '#FFFFFF',
    textMuted: '#666666',
    textSubtle: '#444444',
    primary: FIAP_PRIMARY,
    primaryText: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: '#0A0A0A',
    inputBg: '#111111',
  },
  light: {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    cardElevated: '#F4F4F5',
    border: '#EAEAEA',
    text: '#0A0A0A',
    textMuted: '#666666',
    textSubtle: '#999999',
    primary: FIAP_PRIMARY,
    primaryText: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    overlay: 'rgba(0,0,0,0.4)',
    tabBar: '#FFFFFF',
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

export type StatusKey = 'pendente' | 'pronto' | 'retirado';

export type StatusPalette = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: 'time-outline' | 'checkmark-circle-outline' | 'bag-check-outline';
};

/**
 * Cores semânticas para os status de pedido (laranja preparando,
 * verde pronto, cinza retirado). Funciona em dark e light theme.
 */
export const statusPalette: Record<StatusKey, StatusPalette> = {
  pendente: {
    label: 'PREPARANDO',
    color: '#F59E0B', // amber-500
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: 'time-outline',
  },
  pronto: {
    label: 'PRONTO',
    color: '#10B981', // emerald-500
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.45)',
    icon: 'checkmark-circle-outline',
  },
  retirado: {
    label: 'RETIRADO',
    color: '#6B7280', // gray-500
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.35)',
    icon: 'bag-check-outline',
  },
};
