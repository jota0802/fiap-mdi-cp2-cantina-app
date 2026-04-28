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

import { STORAGE_KEYS, SECURE_KEYS } from '@/constants/storage-keys';
import { hashSenha, verifySenha } from '@/lib/hash';
import { getSecureItem, setSecureItem } from '@/lib/secure-store';
import type { User } from '@/types';

type SignUpData = {
  nome: string;
  email: string;
  senha: string;
};

type SignInData = {
  email: string;
  senha: string;
};

export type AuthResult = { success: true } | { success: false; error: string };

type AuthContextValue = {
  user: User | null;
  isHydrating: boolean;
  signUp: (data: SignUpData) => Promise<AuthResult>;
  signIn: (data: SignInData) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function passwordKey(userId: string): string {
  return `${SECURE_KEYS.PASSWORD_HASH}_${userId}`;
}

async function loadUsers(): Promise<User[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as User[];
    }
  } catch {
    // dado corrompido — descarta
  }
  return [];
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

type ProviderProps = { children: ReactNode };

export function AuthProvider({ children }: ProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
        if (sessionId) {
          const users = await loadUsers();
          const sessionUser = users.find((u) => u.id === sessionId);
          if (sessionUser) {
            setUser(sessionUser);
          } else {
            // sessão aponta pra usuário inexistente — limpa
            await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
          }
        }
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ nome, email, senha }) => {
      const trimmedEmail = email.trim().toLowerCase();
      const users = await loadUsers();

      if (users.some((u) => u.email === trimmedEmail)) {
        return { success: false, error: 'Este e-mail já está cadastrado' };
      }

      const id = makeId();
      const novoUser: User = {
        id,
        nome: nome.trim(),
        email: trimmedEmail,
        criadoEm: new Date().toISOString(),
      };

      const hash = await hashSenha(senha);
      await setSecureItem(passwordKey(id), hash);
      await saveUsers([...users, novoUser]);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, id);
      setUser(novoUser);
      return { success: true };
    },
    [],
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async ({ email, senha }) => {
      const trimmedEmail = email.trim().toLowerCase();
      const users = await loadUsers();
      const found = users.find((u) => u.email === trimmedEmail);

      if (!found) {
        return { success: false, error: 'E-mail ou senha inválidos' };
      }

      const storedHash = await getSecureItem(passwordKey(found.id));
      if (!storedHash) {
        return { success: false, error: 'Sessão corrompida — refaça o cadastro' };
      }

      const ok = await verifySenha(senha, storedHash);
      if (!ok) {
        return { success: false, error: 'E-mail ou senha inválidos' };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, found.id);
      setUser(found);
      return { success: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    setUser(null);
  }, []);

  const updateUser = useCallback<AuthContextValue['updateUser']>(
    async (patch) => {
      if (!user) return;
      const users = await loadUsers();
      if (patch.email && patch.email.toLowerCase() !== user.email.toLowerCase()) {
        const taken = users.some(
          (u) => u.id !== user.id && u.email.toLowerCase() === patch.email!.toLowerCase(),
        );
        if (taken) {
          throw new Error('E-mail já está em uso por outra conta');
        }
      }
      const updated: User = { ...user, ...patch };
      const next = users.map((u) => (u.id === user.id ? updated : u));
      await saveUsers(next);
      setUser(updated);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isHydrating, signUp, signIn, signOut, updateUser }),
    [user, isHydrating, signUp, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
