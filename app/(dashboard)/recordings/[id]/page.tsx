'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Download, Sparkles,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Target, ChevronRight, Brain, Search, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { PostCallCommandCenter } from '@/components/calls/post-call-command-center';
import { RecordingDetailHero } from '@/components/recordings/recording-detail-hero';
import { isPlayableRecordingDuration } from '@/lib/recordings/eligibility';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordTimestamp { word: string; start: number; end: number }

interface CallAnalytics {
  id: string;
  transcript: string | null;
  summary: unknown;
  sentiment: string | null;
  sentiment_score: number | null;
  talking_points: string[] | null;
  objections: string[] | null;
  buying_signals: string[] | null;
  next_steps: string | null;
  suggested_disposition: string | null;
  ai_model_used: string | null;
  processing_time_ms: number | null;
  error: string | null;
}

interface CallDetail {
  id: string;
  recording_url: string | null;
  duration_seconds: number | null;
  recording_duration_seconds: number | null;
  created_at: string;
  disposition: string | null;
  notes: string | null;
  transcript: string | null;
  ai_processing_status: string | null;
  ai_error: string | null;
  analytics_id: string | null;
  leads: { id: string; name: string | null; company: string | null; phone: string | null } | null;
}

interface LeadMemory {
  id: string;
  memory_type: string;
  content: string;
  importance_score: number;
  created_at: string;
}

