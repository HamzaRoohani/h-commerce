import { Suspense } from 'react';
import { SearchClient } from './SearchClient';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-container px-6 py-12 text-sm text-muted">Loading…</div>}>
      <SearchClient />
    </Suspense>
  );
}
