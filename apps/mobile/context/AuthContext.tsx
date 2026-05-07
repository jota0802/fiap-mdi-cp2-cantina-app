import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiLogin, apiMe, apiRegister, apiUpdateMe } from '@/lib/api/auth';
import { ApiError, setUnauthorizedHandler } from '@/lib/api/client';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-store';
import type { PublicUser } from '@cantina/shared';
import type { User } from '@/types';

type SignUpData = {
  email: string;
  senha: string;
};

type SignInData = {
  email: string;
  senha: string;
};

type ResetSenhaData = {
  email: string;
  novaSenha: string;
};

export type AuthResult = { success: true } | { success: false; error: string };

type AuthContextValue = {
  user: User | null;
  isHydrating: boolean;
  signUp: (data: SignUpData) => Promise<AuthResult>;
  signIn: (data: SignInData) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  updateMe: (input: { name?: string; rm?: string; cantinaId?: string | null }) => Promise<void>;
  resetSenha: (data: ResetSenhaData) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

function publicUserToUser(pu: PublicUser): User {
  const result: User = {
    id: pu.id,
    name: pu.name,
    rm: pu.rm,
    email: pu.email,
    role: pu.role,
    locale: pu.locale,
    cantinaId: pu.cantinaId,
    criadoEm: pu.createdAt,
  };
  if (pu.avatarUrl) result.fotoUri = pu.avatarUrl;
  return result;
}

function mapApiErrorToMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return 'Este e-mail já está cadastrado';
    if (err.status === 401) return 'E-mail ou senha inválidos';
    if (err.status === 422) return 'Dados inválidos. Verifique e tente novamente.';
  }
  return defaultMsg;
}

type ProviderProps = { children: ReactNode };

export function AuthProvider({ children }: ProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, cachedUserJson] = await Promise.all([
          getSecureItem(TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_USER),
        ]);
        if (!token) {
          return;
        }
        // Hidrata do cache imediatamente para o router não redirecionar ao /login
        if (cachedUserJson) {
          try {
            const cached = JSON.parse(cachedUserJson) as User;
            setUser(cached);
          } catch {
            // dado corrompido — descarta silenciosamente
          }
        }
        // Revalida via rede (best-effort)
        try {
          const { user: fresh } = await apiMe();
          const u = publicUserToUser(fresh);
          setUser(u);
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(u));
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            // token expirado ou forjado: limpa tudo
            await deleteSecureItem(TOKEN_KEY);
            await AsyncStorage.removeItem(STORAGE_KEYS.LAST_USER);
            setUser(null);
          }
          // outros erros (offline) — mantém o user do cache
        }
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ email, senha }) => {
      try {
        // nome/rm são coletados no onboarding (PATCH /auth/me) — Fase B Task 5.
        const res = await apiRegister({ email, password: senha });
        await setSecureItem(TOKEN_KEY, res.token);
        const u = publicUserToUser(res.user);
        setUser(u);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(u));
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: mapApiErrorToMessage(err, 'Erro ao cadastrar. Tente novamente em instantes.'),
        };
      }
    },
    [],
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async ({ email, senha }) => {
      try {
        const res = await apiLogin({ email, password: senha });
        await setSecureItem(TOKEN_KEY, res.token);
        const u = publicUserToUser(res.user);
        setUser(u);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(u));
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: mapApiErrorToMessage(err, 'Erro ao entrar. Tente novamente em instantes.'),
        };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await deleteSecureItem(TOKEN_KEY);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_USER);
    setUser(null);
  }, []);

  // Registra handler global pra 401 — apiFetch chama isso quando token expira
  // ou e invalido. Centralizar evita que cada hook precise tratar.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const updateMe = useCallback<AuthContextValue['updateMe']>(
    async (input) => {
      const { user: fresh } = await apiUpdateMe(input);
      const u = publicUserToUser(fresh);
      setUser(u);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(u));
    },
    [],
  );

  // updateUser: compat shim para telas existentes (perfil-editar, etc).
  // Mantém a assinatura antiga (Partial<User>) delegando para updateMe.
  const updateUser = useCallback<AuthContextValue['updateUser']>(
    async (patch) => {
      await updateMe({
        name: patch.name ?? undefined,
        cantinaId: patch.cantinaId,
      });
    },
    [updateMe],
  );

  // TODO(sub-projeto-2): backend ainda nao tem POST /auth/reset-password. Stub temporario.
  const resetSenha = useCallback<AuthContextValue['resetSenha']>(async () => {
    return {
      success: false,
      error:
        'Recuperação de senha indisponível temporariamente — backend endpoint pendente para sub-projeto 2.',
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isHydrating, signUp, signIn, signOut, updateUser, updateMe, resetSenha }),
    [user, isHydrating, signUp, signIn, signOut, updateUser, updateMe, resetSenha],
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
