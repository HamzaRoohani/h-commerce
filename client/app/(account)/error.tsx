'use client';

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <h1 className="font-serif text-2xl text-ink">Something went wrong</h1>
      <p className="mt-4 text-sm text-muted">
        {error.message || 'We hit an unexpected error loading this page.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 border border-border px-4 py-2 text-sm uppercase tracking-wide text-ink"
      >
        Try again
      </button>
    </div>
  );
}
