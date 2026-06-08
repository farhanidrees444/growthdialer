'use client';

import { cn } from '@/lib/utils';
import { PRESENTATION_STYLES, type PresentationTier } from '@/lib/numbers/health';

export function NumberHealthBadge({
  label,
  tier,
  className,
}: {
  label: string;
  tier: PresentationTier;
  className?: string;
}) {
  const styles = PRESENTATION_STYLES[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide',
        styles.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden />
      {label}
    </span>
  );
}
