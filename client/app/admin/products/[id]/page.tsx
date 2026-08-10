'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { adminGetProduct, adminUpdateProduct } from '@/lib/admin';
import type { Product } from '@/types/product';
import type { AdminProductInput } from '@/types/admin';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetProduct(id)
      .then((res) => setProduct(res.product))
      .catch(() => setError('Product not found.'));
  }, [id]);

  async function handleSubmit(input: AdminProductInput) {
    await adminUpdateProduct(id, input);
    router.push('/admin/products');
  }

  if (error) return <p className="text-sm text-accent">{error}</p>;
  if (!product) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Edit Product</h1>
      <ProductForm initialProduct={product} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
