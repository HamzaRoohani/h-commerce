import { Skeleton } from '@/components/ui/Skeleton';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export default function CollectionLoading() {
  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <Skeleton className="mb-8 h-8 w-48" />
      <ProductGridSkeleton />
    </div>
  );
}
