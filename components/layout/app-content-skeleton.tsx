import { ShimmerSkeleton } from '@/components/ui/shimmer-skeleton';

/** Generic main-content skeleton while workspace/auth resolves (non-dashboard routes). */
export function AppContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <ShimmerSkeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ShimmerSkeleton className="h-40" rounded="rounded-2xl" />
        <ShimmerSkeleton className="h-40" rounded="rounded-2xl" />
      </div>
      <ShimmerSkeleton className="min-h-[280px] flex-1" rounded="rounded-2xl" />
    </div>
  );
}
