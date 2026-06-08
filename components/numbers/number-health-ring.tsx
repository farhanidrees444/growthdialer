'use client';

import { PRESENTATION_STYLES, type PresentationTier } from '@/lib/numbers/health';
import { cn } from '@/lib/utils';

export function NumberStatusIndicator({
  tier,
  size = 40,
}: {
  tier: PresentationTier;
  size?: number;
}) {
  const styles = PRESENTATION_STYLES[tier];

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className={cn('h-2.5 w-2.5 rounded-full ring-4 ring-white/[0.04]', styles.dot)} />
    </div>
  );
}

/** @deprecated Use NumberStatusIndicator — kept for imports during migration */
export function NumberHealthRing({
  tier,
}: {
  health: number | null;
  tier: PresentationTier;
  size?: number;
}) {
  return <NumberStatusIndicator tier={tier} />;
}
