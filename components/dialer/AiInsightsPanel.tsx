'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, MessageSquare, Target, Phone, Clock, CheckCircle2, PhoneMissed, Brain, ShieldAlert, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { LeadRecord } from '@/components/dialer/LeadCard';

interface CallAnalyticsRow {
  sentiment: string | null;
  sentiment_score: number | null;
  summary: unknown;
  objections: string[] | null;
  suggested_disposition: string | null;
}

interface CallRow {
  id: string;
  created_at: string;
  status: string;
  disposition: string | null;
  answered_at: string | null;
  ended_at: string | null;
  analytics: CallAnalyticsRow[] | null;
}

interface LeadMemory {
  id: string;
  memory_type: string;
  content: string;
  importance_score: number;
  created_at: string;
}

interface AiInsightsPanelProps {
  lead: LeadRecord | null;
  notes: string;
  refreshKey?: number;
}

function callDuration(answered_at: string | null, ended_at: string | null): string {
  if (!answered_at || !ended_at) return '—';
  const s = Math.round((new Date(ended_at).getTime() - new Date(answered_at).getTime()) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function dispositionIcon(disp: string | null) {
  if (!disp || disp === 'no_answer') return <PhoneMissed className="h-3.5 w-3.5 text-slate-500" />;
  if (disp === 'meeting_booked' || disp === 'interested') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  return <Phone className="h-3.5 w-3.5 text-slate-500" />;
}

function memoryTypeDot(type: string): string {
  switch (type) {
    case 'objection': return 'bg-red-400/60';
    case 'interest': return 'bg-emerald-400/60';
    case 'preference': return 'bg-violet-400/60';
    default: return 'bg-blue-400/60';
  }
}

function memoryTypeColor(type: string): string {
  switch (type) {
    case 'objection': return 'text-red-400';
    case 'interest': return 'text-emerald-400';
    case 'preference': return 'text-violet-400';
    default: return 'text-blue-400';
  }
}

const BEST_TIMES: Record<string, string> = {
  'SaaS': ', 'Tue–Thu · 10–11 AM',
  'Finance': ', 'Wed · 9–10 AM',
  'Healthcare': ', 'Mon–Wed · 2–4 PM',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const fadeUpTransition = { duration: 0.28, ease: 'easeOut' as const };

export default function AiInsightsPanel({ lead, notes, refreshKey = 0 }: AiInsightsPanelProps) {
  const [supabase] = useState(() => createClient());
  const [callHistory, setCallHistory] = useState<CallRow[]>([]);
  const [memories, setMemories] = useState<LeadMemory[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  useEffect(() => {
    if (!lead) { setCallHistory([]); return; }
    supabase
      .from('calls')
      .select(`
        id, created_at, status, disposition, answered_at, ended_at,
        analytics:call_analytics(sentiment, sentiment_score, summary, objections, suggested_disposition)
      `)
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setCallHistory(data as CallRow[]); });
  }, [lead?.id, refreshKey, supabase]);

  useEffect(() => {
    if (!lead) { setMemories([]); return; }
    setMemoriesLoading(true);
    supabase
      .from('lead_memory')
      .select('id, memory_type, content, importance_score, created_at')
      .eq('lead_id', lead.id)
      .order('importance_score', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setMemories((data ?? []) as LeadMemory[]);
        setMemoriesLoading(false);
      });
  }, [lead?.id, refreshKey, supabase]);

  const bestTime = lead?.industry ? (BEST_TIMES[lead.industry] ?? 'Tue–Thu · 10–11 AM') : ', 'Tue–Thu · 10–11 AM';

  // Derive real AI data from call history
  const latestWithAI = callHistory.find((c) => {
    const ai = Array.isArray(c.analytics) ? c.analytics[0] : null;
    return ai?.summary != null;
  });
  const latestAI = latestWithAI ? (Array.isArray(latestWithAI.analytics) ? latestWithAI.analytics[0] : null) : null;

  const aiSummaryBullets: string[] = (() => {
    if (!latestAI?.summary) return [];
    if (Array.isArray(latestAI.summary)) return latestAI.summary.slice(0, 2);
    if (typeof latestAI.summary === 'object' && latestAI.summary !== null && 'bullets' in latestAI.summary) {
      const b = (latestAI.summary as { bullets: unknown }).bullets;
      if (Array.isArray(b)) return b.slice(0, 2);
    }
    return [];
  })();

  const allObjections: string[] = callHistory.flatMap((c) => {
    const ai = Array.isArray(c.analytics) ? c.analytics[0] : null;
    return ai?.objections ?? [];
  }).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4);

  const sentimentHistory = callHistory
    .map((c) => {
      const ai = Array.isArray(c.analytics) ? c.analytics[0] : null;
      return ai?.sentiment ?? null;
    })
    .filter(Boolean)
    .slice(0, 5) as string[];

  const interestMemories = memories.filter((m) => m.memory_type === 'interest');
  const talkingPoints = interestMemories.length > 0
    ? interestMemories.map((m) => m.content)
    : [
        'Ask about their current solution pain points',
        'Mention recent growth in their industry',
        'Reference company size for right-fit framing',
      ];

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-slate-600" />
        <p className="text-sm font-semibold text-slate-500">AI Insights</p>
        <p className="mt-1 text-xs text-slate-600">Select a lead to see insights</p>
      </div>
    );
  }

  return (
    <motion.div key={lead.id} variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">AI Insights</span>
      </div>

      {/* Best Time to Call */}
      <motion.div variants={fadeUp} transition={fadeUpTransition}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Best Time to Call</span>
        </div>
        <p className="text-sm font-bold text-white">{bestTime}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">Based on industry patterns</p>
      </motion.div>

      {/* AI Memory */}
      <motion.div variants={fadeUp} transition={fadeUpTransition}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10">
              <Brain className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">What AI Remembers</span>
          </div>
          {memories.length > 0 && (
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-400">
              {memories.length} facts
            </span>
          )}
        </div>
        {memoriesLoading ? (
          <div className="space-y-1.5">
            {[1, 2].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-white/[0.04]" />)}
          </div>
        ) : memories.length > 0 ? (
          <ul className="space-y-2">
            {memories.slice(0, 3).map((mem) => (
              <li key={mem.id} className="flex items-start gap-2">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${memoryTypeDot(mem.memory_type)}`} />
                <span className={`text-xs leading-relaxed ${memoryTypeColor(mem.memory_type)}`}>{mem.content}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-600 italic">No memories yet — AI learns from each call automatically</p>
        )}
      </motion.div>

      {/* Last Note */}
      <motion.div variants={fadeUp} transition={fadeUpTransition}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10">
            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Last Note</span>
        </div>
        {notes ? (
          <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{notes}</p>
        ) : (
          <p className="text-xs text-slate-600 italic">No notes yet — add context after your call</p>
        )}
      </motion.div>

      {/* Last AI Summary */}
      {aiSummaryBullets.length > 0 && (
        <motion.div variants={fadeUp} transition={fadeUpTransition}
          className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/[0.04] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-500/15">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Last AI Summary</span>
          </div>
          <ul className="space-y-1.5">
            {aiSummaryBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400/50" />
                <span className="text-xs text-slate-300 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
          {sentimentHistory.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600">Sentiment:</span>
              {sentimentHistory.map((s, i) => {
                const Icon = s === 'positive' ? TrendingUp : s === 'negative' ? TrendingDown : Minus;
                const color = s === 'positive' ? 'text-emerald-400' : s === 'negative' ? 'text-red-400' : 'text-slate-500';
                return <Icon key={i} className={`h-3 w-3 ${color}`} />;
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Known Objections */}
      {allObjections.length > 0 && (
        <motion.div variants={fadeUp} transition={fadeUpTransition}
          className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Known Objections</span>
            <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-400">
              {allObjections.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {allObjections.map((obj) => (
              <li key={obj} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/50" />
                <span className="text-xs text-slate-400 leading-relaxed">{obj}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Talking Points */}
      <motion.div variants={fadeUp} transition={fadeUpTransition}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Talking Points</span>
          </div>
          {interestMemories.length > 0
            ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">From memory</span>
            : <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-400">AI Soon</span>
          }
        </div>
        <ul className="space-y-1.5">
          {talkingPoints.slice(0, 3).map((pt) => (
            <li key={pt} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/40" />
              <span className="text-xs text-slate-400">{pt}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Call History */}
      {callHistory.length > 0 && (
        <motion.div variants={fadeUp} transition={fadeUpTransition}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-500/10">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recent Calls</span>
          </div>
          <div className="space-y-2">
            {callHistory.map((call) => (
              <div key={call.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">{dispositionIcon(call.disposition)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold capitalize text-slate-300">
                    {call.disposition?.replace(/_/g ') ?? call.status}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <span>{formatDate(call.created_at)}</span>
                    {call.answered_at && <span>· {callDuration(call.answered_at, call.ended_at)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
