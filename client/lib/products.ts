import { publicFetch } from './api';
import type { Product, ProductListResponse } from '@/types/product';

const REVALIDATE_SECONDS = 300;

export type ListProductsParams = {
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  search?: string;
};

export function listProducts(params: ListProductsParams = {}): Promise<ProductListResponse> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.sort) search.set('sort', params.sort);
  if (params.search) search.set('search', params.search);

  const qs = search.toString();
  return publicFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`, REVALIDATE_SECONDS);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { product } = await publicFetch<{ product: Product }>(
      `/products/${slug}`,
      REVALIDATE_SECONDS,
    );
    return product;
  } catch {
    return null;
  }
}
