'use client';

import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlistStore';

export function WishlistLink() {
  const count = useWishlistStore((state) => state.products.length);

  return (
    <Link href="/wishlist" aria-label="Wishlist">
      Wishlist{count > 0 ? ` (${count})` : ''}
    </Link>
  );
}
