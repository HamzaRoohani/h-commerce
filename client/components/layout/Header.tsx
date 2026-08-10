import Link from 'next/link';
import { AccountLink } from '@/components/auth/AccountLink';
import { CartTrigger } from '@/components/cart/CartTrigger';

/**
 * Minimal header shell. Mega-menu lands in Phase 6 (§12 of the build plan).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-container items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl tracking-wide">
          H.
        </Link>
        <nav className="hidden gap-8 text-sm uppercase tracking-wide text-ink md:flex">
          <Link href="/collections/men">Men</Link>
          <Link href="/collections/women">Women</Link>
          <Link href="/collections/kids">Kids</Link>
          <Link href="/collections/accessories">Accessories</Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/search" aria-label="Search">
            Search
          </Link>
          <AccountLink />
          <CartTrigger />
        </div>
      </div>
    </header>
  );
}
