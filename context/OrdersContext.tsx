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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { CartItem, Order } from '@/types';

const PREP_TIME_MS = 3 * 60 * 1000;

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
  const userIdRef = useRef<string | null>(null);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Mantém o user atual em ref para callbacks de timeout
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
  }, []);

  const promoteToPronto = useCallback((orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId && o.status === 'pendente'
          ? { ...o, status: 'pronto' as const }
          : o,
      );
      const sameRef = next.every((o, i) => o === prev[i]);
      if (sameRef) return prev;
      const uid = userIdRef.current;
      if (uid) {
        saveOrdersToStorage(uid, next).catch(() => {
          // persistência opcional — não bloqueia UX
        });
      }
      return next;
    });
    timeoutsRef.current.delete(orderId);
  }, []);

  const schedulePromote = useCallback(
    (order: Order) => {
      if (order.status !== 'pendente') return;
      if (timeoutsRef.current.has(order.id)) return;

      const elapsed = Date.now() - new Date(order.criadoEm).getTime();
      const remaining = PREP_TIME_MS - elapsed;

      if (remaining <= 0) {
        // já passou do tempo — promove no próximo tick
        const id = setTimeout(() => promoteToPronto(order.id), 0);
        timeoutsRef.current.set(order.id, id);
        return;
      }

      const id = setTimeout(() => promoteToPronto(order.id), remaining);
      timeoutsRef.current.set(order.id, id);
    },
    [promoteToPronto],
  );

  // Hidrata orders do usuário e agenda promoções pendentes
  useEffect(() => {
    let cancelled = false;
    setIsHydrated(false);
    clearAllTimeouts();

    if (!user) {
      setOrders([]);
      setIsHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    loadOrdersFromStorage(user.id)
      .then((stored) => {
        if (cancelled) return;
        setOrders(stored);
        stored.forEach((o) => schedulePromote(o));
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
      clearAllTimeouts();
    };
  }, [user, clearAllTimeouts, schedulePromote]);

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
      schedulePromote(novo);
      return novo;
    },
    [user, orders, persist, schedulePromote],
  );

  const updateStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      const next = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      setOrders(next);
      await persist(next);
      // se foi marcado como retirado, cancela qualquer auto-promote pendente
      if (status === 'retirado') {
        const t = timeoutsRef.current.get(orderId);
        if (t) {
          clearTimeout(t);
          timeoutsRef.current.delete(orderId);
        }
      }
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
    stored.forEach((o) => schedulePromote(o));
  }, [user, schedulePromote]);

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
