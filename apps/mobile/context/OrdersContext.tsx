import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import type { CreateOrderInput, Order } from '@cantina/shared';

import {
  useCancelOrder,
  useCreateOrder,
  useOrders as useOrdersQuery,
} from '@/lib/api/hooks/use-orders';

type OrdersContextValue = {
  orders: Order[];
  isHydrated: boolean;
  /** Cria um pedido novo. Retorna o Order criado pelo servidor (com senha + estimativa). */
  addOrder: (input: CreateOrderInput) => Promise<Order>;
  /** Cancela um pedido pendente. Servidor recusa se status != 'pendente'. */
  markCancelado: (orderId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getOrder: (orderId: string) => Order | undefined;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { data, isPending, refetch } = useOrdersQuery();
  const create = useCreateOrder();
  const cancel = useCancelOrder();

  const orders = data?.orders ?? [];

  const addOrder = useCallback<OrdersContextValue['addOrder']>(
    async (input) => {
      const res = await create.mutateAsync(input);
      return res.order;
    },
    [create],
  );

  const markCancelado = useCallback<OrdersContextValue['markCancelado']>(
    async (orderId) => {
      await cancel.mutateAsync(orderId);
    },
    [cancel],
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getOrder = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId),
    [orders],
  );

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      isHydrated: !isPending,
      addOrder,
      markCancelado,
      refresh,
      getOrder,
    }),
    [orders, isPending, addOrder, markCancelado, refresh, getOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders deve ser usado dentro de <OrdersProvider>');
  }
  return ctx;
}
