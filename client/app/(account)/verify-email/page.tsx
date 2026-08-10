import { Suspense } from 'react';
import { VerifyEmailStatus } from './VerifyEmailStatus';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted">Loading…</div>}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
