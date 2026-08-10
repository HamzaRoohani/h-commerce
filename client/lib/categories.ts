import { publicFetch } from './api';
import type { Category } from '@/types/category';

const REVALIDATE_SECONDS = 300;

export async function listCategories(): Promise<Category[]> {
  const { categories } = await publicFetch<{ categories: Category[] }>('/categories', REVALIDATE_SECONDS);
  return categories;
}

export function findCategoryBySlug(categories: Category[], slug: string): Category | null {
  for (const category of categories) {
    if (category.slug === slug) return category;
    const found = findCategoryBySlug(category.children, slug);
    if (found) return found;
  }
  return null;
}
