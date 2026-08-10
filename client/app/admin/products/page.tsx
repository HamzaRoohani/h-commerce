'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminDeleteProduct, adminListProducts } from '@/lib/admin';
import { formatPaisa } from '@/lib/money';
import type { Product } from '@/types/product';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load(searchTerm?: string) {
    adminListProducts({ search: searchTerm })
      .then((res) => setProducts(res.products))
      .catch(() => setError('Failed to load products.'));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    try {
      await adminDeleteProduct(product._id);
      setProducts((prev) => prev?.filter((p) => p._id !== product._id) ?? null);
    } catch {
      setError(`Failed to delete "${product.title}".`);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink px-4 py-2 text-sm uppercase tracking-wide text-paper"
        >
          New Product
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full max-w-xs border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="border border-border px-4 py-2 text-sm uppercase tracking-wide text-ink">
          Search
        </button>
      </form>

      {error ? <p className="mb-4 text-sm text-accent">{error}</p> : null}

      {products === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">No products found.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="py-2">Title</th>
              <th className="py-2">Category</th>
              <th className="py-2">Price</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product._id}>
                  <td className="py-3 text-ink">{product.title}</td>
                  <td className="py-3 text-muted">{product.category?.name ?? '—'}</td>
                  <td className="py-3 text-ink">{formatPaisa(product.salePricePaisa ?? product.basePricePaisa)}</td>
                  <td className="py-3 text-muted">{totalStock}</td>
                  <td className="py-3">
                    <span className={product.isActive ? 'text-ink' : 'text-muted'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/products/${product._id}`} className="mr-4 text-ink underline">
                      Edit
                    </Link>
                    <button type="button" onClick={() => handleDelete(product)} className="text-accent underline">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
