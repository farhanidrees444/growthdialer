import { ShimmerSkeleton } from '@/components/ui/shimmer-skeleton';
import { cn } from '@/lib/utils';

const premiumPanel =
  'relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl';

function KpiCardSkeleton() {
  return (
    <div className={premiumPanel}>
      <div className="p-4 pb-1">
        <div className="flex items-center justify-between gap-3">
          <ShimmerSkeleton className="h-3 w-20" rounded="rounded" />
          <ShimmerSkeleton className="h-8 w-8" rounded="rounded-xl" />
        </div>
        <ShimmerSkeleton className="mt-3 h-10 w-24" />
        <ShimmerSkeleton className="mt-2 h-3 w-16" />
      </div>
      <div className="h-8 px-1 pb-2">
        <ShimmerSkeleton className="h-full w-full" rounded="rounded-md" />
      </div>
    </div>
  );
}

function RecentCallRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <ShimmerSkeleton className="h-9 w-9 shrink-0" rounded="rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerSkeleton className="h-3.5 w-32" />
        <ShimmerSkeleton className="h-2.5 w-24" />
      </div>
      <ShimmerSkeleton className="h-5 w-16 shrink-0" rounded="rounded-full" />
    </div>
  );
}

function PanelHeaderSkeleton({ width = 'w-28' }: { width?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2">
        <ShimmerSkeleton className="h-4 w-4" rounded="rounded" />
        <ShimmerSkeleton className={cn('h-4', width)} />
      </div>
      <ShimmerSkeleton className="h-3 w-10" />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="relative flex-1 overflow-y-auto">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_42%_0%,rgba(139,92,246,0.1),transparent_32%),radial-gradient(circle_at_92%_28%,rgba(6,182,212,0.06),transparent_28%)]"
      />
      <div className="relative z-[1]">
        {/* Hero skeleton */}
        <div className="px-4 pb-4 pt-5 lg:px-6 lg:pb-5 lg:pt-6">
          <div className={cn(premiumPanel, 'p-5 lg:p-6')}>
            <ShimmerSkeleton className="mb-4 h-7 w-40" rounded="rounded-full" />
            <ShimmerSkeleton className="h-12 w-3/4 max-w-md" />
            <ShimmerSkeleton className="mt-3 h-4 w-full max-w-lg" />
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ShimmerSkeleton key={i} className="h-[68px]" rounded="rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        {/* KPI grid — fixed heights match real cards */}
        <div className="grid grid-cols-2 gap-3.5 px-4 pt-1 lg:grid-cols-4 lg:gap-4 lg:px-6 lg:pt-0 xl:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>

        {/* Call activity chart — h-[300px] matches loaded chart wrapper */}
        <div className="mt-4 px-4 lg:mt-5 lg:px-6">
          <div className={cn(premiumPanel, 'h-[300px]')}>
            <PanelHeaderSkeleton width="w-24" />
            <div className="px-5 pb-5">
              <ShimmerSkeleton className="h-[240px] w-full lg:h-[220px]" rounded="rounded-xl" />
            </div>
          </div>
        </div>

        {/* Bottom row — Recent · Up Next · Number Health */}
        <div className="mt-4 grid grid-cols-1 gap-4 px-4 pb-6 lg:mt-5 lg:grid-cols-2 xl:grid-cols-3 lg:px-6">
          <div className={cn(premiumPanel, 'min-h-[320px]')}>
            <PanelHeaderSkeleton width="w-28" />
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 4 }).map((_, i) => (
                <RecentCallRowSkeleton key={i} />
              ))}
            </div>
          </div>

          <div className={cn(premiumPanel, 'min-h-[320px]')}>
            <PanelHeaderSkeleton width="w-20" />
            <div className="space-y-3 px-5 pb-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <ShimmerSkeleton className="h-9 w-9 shrink-0" rounded="rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <ShimmerSkeleton className="h-3.5 w-28" />
                    <ShimmerSkeleton className="h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(premiumPanel, 'min-h-[320px] lg:col-span-2 xl:col-span-1')}>
            <PanelHeaderSkeleton width="w-24" />
            <div className="space-y-3 px-5 pb-5">
              <ShimmerSkeleton className="h-10 w-full" rounded="rounded-xl" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShimmerSkeleton className="h-8 w-8" rounded="rounded-lg" />
                    <div className="space-y-1.5">
                      <ShimmerSkeleton className="h-3 w-24" />
                      <ShimmerSkeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                  <ShimmerSkeleton className="h-5 w-12" rounded="rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
