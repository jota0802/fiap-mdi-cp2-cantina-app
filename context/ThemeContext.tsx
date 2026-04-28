import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { palette } from '@/constants/theme';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { ThemeColors, ThemeMode } from '@/types';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isHydrated: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'light' ? 'light' : 'dark');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.THEME)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark') {
          setMode(stored);
        }
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistMode = useCallback((next: ThemeMode) => {
    AsyncStorage.setItem(STORAGE_KEYS.THEME, next).catch(() => {
      // armazenamento opcional — falha silenciosa não impacta a UX
    });
  }, []);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setMode(next);
      persistMode(next);
    },
    [persistMode],
  );

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      persistMode(next);
      return next;
    });
  }, [persistMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: palette[mode],
      isHydrated,
      toggleTheme,
      setTheme,
    }),
    [mode, isHydrated, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
