import type { MetadataRoute } from 'next';
import { listCategories } from '@/lib/categories';
import { listProducts } from '@/lib/products';
import type { Category } from '@/types/category';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await listCategories();
  // 60 covers the seeded catalog; swap for full pagination once product count grows.
  const { products } = await listProducts({ limit: 60 });

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = flattenCategories(categories).map((category) => ({
    url: `${SITE_URL}/collections/${category.slug}`,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
