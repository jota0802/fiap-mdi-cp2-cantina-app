import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiLogin, apiMe, apiRegister } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-store';
import type { PublicUser } from '@cantina/shared';
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
  resetSenha: (data: ResetSenhaData) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

function publicUserToUser(pu: PublicUser): User {
  const result: User = {
    id: pu.id,
    nome: pu.name,
    email: pu.email,
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
        const token = await getSecureItem(TOKEN_KEY);
        if (token) {
          try {
            const { user: publicUser } = await apiMe();
            setUser(publicUserToUser(publicUser));
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              // token expirado ou inválido — descarta
              await deleteSecureItem(TOKEN_KEY);
            }
            // outros erros (rede offline) — preserva token; user fica null até próximo /me
          }
        }
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ nome, email, senha }) => {
      try {
        const res = await apiRegister({ name: nome.trim(), email, password: senha });
        await setSecureItem(TOKEN_KEY, res.token);
        setUser(publicUserToUser(res.user));
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
        setUser(publicUserToUser(res.user));
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
    setUser(null);
  }, []);

  // TODO(sub-projeto-2): backend ainda nao tem PATCH /auth/me. Stub temporario.
  const updateUser = useCallback<AuthContextValue['updateUser']>(async () => {
    throw new Error(
      'Atualização de perfil indisponível temporariamente — backend endpoint pendente para sub-projeto 2.',
    );
  }, []);

  // TODO(sub-projeto-2): backend ainda nao tem POST /auth/reset-password. Stub temporario.
  const resetSenha = useCallback<AuthContextValue['resetSenha']>(async () => {
    return {
      success: false,
      error:
        'Recuperação de senha indisponível temporariamente — backend endpoint pendente para sub-projeto 2.',
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isHydrating, signUp, signIn, signOut, updateUser, resetSenha }),
    [user, isHydrating, signUp, signIn, signOut, updateUser, resetSenha],
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
