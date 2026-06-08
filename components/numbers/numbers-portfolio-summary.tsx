'use client';

import { Activity, AlertTriangle, DollarSign, Phone, Shield } from 'lucide-react';
import { formatHealthPercent, healthScoreColor } from '@/lib/numbers/health';
import { SurfaceCard } from '@/components/ui/surface-card';
import { cn } from '@/lib/utils';

export function NumbersPortfolioSummary({
  count,
  monthlyCost,
  avgHealth,
  scoredCount,
  needsCheck,
  atRisk,
  expiring,
}: {
  count: number;
  monthlyCost: number;
  avgHealth: number | null;
  scoredCount: number;
  needsCheck: number;
  atRisk: number;
  expiring: number;
}) {
  const tiles = [
    {
      label: 'Active numbers',
      value: String(count),
      sub: 'Caller IDs in rotation',
      icon: Phone,
      accent: 'text-violet-400',
    },
    {
      label: 'Monthly cost',
      value: `$${monthlyCost.toFixed(2)}`,
      sub: 'All active lines',
      icon: DollarSign,
      accent: 'text-cyan-400',
    },
    {
      label: 'Portfolio health',
      value: formatHealthPercent(avgHealth),
      sub: scoredCount < count ? `${scoredCount}/${count} scored` : '30-day composite',
      icon: Activity,
      accent: healthScoreColor(avgHealth),
    },
    {
      label: 'Needs attention',
      value: String(needsCheck + atRisk + expiring),
      sub: [
        needsCheck > 0 ? `${needsCheck} unchecked` : null,
        atRisk > 0 ? `${atRisk} at risk` : null,
        expiring > 0 ? `${expiring} expiring` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'All clear',
      icon: needsCheck + atRisk + expiring > 0 ? AlertTriangle : Shield,
      accent: needsCheck + atRisk + expiring > 0 ? 'text-amber-400' : 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <SurfaceCard key={tile.label} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{tile.label}</p>
              <p className={cn('mt-1 text-2xl font-bold tabular-nums text-white', tile.accent)}>{tile.value}</p>
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">{tile.sub}</p>
            </div>
            <tile.icon className={cn('h-4 w-4 shrink-0 opacity-70', tile.accent)} />
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}
