import Link from 'next/link';
import { AccountLink } from '@/components/auth/AccountLink';
import { CartTrigger } from '@/components/cart/CartTrigger';
import { MegaMenu } from '@/components/layout/MegaMenu';
import { MobileNav } from '@/components/layout/MobileNav';
import { WishlistLink } from '@/components/wishlist/WishlistLink';
import { listCategories } from '@/lib/categories';

export async function Header() {
  const categories = await listCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-container items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <MobileNav categories={categories} />
          <Link href="/" className="font-serif text-2xl tracking-wide">
            H.
          </Link>
        </div>
        <MegaMenu categories={categories} />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/search" aria-label="Search">
            Search
          </Link>
          <WishlistLink />
          <AccountLink />
          <CartTrigger />
        </div>
      </div>
    </header>
  );
}
