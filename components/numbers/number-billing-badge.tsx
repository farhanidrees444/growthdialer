'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarClock, Loader2, RefreshCw } from 'lucide-react';
import { useBillingCountdown } from '@/hooks/use-billing-countdown';
import type { NumberBillingFields } from '@/lib/numbers/billing-lifecycle';
import { cn } from '@/lib/utils';

export function NumberBillingBadge({
  num,
  onExtend,
  compact = false,
}: {
  num: NumberBillingFields & { id?: string };
  onExtend?: () => Promise<void>;
  compact?: boolean;
}) {
  const billing = useBillingCountdown(num);
  const [extending, setExtending] = useState(false);

  async function handleExtend() {
    if (!onExtend) return;
    setExtending(true);
    try {
      await onExtend();
    } finally {
      setExtending(false);
    }
  }

  if (billing.subscribed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        Subscription active
      </span>
    );
  }

  if (!num.next_billing_date) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', compact && 'gap-1.5')}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold tabular-nums',
          billing.expired
            ? 'border-red-500/30 bg-red-500/10 text-red-300'
            : billing.expiringSoon
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-violet-500/20 bg-violet-500/10 text-violet-200',
        )}
      >
        {billing.expired ? (
          <AlertTriangle className="h-3 w-3 shrink-0" />
        ) : (
          <CalendarClock className="h-3 w-3 shrink-0 opacity-80" />
        )}
        {billing.label}
      </span>
      {onExtend && (billing.expired || billing.expiringSoon) && (
        <button
          type="button"
          disabled={extending}
          onClick={() => void handleExtend()}
          className="inline-flex items-center gap-1 rounded-md border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-200 transition hover:bg-violet-500/25 disabled:opacity-50"
        >
          {extending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Extend 30 days
        </button>
      )}
    </div>
  );
}
