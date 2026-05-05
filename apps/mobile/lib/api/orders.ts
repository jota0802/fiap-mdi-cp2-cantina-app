import type { Order, CreateOrderInput } from '@cantina/shared';

import { apiFetch } from './client';

export async function listOrders(): Promise<{ orders: Order[] }> {
  return apiFetch<{ orders: Order[] }>('/orders');
}

export async function getOrder(id: string): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}`);
}

export async function createOrder(input: CreateOrderInput): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>('/orders', { method: 'POST', body: input });
}

export async function cancelOrder(id: string): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: { status: 'cancelado' },
  });
}
