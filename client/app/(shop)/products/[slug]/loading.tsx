import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-4 h-6 w-1/3" />
          <Skeleton className="mt-6 h-20 w-full" />
          <Skeleton className="mt-8 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
