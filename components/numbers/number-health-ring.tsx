'use client';

import { HEALTH_TIER_STYLES, type NumberHealthTier } from '@/lib/numbers/health';
import { cn } from '@/lib/utils';

export function NumberHealthRing({
  health,
  tier,
  size = 44,
}: {
  health: number | null;
  tier: NumberHealthTier;
  size?: number;
}) {
  const styles = HEALTH_TIER_STYLES[tier];
  const value = health ?? 0;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = health === null ? circumference * 0.92 : circumference - (value / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(styles.ring, health === null && 'opacity-40')}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums',
          styles.text,
        )}
      >
        {health === null ? '—' : `${health}`}
      </span>
    </div>
  );
}
