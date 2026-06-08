'use client';

import { cn } from '@/lib/utils';
import {
  HEALTH_TIER_STYLES,
  type NumberHealthTier,
} from '@/lib/numbers/health';

export function NumberHealthBadge({
  label,
  tier,
  className,
}: {
  label: string;
  tier: NumberHealthTier;
  className?: string;
}) {
  const styles = HEALTH_TIER_STYLES[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        styles.badge,
        className,
      )}
    >
      {label}
    </span>
  );
}
