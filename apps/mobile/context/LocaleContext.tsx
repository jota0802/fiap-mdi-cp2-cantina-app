import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { interpolate, LOCALES, translate, type Locale } from '@/lib/i18n';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isHydrated: boolean;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

type ProviderProps = { children: ReactNode };

export function LocaleProvider({ children }: ProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('pt');
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidrata o idioma salvo no boot
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.LOCALE)
      .then((stored) => {
        if (cancelled) return;
        if (isLocale(stored)) setLocaleState(stored);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(STORAGE_KEYS.LOCALE, l).catch(() => {
      // persistencia opcional — nao bloqueia UX
    });
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = translate(locale, key);
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t, isHydrated }),
    [locale, setLocale, t, isHydrated],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale deve ser usado dentro de <LocaleProvider>');
  }
  return ctx;
}
