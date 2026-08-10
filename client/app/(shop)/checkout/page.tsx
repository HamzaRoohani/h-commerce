'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/authStore';
import { useServerCartStore } from '@/store/serverCartStore';
import { createOrder } from '@/lib/orders';
import { formatPaisa } from '@/lib/money';
import { ApiError } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { items, subtotalPaisa } = useCart();
  const resetServerCart = useServerCartStore((state) => state.reset);

  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'gateway'>('cod');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Prefill the name field once the user loads, without clobbering anything
  // they've already typed (React's "adjusting state during render" pattern —
  // see https://react.dev/learn/you-might-not-need-an-effect).
  const [prevUserName, setPrevUserName] = useState<string | undefined>(undefined);
  if (user && user.name !== prevUserName) {
    setPrevUserName(user.name);
    setName((prev) => prev || user.name);
  }

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { order, redirectUrl } = await createOrder({
        shippingAddress: { name, street, city, country: 'Pakistan', phone },
        paymentMethod,
      });
      if (paymentMethod === 'cod') resetServerCart();
      router.push(redirectUrl ?? `/account/orders/${order.orderNumber}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return <div className="mx-auto max-w-container px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  if (user && !user.isVerified) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Checkout</h1>
        <p className="mt-4 text-sm text-accent">
          Verify your email before checking out — check your inbox for the verification link.
        </p>
        <Link href="/account" className="mt-6 inline-block text-sm text-ink underline">
          Go to your account
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Checkout</h1>
        <p className="mt-4 text-sm text-muted">Your cart is empty.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-ink underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="font-serif text-2xl text-ink">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-sm uppercase tracking-wide text-ink">Shipping Address</h2>
          <div>
            <label htmlFor="name" className="mb-1 block text-xs uppercase tracking-wide text-muted">
              Full Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="street" className="mb-1 block text-xs uppercase tracking-wide text-muted">
              Street Address
            </label>
            <input
              id="street"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-xs uppercase tracking-wide text-muted">
              City
            </label>
            <input
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-xs uppercase tracking-wide text-muted">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">Payment Method</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                Cash on Delivery
              </label>
              <label className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'gateway'}
                  onChange={() => setPaymentMethod('gateway')}
                />
                Card / JazzCash / Easypaisa
              </label>
            </div>
          </div>

          {error ? <p className="text-sm text-accent">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink py-3 text-sm uppercase tracking-wide text-paper disabled:opacity-50"
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </form>

        <div className="h-fit border border-border p-6">
          <h2 className="mb-4 text-sm uppercase tracking-wide text-ink">Order Summary</h2>
          <ul className="space-y-2 text-sm text-muted">
            {items.map((item) => (
              <li key={item.variantSku} className="flex justify-between">
                <span>
                  {item.title} {item.size ? `(${item.size})` : ''} × {item.qty}
                </span>
                <span>{formatPaisa((item.currentPricePaisa ?? item.priceAtAddPaisa) * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm text-ink">
            <span>Subtotal</span>
            <span>{formatPaisa(subtotalPaisa)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Shipping calculated when you place your order.</p>
        </div>
      </div>
    </div>
  );
}
