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
import CARDAPIO from '@/data/cardapio';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { CartItem } from '@/types';

type CartContextValue = {
  items: CartItem[];
  totalItens: number;
  totalPreco: number;
  isHydrated: boolean;
  addItem: (itemId: number) => void;
  removeItem: (itemId: number) => void;
  setQuantidade: (itemId: number, quantidade: number) => void;
  clear: () => void;
  getQuantidade: (itemId: number) => number;
  buildResumo: () => string;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function cartKey(userId: string): string {
  return `${STORAGE_KEYS.CART}:${userId}`;
}

type ProviderProps = { children: ReactNode };

export function CartProvider({ children }: ProviderProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidrata o carrinho a cada mudança de usuário (incluindo logout)
  useEffect(() => {
    let cancelled = false;
    setIsHydrated(false);

    if (!user) {
      setItems([]);
      setIsHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    AsyncStorage.getItem(cartKey(user.id))
      .then((stored) => {
        if (cancelled) return;
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as unknown;
            if (Array.isArray(parsed)) {
              setItems(parsed as CartItem[]);
            } else {
              setItems([]);
            }
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persiste qualquer alteração após hidratar
  useEffect(() => {
    if (!isHydrated || !user) return;
    AsyncStorage.setItem(cartKey(user.id), JSON.stringify(items)).catch(() => {
      // armazenamento falha silenciosamente — UX não bloqueia
    });
  }, [items, isHydrated, user]);

  const addItem = useCallback((itemId: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === itemId ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [...prev, { itemId, quantidade: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === itemId);
      if (!existing) return prev;
      if (existing.quantidade <= 1) {
        return prev.filter((i) => i.itemId !== itemId);
      }
      return prev.map((i) =>
        i.itemId === itemId ? { ...i, quantidade: i.quantidade - 1 } : i,
      );
    });
  }, []);

  const setQuantidade = useCallback((itemId: number, quantidade: number) => {
    setItems((prev) => {
      if (quantidade <= 0) {
        return prev.filter((i) => i.itemId !== itemId);
      }
      const existing = prev.find((i) => i.itemId === itemId);
      if (existing) {
        return prev.map((i) => (i.itemId === itemId ? { ...i, quantidade } : i));
      }
      return [...prev, { itemId, quantidade }];
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const getQuantidade = useCallback(
    (itemId: number) => items.find((i) => i.itemId === itemId)?.quantidade ?? 0,
    [items],
  );

  const totalItens = useMemo(
    () => items.reduce((acc, ci) => acc + ci.quantidade, 0),
    [items],
  );

  const totalPreco = useMemo(
    () =>
      items.reduce((acc, ci) => {
        const item = CARDAPIO.find((i) => i.id === ci.itemId);
        return acc + (item?.preco ?? 0) * ci.quantidade;
      }, 0),
    [items],
  );

  const buildResumo = useCallback(() => {
    return items
      .map((ci) => {
        const item = CARDAPIO.find((i) => i.id === ci.itemId);
        return `${ci.quantidade}x ${item?.nome ?? ''}`;
      })
      .join(', ');
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItens,
      totalPreco,
      isHydrated,
      addItem,
      removeItem,
      setQuantidade,
      clear,
      getQuantidade,
      buildResumo,
    }),
    [
      items,
      totalItens,
      totalPreco,
      isHydrated,
      addItem,
      removeItem,
      setQuantidade,
      clear,
      getQuantidade,
      buildResumo,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart deve ser usado dentro de <CartProvider>');
  }
  return ctx;
}
