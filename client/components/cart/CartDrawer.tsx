'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useCartUiStore } from '@/store/cartUiStore';
import { formatPaisa } from '@/lib/money';

export function CartDrawer() {
  const isOpen = useCartUiStore((state) => state.isOpen);
  const close = useCartUiStore((state) => state.close);
  const { items, subtotalPaisa, updateQty, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        onClick={close}
        className="absolute inset-0 bg-ink/40"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-serif text-lg text-ink">Your Cart</h2>
          <button type="button" onClick={close} aria-label="Close cart" className="text-sm text-muted">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">Your cart is empty.</p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.variantSku} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-border">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm text-ink">{item.title}</p>
                      {item.size ? <p className="text-xs text-muted">Size: {item.size}</p> : null}
                      <p className="mt-1 text-sm text-ink">
                        {formatPaisa(item.currentPricePaisa ?? item.priceAtAddPaisa)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
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
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-border px-6 py-4">
            <div className="flex justify-between text-sm text-ink">
              <span>Subtotal</span>
              <span>{formatPaisa(subtotalPaisa)}</span>
            </div>
            <Link
              href="/cart"
              onClick={close}
              className="mt-4 block w-full bg-ink py-3 text-center text-sm uppercase tracking-wide text-paper"
            >
              View Cart
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
