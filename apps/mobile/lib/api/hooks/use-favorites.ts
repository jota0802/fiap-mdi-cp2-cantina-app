import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Item } from '@cantina/shared';

import { useAuth } from '@/context/AuthContext';

import { addFavorite, listFavorites, removeFavorite } from '../favorites';

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorites'],
    queryFn: listFavorites,
    staleTime: 1000 * 60,
    enabled: !!user,
  });
}

type ToggleVars = { itemId: string; isFav: boolean; item?: Item };

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, isFav }: ToggleVars) => {
      if (isFav) {
        await removeFavorite(itemId);
      } else {
        await addFavorite(itemId);
      }
    },
    onMutate: async ({ itemId, isFav, item }) => {
      // Cancel any in-flight refetch so optimistic update is not overwritten
      await qc.cancelQueries({ queryKey: ['favorites'] });
      const prev = qc.getQueryData<{ items: Item[] }>(['favorites']);
      qc.setQueryData<{ items: Item[] }>(['favorites'], (old) => {
        const list = old?.items ?? [];
        if (isFav) {
          // remove
          return { items: list.filter((i) => i.id !== itemId) };
        }
        // add — only optimistically if we have the full item shape
        if (item) {
          return { items: [...list, item] };
        }
        return { items: list };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['favorites'], ctx.prev);
    },
    onSettled: () => {
      // Always refetch to reconcile with server (e.g., when add was optimistic without item shape)
      void qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
