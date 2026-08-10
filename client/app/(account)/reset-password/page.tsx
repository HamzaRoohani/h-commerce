import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
