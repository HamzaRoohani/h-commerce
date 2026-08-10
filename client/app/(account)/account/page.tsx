'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutRequest } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { useServerCartStore } from '@/store/serverCartStore';

export default function AccountPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetServerCart = useServerCartStore((state) => state.reset);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  async function handleLogout() {
    await logoutRequest().catch(() => {});
    // Clearing the session flips `status` to 'guest', which the effect
    // above picks up to redirect to /login — no separate push needed here
    // (an extra one would just race that redirect).
    clearSession();
    resetServerCart();
  }

  if (status !== 'authenticated' || !user) {
    return <div className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-serif text-2xl text-ink">My Account</h1>

      <dl className="mt-8 space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
          <dd className="text-ink">{user.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
          <dd className="text-ink">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Email Status</dt>
          <dd className={user.isVerified ? 'text-ink' : 'text-accent'}>
            {user.isVerified ? 'Verified' : 'Not verified'}
          </dd>
        </div>
      </dl>

      <Link href="/account/orders" className="mt-8 block text-sm text-ink underline">
        Order History
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 w-full border border-border py-3 text-sm uppercase tracking-wide text-ink"
      >
        Log Out
      </button>
    </div>
  );
}
