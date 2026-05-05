import { getSecureItem } from '../secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
const API_BASE = `${API_URL}/api/v1`;

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

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> ?? {}),
  };
  if (auth) {
    const token = await getSecureItem('auth_token');
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
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
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return json as T;
}