type Tab = 'insights' | 'transcript' | 'memory';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtTimestamp(secs: number) {
  return `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
}

function getSummaryBullets(summary: unknown): string[] {
  if (!summary) return [];
  if (Array.isArray(summary)) return summary as string[];
  if (typeof summary === 'object' && summary !== null && 'bullets' in summary) {
    const b = (summary as { bullets: unknown }).bullets;
    if (Array.isArray(b)) return b as string[];
  }
  return [];
}

function getWords(summary: unknown): WordTimestamp[] {
  if (!summary || typeof summary !== 'object') return [];
  const s = summary as { words?: unknown };
  if (Array.isArray(s.words)) return s.words as WordTimestamp[];
  return [];
}

function memoryTypeColor(type: string) {
  switch (type) {
    case 'objection': return 'border-red-500/20 bg-red-500/[0.06] text-red-400';
    case 'interest': return 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400';
    case 'preference': return 'border-violet-500/20 bg-violet-500/[0.06] text-violet-400';
    default: return 'border-blue-500/20 bg-blue-500/[0.06] text-blue-400';
  }
}

function sentimentColor(score: number | null) {
  if (score === null) return 'text-slate-500';
  if (score > 0.2) return 'text-emerald-400';
  if (score < -0.2) return 'text-red-400';
  return 'text-amber-400';
}

// ─── Audio player ─────────────────────────────────────────────────────────────

function AudioPlayer({
  url,
  duration,
  onTimeUpdate,
  seekTo,
}: {
  url: string;
  duration: number | null;
  onTimeUpdate?: (t: number) => void;
  seekTo?: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekTo;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }, [seekTo]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { await el.play().catch(() => {}); setPlaying(true); }
  };

  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-4 sm:gap-4 sm:px-5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={() => { if (audioRef.current) setTotal(audioRef.current.duration); }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrent(audioRef.current.currentTime);
            onTimeUpdate?.(audioRef.current.currentTime);
          }
        }}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />
      <button type="button" onClick={toggle}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400 transition hover:bg-emerald-500/15"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
      </button>

      {/* Waveform bar visualization */}
      <div className="flex h-8 min-w-0 flex-1 cursor-pointer items-end gap-px"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct2 = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) { audioRef.current.currentTime = pct2 * (audioRef.current.duration || 0); }
        }}
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const barPct = (i / 60) * 100;
          const active = barPct <= pct;
          const height = 20 + Math.sin(i * 0.6) * 12 + Math.sin(i * 1.3) * 8;
          return (
            <div key={i} style={{ height: `${height}px` }}
              className={`flex-1 rounded-sm transition-colors ${active ? 'bg-emerald-500' : 'bg-white/[0.08]'}`}
            />
          );
        })}
      </div>

      <div className="shrink-0 text-xs text-slate-500 tabular-nums">
        {fmtTimestamp(current)} / {fmtTimestamp(total)}
      </div>

      <a href={url} download target="_blank" rel="noreferrer"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"
        title="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ─── Tab: AI Insights ─────────────────────────────────────────────────────────

function InsightsTab({ analytics }: { analytics: CallAnalytics }) {
  const bullets = getSummaryBullets(analytics.summary);
  const score = analytics.sentiment_score;
  const absScore = Math.abs(score ?? 0);

  if (analytics.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500/60" />
        <p className="text-sm font-semibold text-slate-400">AI analysis failed</p>
        <p className="text-xs text-slate-600 max-w-xs">{analytics.error}</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-4" initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Summary */}
      {bullets.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">Summary</span>
          </div>
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/60" />
                <span className="text-sm text-slate-300 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Sentiment */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sentiment</span>
          <span className={`text-sm font-bold capitalize ${sentimentColor(score)}`}>
            {score !== null && score > 0.2 && <TrendingUp className="inline h-3.5 w-3.5 mr-1" />}
            {score !== null && score < -0.2 && <TrendingDown className="inline h-3.5 w-3.5 mr-1" />}
            {score !== null && Math.abs(score) <= 0.2 && <Minus className="inline h-3.5 w-3.5 mr-1" />}
            {analytics.sentiment ?? '—'}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score !== null && score > 0 ? 'bg-emerald-500' : score !== null && score < 0 ? 'bg-red-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.round(absScore * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-700">
          <span>Negative</span><span>Neutral</span><span>Positive</span>
        </div>
      </motion.div>

      {/* Next Steps */}
      {analytics.next_steps && (
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Next Steps</span>
          </div>
          <p className="text-sm text-emerald-300 leading-relaxed">{analytics.next_steps}</p>
          {analytics.suggested_disposition && (
            <p className="mt-2 text-[11px] text-emerald-600">
              Suggested: <span className="font-semibold capitalize">{analytics.suggested_disposition.replace(/_/g, ' ')}</span>
            </p>
          )}
        </motion.div>
      )}

      {/* Objections + Buying Signals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(analytics.objections ?? []).length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/80">Objections</span>
            </div>
            <ul className="space-y-1.5">
              {analytics.objections!.map((o) => (
                <li key={o} className="flex items-start gap-1.5 text-xs text-red-300/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/50" />
                  {o}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {(analytics.buying_signals ?? []).length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Buying Signals</span>
            </div>
            <ul className="space-y-1.5">
              {analytics.buying_signals!.map((s) => (
                <li key={s} className="flex items-start gap-1.5 text-xs text-emerald-300/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/50" />
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Talking Points */}
      {(analytics.talking_points ?? []).length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Topics Discussed</span>
          <div className="flex flex-wrap gap-2">
            {analytics.talking_points!.map((pt) => (
              <span key={pt} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-slate-400">{pt}</span>
            ))}
          </div>
        </motion.div>
      )}

      <p className="text-[10px] text-slate-700 text-center">
        Analyzed by {analytics.ai_model_used ?? 'AI'}{analytics.processing_time_ms ? ` in ${(analytics.processing_time_ms / 1000).toFixed(1)}s` : ''}
      </p>
    </motion.div>
  );
}

// ─── Tab: Transcript ──────────────────────────────────────────────────────────

function TranscriptTab({
  analytics,
  onSeek,
}: {
  analytics: CallAnalytics;
  onSeek: (t: number) => void;
}) {
  const [query, setQuery] = useState('');
  const words = getWords(analytics.summary);
  const transcript = analytics.transcript ?? '';

  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-slate-500">No transcript available for this call.</p>
      </div>
    );
  }

  // Group words into sentences (split on periods/question marks)
  const segments = words.length > 0
    ? buildSegments(words)
    : [{ text: transcript, start: null }];

  const filtered = query
    ? segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
    : segments;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript…"
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-8 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {filtered.map((seg, i) => (
          <div key={i} className="flex items-start gap-3">
            {seg.start !== null && (
              <button type="button" onClick={() => onSeek(seg.start!)}
                className="shrink-0 mt-0.5 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/[0.08] transition"
              >
                {fmtTimestamp(seg.start)}
              </button>
            )}
            <p className={`text-sm leading-relaxed ${query && seg.text.toLowerCase().includes(query.toLowerCase()) ? 'text-white' : 'text-slate-400'}`}>
              {highlightText(seg.text, query)}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-600 py-8">No matches for "{query}"</p>
        )}
      </div>
    </div>
  );
}

function buildSegments(words: WordTimestamp[]): Array<{ text: string; start: number | null }> {
  const segments: Array<{ text: string; start: number | null }> = [];
  let current: string[] = [];
  let startTime: number | null = null;

  for (const w of words) {
    if (startTime === null) startTime = w.start;
    current.push(w.word);
    const text = current.join(' ');
    if (text.endsWith('.') || text.endsWith('?') || text.endsWith('!') || current.length >= 20) {
      segments.push({ text: text.trim(), start: startTime });
      current = [];
      startTime = null;
    }
  }
  if (current.length > 0) segments.push({ text: current.join(' '), start: startTime });
  return segments;
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5">{part}</mark>
      : part
  );
}

// ─── Tab: Memory ──────────────────────────────────────────────────────────────

function MemoryTab({ memories, leadName }: { memories: LeadMemory[]; leadName: string | null }) {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Brain className="h-8 w-8 text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">No memories were saved from this call.</p>
        <p className="mt-1 text-xs text-slate-600">AI extracts facts, preferences and objections automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 px-1">
        AI now remembers these facts about{' '}
        <span className="font-semibold text-slate-300">{leadName ?? 'this lead'}</span>:
      </p>
      {memories.map((m) => (
        <div key={m.id} className={`rounded-2xl border px-4 py-3.5 ${memoryTypeColor(m.memory_type)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 capitalize">{m.memory_type}</span>
            <span className="text-[10px] text-slate-600">
              {Math.round(m.importance_score * 100)}% importance
            </span>
          </div>
          <p className="text-sm leading-relaxed">{m.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiFetch } = useWorkspace();
  const id = params?.id as string;

  const [call, setCall] = useState<CallDetail | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [memories, setMemories] = useState<LeadMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('insights');
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      try {
        const { data: callData } = await supabase
          .from('calls')
          .select('id, recording_url, duration_seconds, recording_duration_seconds, created_at, disposition, notes, transcript, ai_processing_status, ai_error, analytics_id, leads(id, name, company, phone)')
          .eq('id', id)
          .single();

        if (!callData) { setLoading(false); return; }
        const duration = callData.recording_duration_seconds ?? callData.duration_seconds;
        if (!callData.recording_url || !isPlayableRecordingDuration(duration)) {
          setLoading(false);
          return;
        }
        setCall(callData as unknown as CallDetail);

        if (callData.recording_url) {
          const playbackRes = await apiFetch(`/api/recordings/${id}/playback`);
          if (playbackRes.ok) {
            const playback = await playbackRes.json() as { playback_url?: string };
            if (playback.playback_url) setPlaybackUrl(playback.playback_url);
          } else {
            setPlaybackUrl(callData.recording_url);
          }
        }

        if (callData.analytics_id) {
          const { data: analyticsData } = await supabase
            .from('call_analytics')
            .select('id, transcript, summary, sentiment, sentiment_score, talking_points, objections, buying_signals, next_steps, suggested_disposition, ai_model_used, processing_time_ms, error')
            .eq('id', callData.analytics_id)
            .single();

          if (analyticsData) setAnalytics(analyticsData as CallAnalytics);
        }

        const lead = Array.isArray(callData.leads) ? callData.leads[0] : callData.leads;
        if (lead?.id) {
          const { data: memData } = await supabase
            .from('lead_memory')
            .select('id, memory_type, content, importance_score, created_at')
            .eq('lead_id', lead.id)
            .eq('source_call_id', id)
            .order('importance_score', { ascending: false });

          setMemories((memData ?? []) as LeadMemory[]);
        }
      } catch (err) {
        console.error('Recording detail load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, apiFetch]);

  if (loading) {
    return (
      <div className="flex-1 px-4 py-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-500">Recording not found.</p>
          <button type="button" onClick={() => router.push('/recordings')} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300">
            ← Back to Recordings
          </button>
        </div>
      </div>
    );
  }

  const lead = Array.isArray(call.leads) ? call.leads[0] : call.leads;

  const saveCallNotes = async (notes: string) => {
    const res = await apiFetch(`/api/calls/${call.id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save call notes');
    setCall((prev) => prev ? { ...prev, notes } : prev);
  };

  const saveCallDisposition = async (
    disposition: string,
    notes: string,
    dates?: { callbackAt?: string; meetingAt?: string },
  ) => {
    const res = await apiFetch(`/api/calls/${call.id}/disposition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disposition,
        notes,
        callback_at: dates?.callbackAt,
        meeting_at: dates?.meetingAt,
      }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save disposition');
    setCall((prev) => prev ? { ...prev, disposition, notes } : prev);
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'insights', label: 'AI Insights' },
    { key: 'transcript', label: 'Transcript' },
    { key: 'memory', label: 'Memory', count: memories.length },
  ];

  return (
    <div data-page-scroll className="flex-1 overflow-y-auto px-3 py-4 lg:px-8 lg:py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <RecordingDetailHero
          leadName={lead?.name ?? 'Unknown Caller'}
          company={lead?.company ?? null}
          phone={lead?.phone ?? null}
          duration={formatDuration(call.recording_duration_seconds ?? call.duration_seconds)}
          date={formatDate(call.created_at)}
          disposition={call.disposition}
          hasAi={Boolean(analytics && !analytics.error)}
          onBack={() => router.push('/recordings')}
        />

        {/* Audio player */}
        {(playbackUrl ?? call.recording_url) && (
          <AudioPlayer
            url={playbackUrl ?? call.recording_url!}
            duration={call.recording_duration_seconds ?? call.duration_seconds}
            onTimeUpdate={setCurrentTime}
            seekTo={seekTo}
          />
        )}

        <PostCallCommandCenter
          call={{
            id: call.id,
            leadName: lead?.name ?? 'Unknown Caller',
            company: lead?.company ?? null,
            phone: lead?.phone ?? null,
            durationSeconds: call.recording_duration_seconds ?? call.duration_seconds,
            disposition: call.disposition,
            notes: call.notes,
            recordingUrl: playbackUrl ?? call.recording_url,
            transcript: analytics?.transcript ?? call.transcript,
            aiProcessingStatus: call.ai_processing_status,
            aiError: call.ai_error,
            analytics,
          }}
          recordingHref={`/recordings/${call.id}`}
          onOpenTranscript={() => setTab('transcript')}
          onSaveNotes={saveCallNotes}
          onSaveDisposition={saveCallDisposition}
        />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.07]">
          {TABS.map(({ key, label, count }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-1.5 ${
                tab === key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'insights' && analytics && !analytics.error && (
              <InsightsTab analytics={analytics} />
            )}
            {tab === 'insights' && !analytics && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-8 w-8 text-slate-600 mb-3" />
                <p className="text-sm text-slate-500">AI analysis not yet available.</p>
                <p className="mt-1 text-xs text-slate-600">Processing starts automatically after recording is saved.</p>
              </div>
            )}
            {tab === 'insights' && analytics?.error && (
              <InsightsTab analytics={analytics} />
            )}
            {tab === 'transcript' && analytics && (
              <TranscriptTab analytics={analytics} onSeek={(t) => setSeekTo(t)} />
            )}
            {tab === 'transcript' && !analytics && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-slate-500">Transcript not available yet.</p>
              </div>
            )}
            {tab === 'memory' && (
              <MemoryTab memories={memories} leadName={lead?.name ?? null} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
