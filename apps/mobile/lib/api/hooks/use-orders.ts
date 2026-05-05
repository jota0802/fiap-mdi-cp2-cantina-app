import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelOrder, createOrder, getOrder, listOrders } from '../orders';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: listOrders,
    refetchInterval: 30_000, // poll pra pegar auto-promote do servidor
    staleTime: 1000 * 15,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => {
      if (!id) throw new Error('id required');
      return getOrder(id);
    },
    enabled: !!id,
    refetchInterval: 30_000,
    staleTime: 1000 * 15,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
