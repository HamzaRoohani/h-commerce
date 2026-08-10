'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return <div className="mx-auto max-w-container px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  if (status === 'guest' || !user) {
    return null; // redirecting
  }

  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Access Denied</h1>
        <p className="mt-4 text-sm text-muted">This area is for admin accounts only.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-ink underline">
          Back to store
        </Link>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/orders', label: 'Orders' },
  ];

  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-8">
          <span className="font-serif text-lg text-ink">H. Admin</span>
          <nav className="flex gap-6 text-sm uppercase tracking-wide">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname.startsWith(item.href) ? 'text-ink underline' : 'text-muted'}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/" className="text-xs text-muted underline">
          Back to store
        </Link>
      </div>
      {children}
    </div>
  );
}
