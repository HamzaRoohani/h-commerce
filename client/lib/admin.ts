import { apiFetch } from './api';
import { useAuthStore } from '@/store/authStore';
import type { AdminProductInput } from '@/types/admin';
import type { Product, ProductListResponse } from '@/types/product';
import type { Order } from '@/types/order';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function adminListProducts(params: { page?: number; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<ProductListResponse>(`/admin/products${suffix}`, { headers: authHeaders() });
}

export function adminGetProduct(id: string) {
  return apiFetch<{ product: Product }>(`/admin/products/${id}`, { headers: authHeaders() });
}

export function adminCreateProduct(input: AdminProductInput) {
  return apiFetch<{ product: Product }>('/admin/products', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export function adminUpdateProduct(id: string, input: Partial<AdminProductInput>) {
  return apiFetch<{ product: Product }>(`/admin/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export function adminDeleteProduct(id: string) {
  return apiFetch<void>(`/admin/products/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export type AdminOrderListResponse = {
  orders: (Order & { user: { _id: string; name: string; email: string } })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function adminListOrders(params: { page?: number; status?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.status) qs.set('status', params.status);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<AdminOrderListResponse>(`/admin/orders${suffix}`, { headers: authHeaders() });
}

export function adminUpdateOrder(
  orderNumber: string,
  body: { orderStatus?: Order['orderStatus']; paymentStatus?: Order['paymentStatus'] },
) {
  return apiFetch<{ order: Order }>(`/admin/orders/${orderNumber}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}
