import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useAuth } from './AuthContext';

interface CantinaContextType {
  currentCantinaId: string | null;
  setCurrent: (id: string | null) => Promise<void>;
}

const CantinaContext = createContext<CantinaContextType | undefined>(undefined);

type ProviderProps = { children: ReactNode };

export function CantinaProvider({ children }: ProviderProps) {
  const { user } = useAuth();
  const [currentCantinaId, setCurrentCantinaId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hidrata currentCantinaId de AsyncStorage; fallback para user.cantinaId no boot
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_CANTINA_ID);
      if (cancelled) return;
      const initial = stored ?? user?.cantinaId ?? null;
      setCurrentCantinaId(initial);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  // Re-hidrata quando o user muda (login/logout/troca de conta)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setCurrent = useCallback(async (id: string | null) => {
    setCurrentCantinaId(id);
    if (id === null) {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_CANTINA_ID);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_CANTINA_ID, id);
    }
  }, []);

  // Quando user perde vínculo com cantina (cantinaId → null), limpa o current
  useEffect(() => {
    if (hydrated && user?.cantinaId === null && currentCantinaId !== null) {
      setCurrentCantinaId(null);
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_CANTINA_ID).catch(() => {});
    }
  }, [user?.cantinaId, hydrated, currentCantinaId]);

  return (
    <CantinaContext.Provider value={{ currentCantinaId, setCurrent }}>
      {children}
    </CantinaContext.Provider>
  );
}

export function useCantina(): CantinaContextType {
  const ctx = useContext(CantinaContext);
  if (!ctx) throw new Error('useCantina deve ser usado dentro de <CantinaProvider>');
  return ctx;
}
