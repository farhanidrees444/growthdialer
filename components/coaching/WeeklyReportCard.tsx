'use client';

import { Dumbbell, TrendingUp } from 'lucide-react';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';
import type { WeeklyReport } from './types';

export function WeeklyReportCard({ report }: { report: WeeklyReport | null }) {
  const { isDark } = useSiteTheme();
  const cardClass = cn(
    'rounded-2xl border p-5 backdrop-blur',
    isDark
      ? 'border-white/10 bg-black/40'
      : 'border-zinc-950/[0.07] bg-white shadow-[0_8px_30px_rgba(9,9,11,0.06)]',
  );
  if (!report) {
    return (
      <div className={cardClass}>
        <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-zinc-900')}>Weekly report pending</p>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-zinc-500')}>Reports appear after scored calls are available for the week.</p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Weekly coaching report</p>
          <p className="text-xs text-slate-500">{report.week_start} to {report.week_end}</p>
        </div>
        <TrendingUp className="h-5 w-5 text-[#06B6D4]" />
      </div>

      {report.summary && <p className="mb-4 text-sm leading-6 text-slate-300">{report.summary}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/10 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-200">Strengths</p>
          <ul className="space-y-1 text-sm text-slate-200">
            {report.strengths.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-200">Improvements</p>
          <ul className="space-y-1 text-sm text-slate-200">
            {report.improvements.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/10 p-3">
        <div className="mb-1 flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-[#06B6D4]" />
          <p className="text-sm font-semibold text-white">{report.drill.title ?? 'Practice drill'}</p>
        </div>
        <p className="text-sm text-slate-300">{report.drill.instructions ?? 'Review your lowest rubric area and practice the suggested script.'}</p>
        {report.drill.script && <p className="mt-2 text-xs text-cyan-100">{report.drill.script}</p>}
      </div>
    </div>
  );
}
