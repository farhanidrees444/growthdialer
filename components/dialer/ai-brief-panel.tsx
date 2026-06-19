'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Clock, Lock, Brain, MessageCircle, Orbit } from 'lucide-react';
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
        <motion.div
          key={i}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.045, type: 'spring', stiffness: 200, damping: 25 }}
          className={`h-1.5 w-6 rounded-full ${i < value ? 'bg-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.35)]' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-white/[0.04] ${className}`}>
      <motion.div
        aria-hidden
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.055] to-transparent"
        initial={{ x: '-120%' }}
        animate={{ x: '240%' }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }}
      />
    </div>
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
    <div className="relative flex h-full flex-col overflow-hidden bg-white/[0.02] backdrop-blur-xl">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.28),rgba(6,182,212,0.10)_42%,transparent_70%)]"
        animate={{ opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-violet-300/50" />
      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <motion.span
            className="flex h-7 w-7 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200"
            animate={{ boxShadow: ['0 0 0 rgba(139,92,246,0)', '0 0 24px rgba(139,92,246,0.22)', '0 0 0 rgba(139,92,246,0)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </motion.span>
          <span className="text-sm font-semibold tracking-[-0.01em] text-white">AI Brief</span>
          {ago && (
            <motion.span
              key={brief?.generatedAt}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 text-[10px] text-white/35"
            >
              Generated {ago}
            </motion.span>
          )}
        </div>
        <motion.button
          onClick={load}
          disabled={loading}
          whileTap={{ scale: 0.92 }}
          className="rounded-lg p-1.5 text-white/40 transition-all duration-200 hover:bg-white/[0.05] hover:text-cyan-200 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label="Regenerate AI brief"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-200' : ''}`} />
        </motion.button>
      </div>

      <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-hide">
        {/* Best Time to Call */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Best Time to Call</div>
          {loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : brief ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} className="space-y-2">
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
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Talking Points</div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : brief?.talkingPoints && brief.talkingPoints.length > 0 ? (
            <motion.ul initial="hidden" animate="show" className="space-y-2">
              {brief.talkingPoints.map((point, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0, transition: { delay: i * 0.07, type: 'spring', stiffness: 200, damping: 25 } },
                  }}
                  className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-white/[0.018] px-2.5 py-2 text-sm text-white/72"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    <MessageCircle className="h-3 w-3" />
                  </span>
                  <span>{point}</span>
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <p className="text-xs text-white/30">No talking points available</p>
          )}
        </section>

        {/* What AI Remembers */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">What AI Remembers</div>
          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : brief?.memories && brief.memories.length > 0 ? (
            <div className="space-y-2">
              {brief.memories.map((m, i) => (
                <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.018] p-2.5 text-xs text-white/60">
                  <div className="text-white/30 text-[10px] mb-0.5">{m.date}</div>
                  {m.snippet}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.018] p-4 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                <Brain className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-white/60">No memory yet</p>
              <p className="mt-1 text-xs text-white/32">AI learns preferences and objections from each conversation.</p>
            </div>
          )}
        </section>

        {/* Live AI Coach — locked */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Live AI Coach</div>
          <div className="pointer-events-none opacity-45">
            <div className="p-3 rounded-xl bg-white/[0.035] border border-white/[0.06] space-y-2">
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
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/35 backdrop-blur-[3px]">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1.5 shadow-[0_12px_38px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <Lock className="w-3 h-3" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">Activates in v2</span>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-3 text-xs text-white/35">
          <div className="flex items-center gap-2">
            <Orbit className="h-3.5 w-3.5 text-cyan-200/70" />
            <span>Brief updates are tuned for live outbound prep.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
