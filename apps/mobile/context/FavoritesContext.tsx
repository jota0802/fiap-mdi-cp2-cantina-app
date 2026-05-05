import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import type { Item } from '@cantina/shared';

import { useFavorites as useFavoritesQuery, useToggleFavorite } from '@/lib/api/hooks/use-favorites';
import { useItems } from '@/lib/api/hooks/use-items';

type FavoritesContextValue = {
  favoritos: string[];
  isFavorito: (itemId: string) => boolean;
  toggleFavorito: (itemId: string) => void;
  totalFavoritos: number;
  isHydrated: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useFavoritesQuery();
  const { data: itemsData } = useItems();
  const toggle = useToggleFavorite();

  const favoritos = useMemo(
    () => data?.items.map((i: Item) => i.id) ?? [],
    [data],
  );

  const isFavorito = useCallback(
    (itemId: string) => favoritos.includes(itemId),
    [favoritos],
  );

  const toggleFavorito = useCallback(
    (itemId: string) => {
      const isFav = favoritos.includes(itemId);
      // Look up the full Item from the items cache so the optimistic add can include it.
      // If items not yet loaded, the optimistic update for "add" is a no-op (server reconciles via onSettled).
      const item = itemsData?.items.find((i: Item) => i.id === itemId);
      const vars = item ? { itemId, isFav, item } : { itemId, isFav };
      toggle.mutate(vars);
    },
    [favoritos, itemsData, toggle],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoritos,
      isFavorito,
      toggleFavorito,
      totalFavoritos: favoritos.length,
      isHydrated: !isPending,
    }),
    [favoritos, isFavorito, toggleFavorito, isPending],
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
