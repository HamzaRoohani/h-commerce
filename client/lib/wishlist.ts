import { apiFetch } from './api';
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types/product';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getWishlist() {
  return apiFetch<{ products: Product[] }>('/wishlist', { headers: authHeaders() });
}

export function addToWishlist(productId: string) {
  return apiFetch<{ added: string }>(`/wishlist/${productId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export function removeFromWishlist(productId: string) {
  return apiFetch<{ removed: string }>(`/wishlist/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}
