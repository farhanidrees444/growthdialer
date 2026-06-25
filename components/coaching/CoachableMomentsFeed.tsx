'use client';

import { Lightbulb, Quote } from 'lucide-react';
import type { CoachingMoment } from './types';

export function CoachableMomentsFeed({ moments }: { moments: CoachingMoment[] }) {
  if (!moments.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-slate-400 backdrop-blur">
        No coachable moments yet. Score a call to generate targeted coaching prompts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {moments.map((moment, index) => (
        <div key={`${moment.title ?? 'moment'}-${index}`} className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
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
