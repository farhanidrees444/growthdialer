import { ShimmerSkeleton } from '@/components/ui/shimmer-skeleton';
import { cn } from '@/lib/utils';

export function SidebarSkeleton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-zinc-800/50 bg-zinc-950',
        'hidden shrink-0 lg:flex lg:static lg:h-full',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      aria-busy
      aria-label="Loading navigation"
    >
      <div className={cn('shrink-0 pt-3', collapsed ? 'px-2' : 'px-3')}>
        <ShimmerSkeleton className={cn('h-10', collapsed ? 'w-10 mx-auto' : 'w-full')} rounded="rounded-lg" />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-2 py-2">
        <ShimmerSkeleton className={cn('h-10', collapsed && 'mx-auto w-10')} rounded="rounded-lg" />

        {!collapsed && (
          <ShimmerSkeleton className="mx-3 mb-1 mt-3 h-2.5 w-12" rounded="rounded" />
        )}
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerSkeleton
            key={`engage-${i}`}
            className={cn('h-10', collapsed && 'mx-auto w-10')}
            rounded="rounded-lg"
          />
        ))}

        {!collapsed && <ShimmerSkeleton className="mx-3 mb-1 mt-3 h-2.5 w-16" rounded="rounded" />}
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerSkeleton
            key={`intel-${i}`}
            className={cn('h-10', collapsed && 'mx-auto w-10')}
            rounded="rounded-lg"
          />
        ))}

        {!collapsed && <ShimmerSkeleton className="mx-3 mb-1 mt-3 h-2.5 w-10" rounded="rounded" />}
        {Array.from({ length: 2 }).map((_, i) => (
          <ShimmerSkeleton
            key={`team-${i}`}
            className={cn('h-10', collapsed && 'mx-auto w-10')}
            rounded="rounded-lg"
          />
        ))}
      </nav>
    </aside>
  );
}
