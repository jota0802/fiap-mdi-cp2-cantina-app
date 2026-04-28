import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';
import { STORAGE_KEYS } from '@/constants/storage-keys';

type FavoritesContextValue = {
  favoritos: number[];
  isFavorito: (itemId: number) => boolean;
  toggleFavorito: (itemId: number) => void;
  totalFavoritos: number;
  isHydrated: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function favoritesKey(userId: string): string {
  return `${STORAGE_KEYS.FAVORITES}:${userId}`;
}

type ProviderProps = { children: ReactNode };

export function FavoritesProvider({ children }: ProviderProps) {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidrata favoritos a cada mudança de usuário
  useEffect(() => {
    let cancelled = false;
    setIsHydrated(false);

    if (!user) {
      setFavoritos([]);
      setIsHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    AsyncStorage.getItem(favoritesKey(user.id))
      .then((stored) => {
        if (cancelled) return;
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as unknown;
            if (Array.isArray(parsed)) {
              setFavoritos(parsed.filter((id): id is number => typeof id === 'number'));
            } else {
              setFavoritos([]);
            }
          } catch {
            setFavoritos([]);
          }
        } else {
          setFavoritos([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persiste alterações após hidratar
  useEffect(() => {
    if (!isHydrated || !user) return;
    AsyncStorage.setItem(favoritesKey(user.id), JSON.stringify(favoritos)).catch(() => {
      // armazenamento falha silenciosamente
    });
  }, [favoritos, isHydrated, user]);

  const isFavorito = useCallback(
    (itemId: number) => favoritos.includes(itemId),
    [favoritos],
  );

  const toggleFavorito = useCallback((itemId: number) => {
    setFavoritos((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoritos,
      isFavorito,
      toggleFavorito,
      totalFavoritos: favoritos.length,
      isHydrated,
    }),
    [favoritos, isFavorito, toggleFavorito, isHydrated],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites deve ser usado dentro de <FavoritesProvider>');
  }
  return ctx;
}
