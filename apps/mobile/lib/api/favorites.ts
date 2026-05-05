import type { Item } from '@cantina/shared';

import { apiFetch } from './client';

export async function listFavorites(): Promise<{ items: Item[] }> {
  return apiFetch<{ items: Item[] }>('/favorites');
}

export async function addFavorite(itemId: string): Promise<void> {
  await apiFetch(`/favorites/${itemId}`, { method: 'POST' });
}

export async function removeFavorite(itemId: string): Promise<void> {
  await apiFetch(`/favorites/${itemId}`, { method: 'DELETE' });
}
