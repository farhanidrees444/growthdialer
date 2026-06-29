'use client';

import Link from 'next/link';
import { LockKeyhole, ArrowRight } from 'lucide-react';
import { PLAN_LABELS, requiredPlanForFeature, type FeatureKey } from './plan-gates';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature: FeatureKey;
  title?: string;
  description?: string;
  className?: string;
}

export function UpgradePrompt({
  feature,
  title = 'Upgrade to unlock this',
  description,
  className,
}: UpgradePromptProps) {
  const requiredPlan = requiredPlanForFeature(feature);

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.10] bg-white/[0.045] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-black/30 text-white/55">
          <LockKeyhole className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            {description ?? `${PLAN_LABELS[requiredPlan]} includes this feature.`}
          </p>
          <Link
            href={`/pricing?highlight=${requiredPlan}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-violet-400/25 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/25"
          >
            Upgrade
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
