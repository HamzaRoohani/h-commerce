import Image from 'next/image';
import Link from 'next/link';
import { formatPaisa } from '@/lib/money';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { QuickAddButton } from '@/components/product/QuickAddButton';
import type { Product } from '@/types/product';

export function ProductCard({ product }: { product: Product }) {
  const onSale = product.salePricePaisa != null && product.salePricePaisa < product.basePricePaisa;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-border">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {product.isNewIn ? (
          <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-xs uppercase tracking-wide text-paper">
            New In
          </span>
        ) : null}
        <WishlistButton
          product={product}
          className="absolute right-2 top-2 bg-paper/90 px-1.5 py-0.5 text-base leading-none text-ink"
        />
        <QuickAddButton product={product} />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm text-ink">{product.title}</p>
        <p className="text-sm">
          {onSale ? (
            <>
              <span className="text-accent">{formatPaisa(product.salePricePaisa!)}</span>{' '}
              <span className="text-muted line-through">{formatPaisa(product.basePricePaisa)}</span>
            </>
          ) : (
            <span className="text-ink">{formatPaisa(product.basePricePaisa)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
