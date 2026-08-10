import Link from 'next/link';
import { listCategories } from '@/lib/categories';
import { listProducts } from '@/lib/products';
import { ProductGrid } from '@/components/product/ProductGrid';

export default async function HomePage() {
  const [categories, { products: newIn }] = await Promise.all([
    listCategories(),
    listProducts({ sort: 'newest', limit: 8 }),
  ]);

  return (
    <div>
      <section className="mx-auto max-w-container px-6 py-20 text-center">
        <h1 className="font-serif text-4xl text-ink md:text-6xl">H.</h1>
        <p className="mt-4 text-muted">Clothing, unstitched fabric, and accessories.</p>
      </section>

      <section className="mx-auto max-w-container px-6 pb-16">
        <h2 className="mb-6 text-lg uppercase tracking-wide text-ink">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/collections/${category.slug}`}
              className="flex aspect-square items-center justify-center border border-border bg-white text-sm uppercase tracking-wide text-ink transition-colors hover:border-ink"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-container px-6 pb-20">
        <h2 className="mb-6 text-lg uppercase tracking-wide text-ink">New In</h2>
        <ProductGrid products={newIn} />
      </section>
    </div>
  );
}
