'use client';

import { Phone, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  step_order: number;
  step_type: 'call' | 'wait';
  wait_days: number;
}

export function SequenceTimeline({ steps }: { steps: Step[] }) {
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {sorted.map((step, i) => (
        <div key={step.step_order} className="flex items-center gap-1">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium',
              step.step_type === 'call'
                ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-200',
            )}
          >
            {step.step_type === 'call' ? (
              <>
                <Phone className="h-3.5 w-3.5" />
                Call
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5" />
                Wait {step.wait_days}d
              </>
            )}
          </span>
          {i < sorted.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
