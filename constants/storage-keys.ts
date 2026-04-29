export const STORAGE_KEYS = {
  USERS: '@cantina:users',
  SESSION: '@cantina:session',
  ORDERS: '@cantina:orders',
  CART: '@cantina:cart',
  THEME: '@cantina:theme',
  PROFILE_PHOTO: '@cantina:profile_photo',
  ONBOARDED: '@cantina:onboarded',
  FAVORITES: '@cantina:favorites',
  LOCALE: '@cantina:locale',
} as const;

export const SECURE_KEYS = {
  PASSWORD_HASH: 'cantina.password_hash',
  SESSION_TOKEN: 'cantina.session_token',
} as const;
