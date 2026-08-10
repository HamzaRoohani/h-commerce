'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getOrder } from '@/lib/orders';
import { formatPaisa } from '@/lib/money';
import type { Order } from '@/types/order';

export function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const [order, setOrder] = useState<Order | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      getOrder(orderNumber)
        .then((res) => setOrder(res.order))
        .catch(() => setNotFoundError(true));
    }
  }, [status, orderNumber]);

  if (status !== 'authenticated' && status !== 'guest') {
    return <div className="mx-auto max-w-container px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  if (notFoundError) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Order Not Found</h1>
        <Link href="/account/orders" className="mt-6 inline-block text-sm text-ink underline">
          Back to order history
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-container px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <p className="text-xs uppercase tracking-wide text-muted">Thank you for your order</p>
      <h1 className="mt-1 font-serif text-2xl text-ink">{order.orderNumber}</h1>
      <p className="mt-2 text-sm text-muted">
        Placed on {new Date(order.createdAt).toLocaleDateString()} &middot;{' '}
        <span className="uppercase tracking-wide">{order.orderStatus}</span>
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-sm uppercase tracking-wide text-ink">Items</h2>
          <ul className="divide-y divide-border border-y border-border">
            {order.items.map((item) => (
              <li key={item.variantSku} className="flex justify-between px-2 py-3 text-sm">
                <span className="text-ink">
                  {item.title} ({item.variantSku}) × {item.qty}
                </span>
                <span className="text-muted">{formatPaisa(item.unitPricePaisa * item.qty)}</span>
              </li>
            ))}
          </ul>

          <h2 className="mb-2 mt-8 text-sm uppercase tracking-wide text-ink">Shipping To</h2>
          <p className="text-sm text-muted">
            {order.shippingAddress.name}
            <br />
            {order.shippingAddress.street}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.country}
            <br />
            {order.shippingAddress.phone}
          </p>
        </div>

        <div className="h-fit border border-border p-6 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatPaisa(order.subtotalPaisa)}</span>
          </div>
          <div className="mt-1 flex justify-between text-muted">
            <span>Shipping</span>
            <span>{order.shippingPaisa === 0 ? 'Free' : formatPaisa(order.shippingPaisa)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-ink">
            <span>Total</span>
            <span>{formatPaisa(order.totalPaisa)}</span>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-muted">
            Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod} &middot;{' '}
            {order.paymentStatus}
          </p>
        </div>
      </div>

      <Link href="/account/orders" className="mt-8 inline-block text-sm text-ink underline">
        Back to order history
      </Link>
    </div>
  );
}
