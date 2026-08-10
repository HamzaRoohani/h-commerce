import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/products';
import { formatPaisa } from '@/lib/money';
import { ProductGallery } from '@/components/product/ProductGallery';

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: product.images[0] ? { images: [{ url: product.images[0] }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const onSale = product.salePricePaisa != null && product.salePricePaisa < product.basePricePaisa;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const inStock = totalStock > 0;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images,
    sku: product.variants[0]?.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency,
      price: ((onSale ? product.salePricePaisa! : product.basePricePaisa) / 100).toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.avg,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <nav className="mb-6 text-xs text-muted">
        <Link href="/">Home</Link> / <Link href={`/collections/${product.category.slug}`}>{product.category.name}</Link> /{' '}
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <h1 className="font-serif text-2xl text-ink">{product.title}</h1>
          <p className="mt-2 text-lg">
            {onSale ? (
              <>
                <span className="text-accent">{formatPaisa(product.salePricePaisa!)}</span>{' '}
                <span className="text-muted line-through">{formatPaisa(product.basePricePaisa)}</span>
              </>
            ) : (
              <span className="text-ink">{formatPaisa(product.basePricePaisa)}</span>
            )}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>

          {product.variants.some((v) => v.size) ? (
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wide text-ink">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <span
                    key={variant.sku}
                    className={`border px-3 py-1 text-sm ${
                      variant.stock > 0 ? 'border-border text-ink' : 'border-border text-muted line-through'
                    }`}
                  >
                    {variant.size}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-sm">
            {inStock ? <span className="text-ink">In stock</span> : <span className="text-muted">Out of stock</span>}
          </p>

          {/* Add-to-cart lands in Phase 4 once the cart exists. */}
          <button
            type="button"
            disabled
            className="mt-8 w-full cursor-not-allowed border border-border py-3 text-sm uppercase tracking-wide text-muted"
          >
            Add to Cart — Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
