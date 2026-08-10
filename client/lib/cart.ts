import { apiFetch } from './api';
import { useAuthStore } from '@/store/authStore';
import type { CartResponse } from '@/types/cart';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCart() {
  return apiFetch<CartResponse>('/cart', { headers: authHeaders() });
}

export function addCartItem(input: { productId: string; variantSku: string; qty: number }) {
  return apiFetch<CartResponse>('/cart/items', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export function updateCartItem(variantSku: string, qty: number) {
  return apiFetch<CartResponse>(`/cart/items/${variantSku}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ qty }),
  });
}

export function removeCartItem(variantSku: string) {
  return apiFetch<CartResponse>(`/cart/items/${variantSku}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export function mergeCart(items: Array<{ productId: string; variantSku: string; qty: number }>) {
  return apiFetch<CartResponse>('/cart/merge', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ items }),
  });
}
