import type { Categoria, Item } from '@cantina/shared';

import { apiFetch } from './client';

export async function listItems(filter?: { categoria?: Categoria }): Promise<{ items: Item[] }> {
  const qs = filter?.categoria ? `?categoria=${encodeURIComponent(filter.categoria)}` : '';
  return apiFetch<{ items: Item[] }>(`/items${qs}`);
}

export async function getItem(id: string): Promise<{ item: Item }> {
  return apiFetch<{ item: Item }>(`/items/${id}`);
}
