'use client';

import { Lightbulb, Quote } from 'lucide-react';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';
import type { CoachingMoment } from './types';

export function CoachableMomentsFeed({ moments }: { moments: CoachingMoment[] }) {
  const { isDark } = useSiteTheme();
  const panelClass = cn(
    'rounded-2xl border p-4 backdrop-blur',
    isDark
      ? 'border-white/10 bg-black/40'
      : 'border-zinc-950/[0.07] bg-white shadow-[0_4px_16px_rgba(9,9,11,0.05)]',
  );
  if (!moments.length) {
    return (
      <div className={cn(panelClass, 'p-5 text-sm', isDark ? 'text-slate-400' : 'text-zinc-500')}>
        No coachable moments yet. Score a call to generate targeted coaching prompts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {moments.map((moment, index) => (
        <div key={`${moment.title ?? 'moment'}-${index}`} className={panelClass}>
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#06B6D4]" />
            <p className="text-sm font-semibold text-white">{moment.title ?? 'Coachable moment'}</p>
            {moment.timestamp && <span className="ml-auto text-[10px] text-slate-500">{moment.timestamp}</span>}
          </div>
          {moment.detail && <p className="text-sm leading-6 text-slate-300">{moment.detail}</p>}
          {moment.suggested_script && (
            <div className="mt-3 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3 text-xs text-violet-100">
              <Quote className="mb-1 h-3.5 w-3.5 text-[#8B5CF6]" />
              {moment.suggested_script}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
