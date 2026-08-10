import { apiFetch } from './api';
import { useAuthStore } from '@/store/authStore';
import type { Order, ShippingAddress } from '@/types/order';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function createOrder(input: { shippingAddress: ShippingAddress; paymentMethod: 'cod' | 'gateway' }) {
  return apiFetch<{ order: Order; redirectUrl?: string }>('/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

/** Dev-only — simulates the gateway's server-to-server webhook call. See server/src/controllers/devController.ts. */
export function simulateMockGatewayPayment(orderNumber: string, outcome: 'paid' | 'failed') {
  return apiFetch<{ simulated: string; webhookStatus: number }>(
    `/dev/mock-gateway/${orderNumber}/simulate`,
    { method: 'POST', headers: authHeaders(), body: JSON.stringify({ outcome }) },
  );
}

export function listOrders() {
  return apiFetch<{ orders: Order[] }>('/orders', { headers: authHeaders() });
}

export function getOrder(orderNumber: string) {
  return apiFetch<{ order: Order }>(`/orders/${orderNumber}`, { headers: authHeaders() });
}
