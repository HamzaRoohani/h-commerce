'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmailRequest } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/lib/api';

export function VerifyEmailStatus() {
  const token = useSearchParams().get('token');
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(token ? 'pending' : 'error');
  const [message, setMessage] = useState(token ? 'Verifying your email…' : 'Missing verification token.');

  useEffect(() => {
    if (!token) return;

    verifyEmailRequest(token)
      .then(({ user: verifiedUser }) => {
        setStatus('success');
        setMessage('Your email is verified.');
        // Keep the in-memory session in sync so the header/account reflect it immediately.
        if (accessToken && user) setSession(accessToken, verifiedUser);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'Verification failed.');
      });
    // Only re-run if the token itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <h1 className="font-serif text-2xl text-ink">Email Verification</h1>
      <p className="mt-4 text-sm text-muted">{message}</p>
      {status !== 'pending' ? (
        <Link href={status === 'success' ? '/account' : '/login'} className="mt-6 inline-block text-sm text-ink underline">
          {status === 'success' ? 'Go to your account' : 'Back to login'}
        </Link>
      ) : null}
    </div>
  );
}
