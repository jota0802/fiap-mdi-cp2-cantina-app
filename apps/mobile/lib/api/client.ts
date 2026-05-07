import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getSecureItem } from '../secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
const API_BASE = `${API_URL}/api/v1`;

// Boot-time guard: app eh mobile-only — qualquer build com URL non-HTTPS
// fora de DEV vaza JWT em transito. EXPO_PUBLIC_* eh baked no build, entao
// isso falha o app no startup pra forcar correcao do EAS profile.
if (!__DEV__ && !API_URL.startsWith('https://')) {
  throw new Error(`EXPO_PUBLIC_API_URL must be HTTPS in production (got: ${API_URL})`);
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

// Rotas que exigem o header X-Cantina-Id para acesso tenant-scoped
const TENANT_REQUIRED_PATTERNS = ['/items', '/orders', '/favorites'];

function needsTenantHeader(path: string): boolean {
  return TENANT_REQUIRED_PATTERNS.some((p) => path.includes(p));
}

// Handler global de 401 — AuthContext registra no boot pra fazer logout
// centralizado quando token expira/invalida. Evita que cada hook precise tratar.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headers as Record<string, string> ?? {}),
  };
  if (auth) {
    const token = await getSecureItem('auth_token');
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }
  // Injecta X-Cantina-Id automaticamente em rotas tenant-scoped
  if (needsTenantHeader(path)) {
    const cantinaId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_CANTINA_ID);
    if (cantinaId) finalHeaders['X-Cantina-Id'] = cantinaId;
    // Se cantinaId é null, a request segue — backend retorna 400 e o
    // frontend (onboarding gate, Task 5) impede acesso sem cantina selecionada.
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = (json as { error?: { code: string; message: string; details?: unknown } } | null)?.error
      ?? { code: 'UNKNOWN', message: `HTTP ${res.status}` };
    // Disparo so quando havia tentativa de auth — 401 em rota publica
    // (login/register com senha errada) nao deve deslogar o user.
    if (res.status === 401 && auth) unauthorizedHandler?.();
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return json as T;
}
