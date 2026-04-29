import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, useColorScheme, View } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { palette } from '@/constants/theme';
import type { ThemeColors, ThemeMode } from '@/types';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isHydrated: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const FADE_DURATION_MS = 320;

type ProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'light' ? 'light' : 'dark');
  const [isHydrated, setIsHydrated] = useState(false);

  // Cross-fade — overlay do tema antigo dissolve enquanto a nova paleta entra
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState<string | null>(null);

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

  const animateTransition = useCallback(
    (fromMode: ThemeMode) => {
      // Captura a cor de fundo atual e cobre a tela com ela.
      // Em seguida fade pra 0, revelando a paleta nova por baixo.
      setOverlayColor(palette[fromMode].bg);
      overlayOpacity.setValue(1);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setOverlayColor(null);
      });
    },
    [overlayOpacity],
  );

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setMode((prev) => {
        if (prev !== next) animateTransition(prev);
        return next;
      });
      persistMode(next);
    },
    [animateTransition, persistMode],
  );

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      animateTransition(prev);
      persistMode(next);
      return next;
    });
  }, [animateTransition, persistMode]);

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

  return (
    <ThemeContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {overlayColor ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              styles.overlay,
              { backgroundColor: overlayColor, opacity: overlayOpacity },
            ]}
          />
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { zIndex: 9999 },
});

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
