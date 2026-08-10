'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { listOrders } from '@/lib/orders';
import { formatPaisa } from '@/lib/money';
import type { Order } from '@/types/order';

export default function OrdersPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      listOrders()
        .then((res) => setOrders(res.orders))
        .catch(() => setOrders([]));
    }
  }, [status]);

  if (status !== 'authenticated' || orders === null) {
    return <div className="mx-auto max-w-container px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Order History</h1>
        <Link href="/account" className="text-sm text-muted underline">
          Back to account
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <li key={order._id}>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="flex items-center justify-between px-2 py-4 text-sm hover:bg-white"
              >
                <div>
                  <p className="text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-ink">{formatPaisa(order.totalPaisa)}</p>
                  <p className="text-xs uppercase tracking-wide text-muted">{order.orderStatus}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
