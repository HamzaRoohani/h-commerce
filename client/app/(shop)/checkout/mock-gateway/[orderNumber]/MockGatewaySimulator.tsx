'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getOrder, simulateMockGatewayPayment } from '@/lib/orders';
import { formatPaisa } from '@/lib/money';
import type { Order } from '@/types/order';

/**
 * Stands in for a real gateway's hosted checkout page (PayFast/Safepay/
 * Simpaisa — see docs/ADR.md ADR-003). A real bank page would end with
 * the user entering card/wallet details; here you just pick an outcome.
 * Either way, the order's paymentStatus is only ever flipped by the
 * webhook call this triggers — never by this page itself (§5).
 */
export function MockGatewaySimulator({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'guest') router.replace('/login');
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      getOrder(orderNumber)
        .then((res) => setOrder(res.order))
        .catch(() => setError('Order not found.'));
    }
  }, [authStatus, orderNumber]);

  async function handleOutcome(outcome: 'paid' | 'failed') {
    setSubmitting(true);
    setError(null);
    try {
      await simulateMockGatewayPayment(orderNumber, outcome);
      router.push(`/checkout/confirming/${orderNumber}`);
    } catch {
      setError('Something went wrong triggering the mock payment. Try again.');
      setSubmitting(false);
    }
  }

  if (error) {
    return <div className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-accent">{error}</div>;
  }

  if (!order) {
    return <div className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-wide text-muted">Mock Payment Gateway</p>
      <h1 className="mt-1 font-serif text-2xl text-ink">{order.orderNumber}</h1>
      <p className="mt-4 text-3xl text-ink">{formatPaisa(order.totalPaisa)}</p>
      <p className="mt-2 text-xs text-muted">
        This simulates the redirect to a real gateway&apos;s hosted checkout page. Pick an outcome below.
      </p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleOutcome('paid')}
          className="w-full bg-ink py-3 text-sm uppercase tracking-wide text-paper disabled:opacity-50"
        >
          Simulate Successful Payment
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleOutcome('failed')}
          className="w-full border border-border py-3 text-sm uppercase tracking-wide text-ink disabled:opacity-50"
        >
          Simulate Failed Payment
        </button>
      </div>
    </div>
  );
}
