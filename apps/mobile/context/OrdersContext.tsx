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

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useAuth } from '@/context/AuthContext';
import { calcularPrazoSegundos } from '@/lib/estimativa';
import type { CartItem, Order } from '@/types';

const PREP_TIME_FALLBACK_MS = 3 * 60 * 1000;

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
  markCancelado: (orderId: string) => Promise<void>;
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
  const ordersRef = useRef<Order[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Mantém o user atual em ref para callbacks de timeout
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  // Mantém orders em ref pra leituras frescas em fluxos síncronos rápidos
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
  }, []);

  const promoteToPronto = useCallback((orderId: string, ownerUserId: string) => {
    timeoutsRef.current.delete(orderId);
    // Se o usuário ativo trocou desde o agendamento, descarta o promote
    // pra não persistir o pedido na conta errada.
    if (userIdRef.current !== ownerUserId) return;
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId && o.status === 'pendente'
          ? { ...o, status: 'pronto' as const }
          : o,
      );
      const sameRef = next.every((o, i) => o === prev[i]);
      if (sameRef) return prev;
      saveOrdersToStorage(ownerUserId, next).catch(() => {
        // persistência opcional — não bloqueia UX
      });
      return next;
    });
  }, []);

  const schedulePromote = useCallback(
    (order: Order) => {
      if (order.status !== 'pendente') return;
      if (timeoutsRef.current.has(order.id)) return;

      const prontoEmMs = order.prontoEm
        ? new Date(order.prontoEm).getTime()
        : new Date(order.criadoEm).getTime() + PREP_TIME_FALLBACK_MS;
      const remaining = Math.max(0, prontoEmMs - Date.now());
      const ownerUserId = order.userId;

      const id = setTimeout(
        () => promoteToPronto(order.id, ownerUserId),
        remaining,
      );
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
      // Lê orders via ref pra evitar stale closure em chamadas back-to-back
      const atuais = ordersRef.current;
      const pedidosPendentes = atuais.filter((o) => o.status === 'pendente').length;
      const prazoSegundos = calcularPrazoSegundos(pedidosPendentes);
      const agora = new Date();
      const prontoEm = new Date(agora.getTime() + prazoSegundos * 1000);

      const novo: Order = {
        id: makeOrderId(),
        userId: user.id,
        senha: input.senha,
        items: input.items,
        total: input.total,
        resumo: input.resumo,
        criadoEm: agora.toISOString(),
        prontoEm: prontoEm.toISOString(),
        status: 'pendente',
      };
      const next = [novo, ...atuais];
      ordersRef.current = next;
      setOrders(next);
      await persist(next);
      schedulePromote(novo);
      return novo;
    },
    [user, persist, schedulePromote],
  );

  const updateStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      const next = ordersRef.current.map((o) =>
        o.id === orderId ? { ...o, status } : o,
      );
      ordersRef.current = next;
      setOrders(next);
      await persist(next);
      // se foi marcado como terminal (retirado/cancelado), cancela auto-promote pendente
      if (status === 'retirado' || status === 'cancelado') {
        const t = timeoutsRef.current.get(orderId);
        if (t) {
          clearTimeout(t);
          timeoutsRef.current.delete(orderId);
        }
      }
    },
    [persist],
  );

  const markPronto = useCallback(
    (orderId: string) => updateStatus(orderId, 'pronto'),
    [updateStatus],
  );

  const markRetirado = useCallback(
    (orderId: string) => updateStatus(orderId, 'retirado'),
    [updateStatus],
  );

  const markCancelado = useCallback(
    (orderId: string) => updateStatus(orderId, 'cancelado'),
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
    () => ({
      orders,
      isHydrated,
      addOrder,
      markPronto,
      markRetirado,
      markCancelado,
      refresh,
      getOrder,
    }),
    [
      orders,
      isHydrated,
      addOrder,
      markPronto,
      markRetirado,
      markCancelado,
      refresh,
      getOrder,
    ],
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
