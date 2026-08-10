'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { ProductGrid } from '@/components/product/ProductGrid';

export default function WishlistPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const products = useWishlistStore((state) => state.products);
  const loaded = useWishlistStore((state) => state.loaded);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated' || !loaded) {
    return <div className="mx-auto max-w-container px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="mb-8 font-serif text-2xl text-ink">Your Wishlist</h1>
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted">Nothing saved yet.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-ink underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
