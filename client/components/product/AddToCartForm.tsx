'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCartUiStore } from '@/store/cartUiStore';
import { useWishlist } from '@/hooks/useWishlist';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';

export function AddToCartForm({ product }: { product: Product }) {
  const hasSizes = product.variants.some((v) => v.size);
  const [selectedSku, setSelectedSku] = useState<string | null>(
    hasSizes ? null : (product.variants[0]?.sku ?? null),
  );
  const [status, setStatus] = useState<'idle' | 'adding' | 'error'>('idle');
  const { addItem } = useCart();
  const openCart = useCartUiStore((state) => state.open);
  const { productIds, isAuthenticated, toggle } = useWishlist();
  const router = useRouter();
  const isWishlisted = productIds.has(product._id);

  const selectedVariant = product.variants.find((v) => v.sku === selectedSku) ?? null;
  const currentPricePaisa =
    selectedVariant?.priceOverridePaisa ?? product.salePricePaisa ?? product.basePricePaisa;

  async function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock === 0) return;
    setStatus('adding');
    try {
      await addItem({
        productId: product._id,
        variantSku: selectedVariant.sku,
        qty: 1,
        priceAtAddPaisa: currentPricePaisa,
        title: product.title,
        slug: product.slug,
        image: product.images[0] ?? null,
        size: selectedVariant.size,
        stock: selectedVariant.stock,
        currentPricePaisa,
      });
      setStatus('idle');
      openCart();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      {hasSizes ? (
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.sku}
                type="button"
                disabled={variant.stock === 0}
                onClick={() => setSelectedSku(variant.sku)}
                className={`border px-3 py-1 text-sm ${
                  variant.stock === 0
                    ? 'border-border text-muted line-through'
                    : variant.sku === selectedSku
                      ? 'border-ink text-ink'
                      : 'border-border text-ink'
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-sm">
        {selectedVariant ? (
          selectedVariant.stock > 0 ? (
            <span className="text-ink">In stock</span>
          ) : (
            <span className="text-muted">Out of stock</span>
          )
        ) : (
          <span className="text-muted">Select a size</span>
        )}
      </p>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!selectedVariant || selectedVariant.stock === 0 || status === 'adding'}
        className="mt-8 w-full bg-ink py-3 text-sm uppercase tracking-wide text-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'adding' ? 'Adding…' : 'Add to Cart'}
      </button>
      {status === 'error' ? <p className="mt-2 text-sm text-accent">Couldn&apos;t add to cart. Try again.</p> : null}

      <button
        type="button"
        onClick={() => (isAuthenticated ? toggle(product) : router.push('/login'))}
        className="mt-3 w-full border border-border py-3 text-sm uppercase tracking-wide text-ink"
      >
        {isWishlisted ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
      </button>
    </div>
  );
}
