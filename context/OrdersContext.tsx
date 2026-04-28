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
import type { CartItem, Order } from '@/types';

type NewOrderInput = {
  senha: number;
  items: CartItem[];
  total: number;
  resumo: string;
};

type OrdersContextValue = {
  orders: Order[];
  isHydrated: boolean;
  addOrder: (input: NewOrderInput) => Promise<Order>;
  markPronto: (orderId: string) => Promise<void>;
  markRetirado: (orderId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getOrder: (orderId: string) => Order | undefined;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

function ordersKey(userId: string): string {
  return `${STORAGE_KEYS.ORDERS}:${userId}`;
}

function makeOrderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadOrdersFromStorage(userId: string): Promise<Order[]> {
  const stored = await AsyncStorage.getItem(ordersKey(userId));
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed)) return parsed as Order[];
  } catch {
    // descarta dados corrompidos
  }
  return [];
}

async function saveOrdersToStorage(userId: string, orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(ordersKey(userId), JSON.stringify(orders));
}

type ProviderProps = { children: ReactNode };

export function OrdersProvider({ children }: ProviderProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsHydrated(false);

    if (!user) {
      setOrders([]);
      setIsHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    loadOrdersFromStorage(user.id)
      .then((stored) => {
        if (!cancelled) setOrders(stored);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = useCallback(
    async (next: Order[]) => {
      if (!user) return;
      await saveOrdersToStorage(user.id, next);
    },
    [user],
  );

  const addOrder = useCallback<OrdersContextValue['addOrder']>(
    async (input) => {
      if (!user) {
        throw new Error('Sem usuário logado para criar pedido');
      }
      const novo: Order = {
        id: makeOrderId(),
        userId: user.id,
        senha: input.senha,
        items: input.items,
        total: input.total,
        resumo: input.resumo,
        criadoEm: new Date().toISOString(),
        status: 'pendente',
      };
      const next = [novo, ...orders];
      setOrders(next);
      await persist(next);
      return novo;
    },
    [user, orders, persist],
  );

  const updateStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      const next = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      setOrders(next);
      await persist(next);
    },
    [orders, persist],
  );

  const markPronto = useCallback(
    (orderId: string) => updateStatus(orderId, 'pronto'),
    [updateStatus],
  );

  const markRetirado = useCallback(
    (orderId: string) => updateStatus(orderId, 'retirado'),
    [updateStatus],
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    const stored = await loadOrdersFromStorage(user.id);
    setOrders(stored);
  }, [user]);

  const getOrder = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId),
    [orders],
  );

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, isHydrated, addOrder, markPronto, markRetirado, refresh, getOrder }),
    [orders, isHydrated, addOrder, markPronto, markRetirado, refresh, getOrder],
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
