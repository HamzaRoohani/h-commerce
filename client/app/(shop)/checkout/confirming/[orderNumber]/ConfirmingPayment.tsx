'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useServerCartStore } from '@/store/serverCartStore';
import { getOrder } from '@/lib/orders';
import type { Order } from '@/types/order';

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 40; // ~1 minute

/**
 * The return URL a gateway redirects to never carries a trustworthy
 * payment result on its own — it just shows this and polls until the
 * webhook (the only place paymentStatus is allowed to change, §5) has
 * done its job.
 */
export function ConfirmingPayment({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);
  const resetServerCart = useServerCartStore((state) => state.reset);
  const [order, setOrder] = useState<Order | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (authStatus === 'guest') router.replace('/login');
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const { order: fetched } = await getOrder(orderNumber);
        if (cancelled) return;
        setOrder(fetched);

        if (fetched.paymentStatus === 'pending') {
          if (attempts >= MAX_ATTEMPTS) {
            setTimedOut(true);
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        } else if (fetched.paymentStatus === 'paid') {
          resetServerCart();
          router.push(`/account/orders/${orderNumber}`);
        }
        // 'failed' falls through to the render below — no redirect.
      } catch {
        if (!cancelled && attempts < MAX_ATTEMPTS) setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [authStatus, orderNumber, router, resetServerCart]);

  if (order?.paymentStatus === 'failed') {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Payment Failed</h1>
        <p className="mt-4 text-sm text-muted">
          Your payment didn&apos;t go through. Your cart is still here — you can try again.
        </p>
        <Link href="/checkout" className="mt-6 inline-block text-sm text-ink underline">
          Back to checkout
        </Link>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Still Confirming…</h1>
        <p className="mt-4 text-sm text-muted">
          This is taking longer than expected. Check your order status in a moment.
        </p>
        <Link href={`/account/orders/${orderNumber}`} className="mt-6 inline-block text-sm text-ink underline">
          View order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <h1 className="font-serif text-2xl text-ink">Confirming your payment…</h1>
      <p className="mt-4 text-sm text-muted">Don&apos;t close this page.</p>
    </div>
  );
}
