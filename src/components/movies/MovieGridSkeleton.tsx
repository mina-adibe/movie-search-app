import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MovieGridSkeletonProps {
  count?: number;
  className?: string;
}

export function MovieGridSkeleton({ count = 10, className }: MovieGridSkeletonProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  );
}

function MovieCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden p-0">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </div>
    </Card>
  );
}
