'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { listProducts } from '@/lib/products';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { Product } from '@/types/product';

const DEBOUNCE_MS = 300;

export function SearchClient() {
  const router = useRouter();
  const initialQuery = useSearchParams().get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setResults(null);
      setLoading(false);
      router.replace('/search', { scroll: false });
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
      listProducts({ search: trimmed, limit: 24 })
        .then((res) => setResults(res.products))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>
      <input
        id="search-input"
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products…"
        className="w-full border-b border-border bg-transparent py-3 text-lg text-ink placeholder:text-muted focus:outline-none"
      />

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted">Searching…</p>
        ) : results === null ? (
          <p className="text-sm text-muted">Start typing to search the catalog.</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted">No results for &quot;{query.trim()}&quot;.</p>
        ) : (
          <ProductGrid products={results} />
        )}
      </div>
    </div>
  );
}
