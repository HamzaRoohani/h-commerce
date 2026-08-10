'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatPaisa } from '@/lib/money';

export default function CartPage() {
  const { items, subtotalPaisa, updateQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-container px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Your Cart</h1>
        <p className="mt-4 text-sm text-muted">Your cart is empty.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-ink underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="font-serif text-2xl text-ink">Your Cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.variantSku} className="flex gap-4 py-6">
              <div className="relative h-32 w-24 shrink-0 overflow-hidden bg-border">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  {item.slug ? (
                    <Link href={`/products/${item.slug}`} className="text-sm text-ink">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm text-ink">{item.title}</p>
                  )}
                  {item.size ? <p className="text-xs text-muted">Size: {item.size}</p> : null}
                  <p className="mt-1 text-sm text-ink">
                    {formatPaisa(item.currentPricePaisa ?? item.priceAtAddPaisa)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    Qty
                    <select
                      value={item.qty}
                      onChange={(e) => updateQty(item.variantSku, Number(e.target.value))}
                      className="border border-border px-2 py-1"
                    >
                      {Array.from({ length: Math.max(item.stock, item.qty) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantSku)}
                    className="text-muted underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-sm text-ink">
                {formatPaisa((item.currentPricePaisa ?? item.priceAtAddPaisa) * item.qty)}
              </p>
            </li>
          ))}
        </ul>

        <div className="h-fit border border-border p-6">
          <div className="flex justify-between text-sm text-ink">
            <span>Subtotal</span>
            <span>{formatPaisa(subtotalPaisa)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">Shipping and total calculated at checkout.</p>
          <Link
            href="/checkout"
            className="mt-6 block w-full bg-ink py-3 text-center text-sm uppercase tracking-wide text-paper"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
