import type { AuthResponse, LoginInput, RegisterInput, PublicUser } from '@cantina/shared';

import { apiFetch } from './client';

export async function apiRegister(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false });
}

export async function apiLogin(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: input, auth: false });
}

export async function apiMe(): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/auth/me');
}

export async function apiUpdateMe(
  input: { name?: string; rm?: string; cantinaId?: string | null },
): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/auth/me', { method: 'PATCH', body: input });
}
