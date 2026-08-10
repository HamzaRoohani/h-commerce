'use client';

import { useEffect, useState } from 'react';
import { adminListOrders, adminUpdateOrder, type AdminOrderListResponse } from '@/lib/admin';
import { formatPaisa } from '@/lib/money';
import type { Order } from '@/types/order';

const ORDER_STATUSES: Order['orderStatus'][] = ['processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES: Order['paymentStatus'][] = ['pending', 'paid', 'failed', 'refunded'];

type AdminOrder = AdminOrderListResponse['orders'][number];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load(status?: string) {
    adminListOrders({ status: status || undefined })
      .then((res) => setOrders(res.orders))
      .catch(() => setError('Failed to load orders.'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(order: AdminOrder, patch: { orderStatus?: Order['orderStatus']; paymentStatus?: Order['paymentStatus'] }) {
    setSavingId(order._id);
    setError(null);
    try {
      const { order: updated } = await adminUpdateOrder(order.orderNumber, patch);
      // adminUpdateOrder's response doesn't populate `user` — keep the
      // existing populated user object, only merge the status fields.
      setOrders(
        (prev) =>
          prev?.map((o) =>
            o._id === order._id
              ? { ...o, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus }
              : o,
          ) ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            load(e.target.value);
          }}
          className="border border-border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mb-4 text-sm text-accent">{error}</p> : null}

      {orders === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted">No orders found.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="py-2">Order</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Total</th>
              <th className="py-2">Payment</th>
              <th className="py-2">Order Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="py-3">
                  <p className="text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="py-3">
                  <p className="text-ink">{order.user?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted">{order.user?.email}</p>
                </td>
                <td className="py-3 text-ink">{formatPaisa(order.totalPaisa)}</td>
                <td className="py-3">
                  <p className="text-xs uppercase text-muted">{order.paymentMethod}</p>
                  <select
                    value={order.paymentStatus}
                    disabled={order.paymentMethod === 'gateway' || savingId === order._id}
                    onChange={(e) => handleUpdate(order, { paymentStatus: e.target.value as Order['paymentStatus'] })}
                    className="mt-1 border border-border px-2 py-1 text-xs disabled:opacity-40"
                    title={order.paymentMethod === 'gateway' ? 'Gateway payment status changes only via webhook' : undefined}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3">
                  <select
                    value={order.orderStatus}
                    disabled={savingId === order._id}
                    onChange={(e) => handleUpdate(order, { orderStatus: e.target.value as Order['orderStatus'] })}
                    className="border border-border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
