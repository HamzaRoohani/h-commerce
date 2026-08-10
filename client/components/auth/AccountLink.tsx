'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export function AccountLink() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === 'authenticated' && user) {
    return (
      <>
        {user.role === 'admin' ? (
          <Link href="/admin" className="text-accent">
            Admin
          </Link>
        ) : null}
        <Link href="/account" aria-label="Account">
          {user.name.split(' ')[0]}
        </Link>
      </>
    );
  }

  return (
    <Link href="/login" aria-label="Account" className={status === 'loading' ? 'opacity-0' : undefined}>
      Account
    </Link>
  );
}
