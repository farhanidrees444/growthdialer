'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { usePlan } from '@/lib/plan/use-plan';

const DISMISS_KEY = 'trial_banner_dismissed';

export function TrialBanner() {
  const { isTrialing, trialEndsAt } = usePlan();
  const [now] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
    });
  }, []);

  const daysRemaining = useMemo(() => {
    if (!trialEndsAt) return null;
    const ms = new Date(trialEndsAt).getTime() - now;
    if (!Number.isFinite(ms)) return null;
    return Math.max(0, Math.ceil(ms / 86_400_000));
  }, [now, trialEndsAt]);

  if (!isTrialing || dismissed || daysRemaining === null) return null;

  return (
    <div className="relative z-20 flex h-9 shrink-0 items-center justify-center border-b border-violet-400/20 bg-violet-500/12 px-4 text-xs text-violet-100 backdrop-blur-xl">
      <p className="truncate">
        {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left in your trial.
        <Link href="/pricing" className="ml-2 font-semibold text-white underline-offset-2 hover:underline">
          Upgrade
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, 'true');
          setDismissed(true);
        }}
        className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/45 hover:bg-white/[0.06] hover:text-white"
        aria-label="Dismiss trial banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
