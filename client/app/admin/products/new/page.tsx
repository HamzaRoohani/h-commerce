'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { adminCreateProduct } from '@/lib/admin';
import type { AdminProductInput } from '@/types/admin';

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(input: AdminProductInput) {
    await adminCreateProduct(input);
    router.push('/admin/products');
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">New Product</h1>
      <ProductForm onSubmit={handleSubmit} submitLabel="Create Product" />
    </div>
  );
}
