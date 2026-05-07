import { useQuery } from '@tanstack/react-query';

import type { Categoria } from '@cantina/shared';

import { useAuth } from '@/context/AuthContext';

import { getItem, listItems } from '../items';

export function useItems(filter?: { categoria?: Categoria }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['items', filter ?? {}],
    queryFn: () => listItems(filter),
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });
}

export function useItem(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => {
      if (!id) throw new Error('id required');
      return getItem(id);
    },
    enabled: !!id && !!user,
    staleTime: 1000 * 60 * 5,
  });
}
