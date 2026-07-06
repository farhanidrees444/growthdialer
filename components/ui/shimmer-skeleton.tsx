import { cn } from '@/lib/utils';

export function ShimmerSkeleton({
  className,
  rounded = 'rounded-lg',
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white/[0.04]',
        rounded,
        className,
      )}
      aria-hidden
    >
      <div className="skeleton-shimmer absolute inset-0" />
    </div>
  );
}
