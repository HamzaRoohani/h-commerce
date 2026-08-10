'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordRequest } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPasswordRequest({ token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Reset Password</h1>
        <p className="mt-4 text-sm text-accent">Missing reset token. Use the link from your email.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm text-ink underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-ink">Reset Password</h1>
        <p className="mt-4 text-sm text-ink">Password reset. Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-serif text-2xl text-ink">Reset Password</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-wide text-muted">
            New Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border px-3 py-2 text-sm"
          />
        </div>

        {error ? <p className="text-sm text-accent">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink py-3 text-sm uppercase tracking-wide text-paper disabled:opacity-50"
        >
          {submitting ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
