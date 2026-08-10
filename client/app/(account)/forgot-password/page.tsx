'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { forgotPasswordRequest } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await forgotPasswordRequest(email);
      setMessage(res.message);
    } catch {
      // Same generic message either way — the API never reveals whether the email exists.
      setMessage('If that email is registered, a reset link has been sent.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-serif text-2xl text-ink">Forgot Password</h1>
      <p className="mt-2 text-sm text-muted">We&apos;ll email you a link to reset your password.</p>

      {message ? (
        <p className="mt-8 text-sm text-ink">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wide text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink py-3 text-sm uppercase tracking-wide text-paper disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-xs text-muted">
        <Link href="/login">Back to login</Link>
      </p>
    </div>
  );
}
