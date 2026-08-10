'use client';

import { useEffect, useState } from 'react';
import { listCategories } from '@/lib/categories';
import type { Category } from '@/types/category';
import type { Product, ProductVariant } from '@/types/product';
import type { AdminProductInput } from '@/types/admin';

function flattenCategories(categories: Category[], depth = 0): Array<{ id: string; label: string }> {
  return categories.flatMap((c) => [
    { id: c._id, label: `${'— '.repeat(depth)}${c.name}` },
    ...flattenCategories(c.children, depth + 1),
  ]);
}

function paisaToRs(paisa: number | null | undefined): string {
  return paisa == null ? '' : String(paisa / 100);
}

function rsToPaisa(rs: string): number | null {
  const trimmed = rs.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

const emptyVariant: ProductVariant = { size: '', color: null, sku: '', stock: 0, priceOverridePaisa: null };

export function ProductForm({
  initialProduct,
  onSubmit,
  submitLabel,
}: {
  initialProduct?: Product;
  onSubmit: (input: AdminProductInput) => Promise<void>;
  submitLabel: string;
}) {
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [title, setTitle] = useState(initialProduct?.title ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [categoryId, setCategoryId] = useState(initialProduct?.category?._id ?? '');
  const [basePriceRs, setBasePriceRs] = useState(paisaToRs(initialProduct?.basePricePaisa));
  const [salePriceRs, setSalePriceRs] = useState(paisaToRs(initialProduct?.salePricePaisa));
  const [images, setImages] = useState((initialProduct?.images ?? []).join('\n'));
  const [tags, setTags] = useState((initialProduct?.tags ?? []).join(', '));
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants?.length ? initialProduct.variants : [{ ...emptyVariant }],
  );
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  const [isNewIn, setIsNewIn] = useState(initialProduct?.isNewIn ?? false);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured ?? false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories()
      .then((cats) => setCategories(flattenCategories(cats)))
      .catch(() => setError('Failed to load categories.'));
  }, []);

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const basePricePaisa = rsToPaisa(basePriceRs);
    if (basePricePaisa === null) {
      setError('Base price is required.');
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      return;
    }
    const cleanVariants = variants
      .filter((v) => v.sku.trim())
      .map((v) => ({ ...v, size: v.size?.trim() || null, stock: Number(v.stock) || 0 }));
    if (cleanVariants.length === 0) {
      setError('At least one variant (with a SKU) is required.');
      return;
    }

    const input: AdminProductInput = {
      title,
      description,
      category: categoryId,
      basePricePaisa,
      salePricePaisa: rsToPaisa(salePriceRs),
      images: images.split('\n').map((s) => s.trim()).filter(Boolean),
      variants: cleanVariants,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      isActive,
      isNewIn,
      isFeatured,
    };

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="title" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Category
        </label>
        <select
          id="category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-border px-3 py-2 text-sm"
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="basePrice" className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Base Price (Rs)
          </label>
          <input
            id="basePrice"
            required
            inputMode="decimal"
            value={basePriceRs}
            onChange={(e) => setBasePriceRs(e.target.value)}
            className="w-full border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="salePrice" className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Sale Price (Rs, optional)
          </label>
          <input
            id="salePrice"
            inputMode="decimal"
            value={salePriceRs}
            onChange={(e) => setSalePriceRs(e.target.value)}
            className="w-full border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="images" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Image URLs (one per line)
        </label>
        <textarea
          id="images"
          rows={3}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder="https://picsum.photos/seed/example/800/1000"
          className="w-full border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Variants</p>
        <div className="space-y-2">
          {variants.map((variant, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="Size"
                value={variant.size ?? ''}
                onChange={(e) => updateVariant(i, { size: e.target.value })}
                className="w-20 border border-border px-2 py-1.5 text-sm"
              />
              <input
                placeholder="SKU"
                required
                value={variant.sku}
                onChange={(e) => updateVariant(i, { sku: e.target.value })}
                className="flex-1 border border-border px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="Stock"
                min={0}
                value={variant.stock}
                onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                className="w-24 border border-border px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                disabled={variants.length === 1}
                className="text-xs text-accent underline disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addVariant} className="mt-2 text-xs text-ink underline">
          + Add variant
        </button>
      </div>

      <div>
        <label htmlFor="tags" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border border-border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isNewIn} onChange={(e) => setIsNewIn(e.target.checked)} />
          New In
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured
        </label>
      </div>

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="bg-ink px-6 py-3 text-sm uppercase tracking-wide text-paper disabled:opacity-50"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
