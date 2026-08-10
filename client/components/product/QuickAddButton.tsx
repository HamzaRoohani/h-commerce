'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCartUiStore } from '@/store/cartUiStore';
import type { Product } from '@/types/product';

/**
 * Quick-add straight from the grid card, no PDP navigation (§12.6). Single-
 * variant products add on the first click; multi-size products reveal an
 * inline size row first.
 */
export function QuickAddButton({ product }: { product: Product }) {
  const [showSizes, setShowSizes] = useState(false);
  const [status, setStatus] = useState<'idle' | 'adding'>('idle');
  const { addItem } = useCart();
  const openCart = useCartUiStore((state) => state.open);

  const hasSizes = product.variants.some((v) => v.size);
  const singleVariant = !hasSizes ? product.variants[0] : null;

  async function add(variant: Product['variants'][number]) {
    if (variant.stock === 0 || status === 'adding') return;
    setStatus('adding');
    const currentPricePaisa = variant.priceOverridePaisa ?? product.salePricePaisa ?? product.basePricePaisa;
    try {
      await addItem({
        productId: product._id,
        variantSku: variant.sku,
        qty: 1,
        priceAtAddPaisa: currentPricePaisa,
        title: product.title,
        slug: product.slug,
        image: product.images[0] ?? null,
        size: variant.size,
        stock: variant.stock,
        currentPricePaisa,
      });
      setShowSizes(false);
      openCart();
    } finally {
      setStatus('idle');
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (singleVariant) {
      add(singleVariant);
    } else {
      setShowSizes((prev) => !prev);
    }
  }

  return (
    <div
      className="absolute inset-x-0 bottom-0 bg-paper/95"
      onClick={(e) => e.preventDefault()}
    >
      {showSizes ? (
        <div className="flex flex-wrap gap-1 p-2">
          {product.variants.map((variant) => (
            <button
              key={variant.sku}
              type="button"
              disabled={variant.stock === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                add(variant);
              }}
              className={`border px-2 py-1 text-xs ${
                variant.stock === 0 ? 'border-border text-muted line-through' : 'border-ink text-ink'
              }`}
            >
              {variant.size}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={status === 'adding'}
          className="w-full py-2 text-xs uppercase tracking-wide text-ink disabled:opacity-50"
        >
          {status === 'adding' ? 'Adding…' : 'Quick Add'}
        </button>
      )}
    </div>
  );
}
