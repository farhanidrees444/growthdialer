'use client';

import { DollarSign, Phone, Shield, ShieldCheck, Sparkles } from 'lucide-react';
import { formatHealthPercent, healthScoreColor } from '@/lib/numbers/health';
import { SurfaceCard } from '@/components/ui/surface-card';
import { cn } from '@/lib/utils';

export function NumbersPortfolioSummary({
  count,
  monthlyCost,
  avgHealth,
  verified,
  needsCheck,
  flagged,
  expiring,
}: {
  count: number;
  monthlyCost: number;
  avgHealth: number | null;
  verified: number;
  needsCheck: number;
  flagged: number;
  expiring: number;
}) {
  const allClear = flagged === 0 && expiring === 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SurfaceCard className="p-5" glow>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Lines</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-white">{count}</p>
            <p className="mt-1.5 text-xs text-slate-500">Caller IDs ready to dial</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Phone className="h-5 w-5" />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Monthly</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-white">${monthlyCost.toFixed(2)}</p>
            <p className="mt-1.5 text-xs text-slate-500">All active subscriptions</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard variant={verified > 0 ? 'live' : 'default'} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Deliverability</p>
            <p className={cn('mt-2 font-display text-3xl font-bold tabular-nums', healthScoreColor(avgHealth))}>
              {verified === 0 ? 'Protected' : formatHealthPercent(avgHealth)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {verified === 0
                ? 'Auto-monitoring enabled'
                : `${verified} line${verified === 1 ? '' : 's'} verified`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard variant={allClear ? 'success' : flagged > 0 ? 'amber' : 'default'} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</p>
            <p className={cn(
              'mt-2 font-display text-3xl font-bold',
              allClear ? 'text-emerald-400' : flagged > 0 ? 'text-amber-400' : 'text-white',
            )}>
              {allClear ? 'Clear' : flagged}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {allClear
                ? 'No flagged lines'
                : `${flagged} flagged · ${needsCheck > 0 ? `${needsCheck} to verify` : 'verified'}`}
              {expiring > 0 ? ` · ${expiring} expiring` : ''}
            </p>
          </div>
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            allClear ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400',
          )}>
            {allClear ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
