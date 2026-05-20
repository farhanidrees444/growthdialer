'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Clock, Lock } from 'lucide-react';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface AiBrief {
  bestTime: { text: string; confidence: number; basis: string };
  talkingPoints: string[];
  memories: { date: string; snippet: string }[];
  generatedAt: string;
}

interface AiBriefPanelProps {
  lead: LeadRecord;
}

function ConfidenceDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < value ? 'bg-cyan-400' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-white/[0.06] rounded animate-pulse ${className}`} />
  );
}

export function AiBriefPanel({ lead }: AiBriefPanelProps) {
  const [brief, setBrief] = useState<AiBrief | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dialer/lead-context/${lead.id}`);
      if (res.ok) {
        const data = await res.json() as { brief: AiBrief };
        setBrief(data.brief);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [lead.id]);

  useEffect(() => { load(); }, [load]);

  const ago = brief
    ? (() => {
        const diff = Date.now() - new Date(brief.generatedAt).getTime();
        const s = Math.floor(diff / 1000);
        return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
      })()
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">AI Brief</span>
          {ago && <span className="text-[11px] text-white/30">Generated {ago}</span>}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors disabled:opacity-30"
          aria-label="Regenerate AI brief"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-hide">
        {/* Best Time to Call */}
        <section>
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Best Time to Call</div>
          {loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : brief ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="text-sm text-white">{brief.bestTime.text}</span>
              </div>
              <ConfidenceDots value={brief.bestTime.confidence} />
              <p className="text-xs text-white/40">{brief.bestTime.basis}</p>
            </motion.div>
          ) : (
            <p className="text-xs text-white/30">Unable to generate</p>
          )}
        </section>

        {/* Talking Points */}
        <section>
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Talking Points</div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : brief?.talkingPoints && brief.talkingPoints.length > 0 ? (
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {brief.talkingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </motion.ul>
          ) : (
            <p className="text-xs text-white/30">No talking points available</p>
          )}
        </section>

        {/* What AI Remembers */}
        <section>
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">What AI Remembers</div>
          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : brief?.memories && brief.memories.length > 0 ? (
            <div className="space-y-2">
              {brief.memories.map((m, i) => (
                <div key={i} className="text-xs text-white/60 border-l-2 border-white/10 pl-2">
                  <div className="text-white/30 text-[10px] mb-0.5">{m.date}</div>
                  {m.snippet}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">No memories yet — AI learns from each call</p>
          )}
        </section>

        {/* Live AI Coach — locked */}
        <section className="relative">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Live AI Coach</div>
          <div className="opacity-40 pointer-events-none">
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Sentiment</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-1.5 rounded-full bg-white/10" />)}
                </div>
              </div>
              <div className="h-3 rounded bg-white/10 w-2/3" />
              <div className="h-3 rounded bg-white/10 w-1/2" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-white/10 rounded-full">
              <Lock className="w-3 h-3 text-white/40" />
              <span className="text-[10px] text-white/50">Activates in v2</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
