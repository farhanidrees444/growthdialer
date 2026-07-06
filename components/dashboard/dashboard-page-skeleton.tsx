import {
  ShimmerSkeleton,
  SkeletonGlassPanel,
} from '@/components/ui/shimmer-skeleton';
import { cn } from '@/lib/utils';

function KpiCardSkeleton() {
  return (
    <SkeletonGlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3 pt-0.5">
          <ShimmerSkeleton className="h-9 w-20" rounded="rounded-lg" />
          <ShimmerSkeleton className="h-3.5 w-[100px]" rounded="rounded-md" />
        </div>
        <ShimmerSkeleton className="h-8 w-8 shrink-0" rounded="rounded-full" />
      </div>
    </SkeletonGlassPanel>
  );
}

function FeedRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <ShimmerSkeleton className="h-9 w-9 shrink-0" rounded="rounded-full" />
      <ShimmerSkeleton className="h-3.5 min-w-0 flex-1 max-w-[220px]" rounded="rounded-md" />
      <ShimmerSkeleton className="h-5 w-14 shrink-0" rounded="rounded-full" />
    </div>
  );
}

function VoiceStatusSkeleton() {
  return (
    <SkeletonGlassPanel className="flex min-h-[320px] flex-col items-center justify-center px-5 py-8">
      <ShimmerSkeleton className="h-12 w-12" rounded="rounded-full" />
      <ShimmerSkeleton className="mt-5 h-3.5 w-28" rounded="rounded-md" />
      <ShimmerSkeleton className="mt-2.5 h-3.5 w-36" rounded="rounded-md" />
    </SkeletonGlassPanel>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="relative flex-1 overflow-y-auto bg-[#08080A]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_42%_0%,rgba(139,92,246,0.08),transparent_32%),radial-gradient(circle_at_92%_28%,rgba(6,182,212,0.05),transparent_28%)]"
      />

      <div className="relative z-[1]">
        {/* ROW 1 — Dynamic greeting node */}
        <div className="px-4 pb-4 pt-5 lg:px-6 lg:pb-5 lg:pt-6">
          <ShimmerSkeleton className="h-7 w-[200px]" rounded="rounded-lg" />
          <ShimmerSkeleton className="mt-3 h-4 w-[120px]" rounded="rounded-md" />
        </div>

        {/* ROW 2 — KPI metrics grid */}
        <div className="grid grid-cols-2 gap-3.5 px-4 pt-1 lg:grid-cols-4 lg:gap-4 lg:px-6 lg:pt-0 xl:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>

        {/* ROW 3 — Live floor workspace split (70 / 30) */}
        <div className="mt-4 grid grid-cols-1 gap-4 px-4 pb-6 lg:mt-5 lg:grid-cols-[7fr_3fr] lg:px-6">
          <SkeletonGlassPanel className="min-h-[320px] px-5 py-4">
            <ShimmerSkeleton className="mb-4 h-4 w-[150px]" rounded="rounded-md" />
            <div className={cn('divide-y divide-white/[0.04]')}>
              {Array.from({ length: 4 }).map((_, i) => (
                <FeedRowSkeleton key={i} />
              ))}
            </div>
          </SkeletonGlassPanel>

          <VoiceStatusSkeleton />
        </div>
      </div>
    </div>
  );
}
