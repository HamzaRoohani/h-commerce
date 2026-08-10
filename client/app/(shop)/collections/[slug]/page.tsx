import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { findCategoryBySlug, listCategories } from '@/lib/categories';
import { listProducts, type ListProductsParams } from '@/lib/products';
import { ProductGrid } from '@/components/product/ProductGrid';

type PageParams = { slug: string };
type PageSearchParams = { sort?: string; page?: string };

const SORT_OPTIONS: Array<{ value: NonNullable<ListProductsParams['sort']>; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function isValidSort(value: string | undefined): value is NonNullable<ListProductsParams['sort']> {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories();
  const category = findCategoryBySlug(categories, slug);

  if (!category) return {};

  return {
    title: category.name,
    description: `Shop ${category.name} at H.`,
    alternates: { canonical: `/collections/${category.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { slug } = await params;
  const { sort: sortParam, page: pageParam } = await searchParams;

  const categories = await listCategories();
  const category = findCategoryBySlug(categories, slug);
  if (!category) notFound();

  const sort = isValidSort(sortParam) ? sortParam : 'newest';
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const { products, totalPages } = await listProducts({ category: slug, sort, page, limit: 24 });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: category.name, item: `/collections/${category.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="mb-4 text-xs text-muted">
        <Link href="/">Home</Link> / <span className="text-ink">{category.name}</span>
      </nav>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl uppercase tracking-wide text-ink">{category.name}</h1>
        <div className="flex gap-3 text-sm">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/collections/${slug}?sort=${option.value}`}
              className={option.value === sort ? 'text-ink underline' : 'text-muted'}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <ProductGrid products={products} />

      {totalPages > 1 ? (
        <nav className="mt-10 flex justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={`/collections/${slug}?sort=${sort}&page=${page - 1}`}>Previous</Link>
          ) : null}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/collections/${slug}?sort=${sort}&page=${page + 1}`}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
