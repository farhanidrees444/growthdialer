'use client';

import { Lock } from 'lucide-react';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface LiveInsightsPanelProps {
  lead: LeadRecord;
}

export function LiveInsightsPanel({ lead }: LiveInsightsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-medium text-white">Live Insights</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-hide">
        {/* Live AI Coach — locked */}
        <section className="relative">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-2">
            Live AI Coach
            <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded px-1.5 py-px">Coming v2</span>
          </div>
          <div className="opacity-30 pointer-events-none space-y-2">
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] space-y-2">
              <div className="text-xs text-white/50 mb-2">Sentiment</div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-green-500/30" />
              </div>
              <div className="text-xs text-white/40 mt-1">Suggested response:</div>
              <div className="h-3 rounded bg-white/10 w-full" />
              <div className="h-3 rounded bg-white/10 w-3/4" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-white/10 rounded-full">
              <Lock className="w-3 h-3 text-white/40" />
              <span className="text-[10px] text-white/50">Activates during live calls in v2</span>
            </div>
          </div>
        </section>

        {/* Lead context */}
        <section>
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Lead Context</div>
          <div className="space-y-2">
            {lead.company && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-white/30 w-16 flex-shrink-0">Company</span>
                <span className="text-white/70">{lead.company}</span>
              </div>
            )}
            {lead.title && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-white/30 w-16 flex-shrink-0">Title</span>
                <span className="text-white/70">{lead.title}</span>
              </div>
            )}
            {lead.industry && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-white/30 w-16 flex-shrink-0">Industry</span>
                <span className="text-white/70">{lead.industry}</span>
              </div>
            )}
            {lead.call_attempts !== undefined && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-white/30 w-16 flex-shrink-0">Attempts</span>
                <span className="text-white/70">{lead.call_attempts}</span>
              </div>
            )}
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-white/30 w-16 flex-shrink-0">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-white/[0.06] rounded text-white/60">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {lead.notes && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-white/30 w-16 flex-shrink-0">Notes</span>
                <span className="text-white/70 line-clamp-3">{lead.notes}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
