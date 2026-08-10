'use client';

import { useRouter } from 'next/navigation';
import { useWishlist } from '@/hooks/useWishlist';
import type { Product } from '@/types/product';

export function WishlistButton({ product, className }: { product: Product; className?: string }) {
  const router = useRouter();
  const { productIds, isAuthenticated, toggle } = useWishlist();
  const isWishlisted = productIds.has(product._id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    toggle(product);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isWishlisted}
      className={className ?? 'text-lg leading-none'}
    >
      {isWishlisted ? '♥' : '♡'}
    </button>
  );
}
