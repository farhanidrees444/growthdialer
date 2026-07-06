import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared glass panel for skeleton card containers — no harsh white borders. */
export const skeletonGlassPanelClass = 'skeleton-glass-panel';

export function SkeletonGlassPanel({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(skeletonGlassPanelClass, 'rounded-xl', className)}>
      {children}
    </div>
  );
}

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
        'premium-skeleton-shimmer relative overflow-hidden',
        rounded,
        className,
      )}
      aria-hidden
    />
  );
}
