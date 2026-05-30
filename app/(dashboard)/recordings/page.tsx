'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Clock, Mic, Sparkles, FileText, Search, Phone,
  TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown,
  ChevronRight, Volume2, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecordingLead {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface Recording {
  id: string;
  recording_url: string;
  duration_seconds: number | null;
  transcript: string | null;
  started_at: string;
  disposition: string | null;
  was_recorded: boolean;
  ai_processing_status: string | null;
  analytics_id: string | null;
  from_number: string | null;
  to_number: string | null;
  leads: RecordingLead | null;
  // Enriched
  ai_sentiment: string | null;
  ai_sentiment_score: number | null;
  ai_summary_raw: unknown;
  ai_next_steps_raw: unknown;
  ai_keywords: string[] | null;
  ai_objections: string[] | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(s: number | null): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getLeadName(lead: RecordingLead | null, fallback: string | null): string {
  if (!lead) return fallback ?? 'Unknown';
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ');
  return name || fallback || 'Unknown';
}

function getSummaryBullets(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.slice(0, 3).map(String);
  if (typeof raw === 'object' && raw !== null) {
    const b = (raw as Record<string, unknown>).bullets;
    if (Array.isArray(b)) return b.slice(0, 3).map(String);
  }
  if (typeof raw === 'string' && raw.trim()) return [raw];
  return [];
}

function getNextSteps(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.slice(0, 4).map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 4).map(String);
    } catch { /* not JSON */ }
    return raw.trim() ? [raw.trim()] : [];
  }
  return [];
}

// ─── Sentiment ────────────────────────────────────────────────────────────────

const SENTIMENT = {
  positive: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Positive' },
  neutral:  { icon: Minus,      color: 'text-slate-400',   bg: 'bg-white/[0.04]',   border: 'border-white/[0.08]',    label: 'Neutral'  },
  negative: { icon: TrendingDown, color: 'text-red-400',   bg: 'bg-red-500/10',     border: 'border-red-500/20',      label: 'Negative' },
} as const;

type SentimentKey = keyof typeof SENTIMENT;

// ─── MiniPlayer ───────────────────────────────────────────────────────────────

function MiniPlayer({ url, id, activeId, onActivate }: {
  url: string; id: string;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const isPlaying = activeId === id;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.play().catch(() => { toast.error('Playback failed'); onActivate(null); });
    } else {
      el.pause();
    }
  }, [isPlaying, onActivate]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onActivate(isPlaying ? null : id);
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onEnded={() => { setProgress(0); onActivate(null); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el?.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all
                   border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-cyan-500/15
                   hover:from-violet-500/25 hover:to-cyan-500/25 active:scale-95"
      >
        {isPlaying
          ? <Pause className="h-4 w-4 text-cyan-400" />
          : <Play className="h-4 w-4 translate-x-0.5 text-violet-400" />}
      </button>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.07] sm:w-24">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
          style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Disposition badge ────────────────────────────────────────────────────────

const DISP_COLORS: Record<string, string> = {
  interested:    'bg-emerald-500/15 text-emerald-400',
  callback:      'bg-amber-500/15 text-amber-400',
  meeting_booked:'bg-violet-500/15 text-violet-400',
  not_interested:'bg-slate-500/15 text-slate-400',
  voicemail:     'bg-blue-500/15 text-blue-400',
  no_answer:     'bg-slate-500/10 text-slate-600',
  wrong_number:  'bg-red-500/15 text-red-400',
  dnc:           'bg-red-600/15 text-red-500',
};

function DispositionBadge({ disp }: { disp: string | null }) {
  if (!disp) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${DISP_COLORS[disp] ?? 'bg-white/[0.05] text-slate-500'}`}>
      {disp.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Recording Card ───────────────────────────────────────────────────────────

function RecordingCard({
  rec, activePlayId, onActivatePlay, onReprocess,
}: {
  rec: Recording;
  activePlayId: string | null;
  onActivatePlay: (id: string | null) => void;
  onReprocess: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const name = getLeadName(rec.leads, rec.to_number);
  const sentKey = (rec.ai_sentiment ?? '') as SentimentKey;
  const sent = SENTIMENT[sentKey];
  const summaryBullets = getSummaryBullets(rec.ai_summary_raw);
  const nextSteps = getNextSteps(rec.ai_next_steps_raw);
  const isProcessing = rec.ai_processing_status === 'processing';
  const hasAi = !!rec.analytics_id && !!sent;
  const needsAi = !rec.analytics_id && !isProcessing;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[oklch(0.086_0.024_282)] transition-all hover:border-white/[0.11]"
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 p-4">
        {/* Player */}
        <MiniPlayer
          url={rec.recording_url}
          id={rec.id}
          activeId={activePlayId}
          onActivate={onActivatePlay}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-white truncate">{name}</span>
            {rec.leads?.company && (
              <span className="text-xs text-slate-500 truncate">· {rec.leads.company}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{fmtDuration(rec.duration_seconds)}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{fmtDate(rec.started_at)}</span>
            <DispositionBadge disp={rec.disposition} />
          </div>
        </div>

        {/* Right side — sentiment + expand */}
        <div className="flex shrink-0 items-center gap-2">
          {sent && (
            <span className={`hidden sm:flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sent.bg} ${sent.border} ${sent.color}`}>
              <sent.icon className="h-3 w-3" />{sent.label}
            </span>
          )}
          {isProcessing && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
              <RefreshCw className="h-3 w-3 animate-spin" /> Analyzing…
            </span>
          )}
          <Link
            href={`/recordings/${rec.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:border-white/[0.12] hover:text-slate-300"
            title="View full recording"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:border-white/[0.12] hover:text-slate-300"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="space-y-4 p-4">

              {/* Mobile date + sentiment row */}
              <div className="flex flex-wrap items-center gap-2 sm:hidden text-[11px] text-slate-500">
                <span>{fmtDate(rec.started_at)}</span>
                {sent && (
                  <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${sent.bg} ${sent.border} ${sent.color}`}>
                    <sent.icon className="h-2.5 w-2.5" />{sent.label}
                  </span>
                )}
              </div>

              {/* AI Summary */}
              {hasAi && summaryBullets.length > 0 && (
                <div className="rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.07] to-cyan-500/[0.05] p-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">AI Summary</span>
                  </div>
                  <ul className="space-y-1.5">
                    {summaryBullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/75 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/60" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Keywords */}
                  {rec.ai_keywords && rec.ai_keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rec.ai_keywords.slice(0, 6).map((kw, i) => (
                        <span key={i} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Next steps */}
                  {nextSteps.length > 0 && (
                    <div className="mt-3 border-t border-white/[0.06] pt-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Next Steps</p>
                      <ul className="space-y-1">
                        {nextSteps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="mt-0.5 shrink-0 text-cyan-400">→</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-500">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  AI is transcribing and analyzing this call…
                </div>
              )}

              {/* Reprocess button */}
              {needsAi && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReprocess(rec.id); }}
                  className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.08] px-4 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/15"
                >
                  <Sparkles className="h-4 w-4" /> Transcribe & Analyze with AI
                </button>
              )}

              {/* Transcript */}
              {rec.transcript && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transcript</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                      {rec.transcript}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-8">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 -m-6 rounded-full bg-emerald-500/20"
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]">
          <Volume2 className="h-9 w-9 text-emerald-400/70" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-white">Your call library is empty</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
        Calls 30 seconds or longer are automatically recorded. Enable recording in Settings.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {[
          { icon: Mic,      label: 'Auto-recording' },
          { icon: FileText, label: 'Transcription' },
          { icon: Sparkles, label: 'AI Insights' },
          { icon: Search,   label: 'Full-text search' },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            <Icon className="h-3 w-3 text-emerald-400" /> {label}
          </span>
        ))}
      </div>
      <Link
        href="/dialer"
        className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/10 px-6 py-3 text-sm font-bold text-emerald-300 transition hover:from-emerald-600/30"
      >
        <Phone className="h-4 w-4" /> Start your first call
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SENTIMENT_FILTERS = [
  { key: '',         label: 'All' },
  { key: 'positive', label: 'Positive' },
  { key: 'neutral',  label: 'Neutral' },
  { key: 'negative', label: 'Negative' },
];

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async (searchVal = search, sentimentVal = sentimentFilter) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.set('search', searchVal);
      if (sentimentVal) params.set('sentiment', sentimentVal);
      const res = await fetch(`/api/recordings/list?${params}`);
      const data = await res.json() as { recordings?: Recording[]; error?: string };
      if (!res.ok || data.error) {
        const msg = data.error ?? `Server returned ${res.status}`;
        console.error('Recordings fetch error:', msg);
        setLoadError(msg);
        toast.error(`Could not load recordings: ${msg}`);
        return;
      }
      setRecordings(data.recordings ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('Recordings load error:', err);
      setLoadError(msg);
      toast.error(`Could not load recordings: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [search, sentimentFilter]);

  useEffect(() => {
    void fetchRecordings('', '');
    // Get userId for realtime
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: refresh when AI processing completes
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel('recordings-rt')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_analytics' },
        () => { void fetchRecordings(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchRecordings]);

  const handleSearch = () => void fetchRecordings(search, sentimentFilter);

  const handleSentimentChange = (s: string) => {
    setSentimentFilter(s);
    void fetchRecordings(search, s);
  };

  const handleReprocess = async (id: string) => {
    toast.loading('Queuing AI analysis…', { id: `rp-${id}` });
    try {
      const res = await fetch(`/api/recordings/${id}/reprocess`, { method: 'POST' });
      const data = await res.json() as { error?: string };
      if (data.error) {
        toast.error(data.error, { id: `rp-${id}` });
      } else {
        toast.success('Processing started — refresh in a moment', { id: `rp-${id}` });
        setTimeout(() => void fetchRecordings(), 8000);
      }
    } catch {
      toast.error('Failed to start processing', { id: `rp-${id}` });
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-3 py-4 lg:px-6 lg:py-5">
        <div className="mx-auto max-w-4xl">

          {/* Controls */}
          {(!loading || recordings.length > 0) && (
            <div className="mb-5 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search transcript, name, company…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-600 outline-none transition focus:border-white/[0.14] focus:bg-white/[0.05]"
                />
                {search && (
                  <button type="button" onClick={() => { setSearch(''); void fetchRecordings('', sentimentFilter); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Sentiment:</span>
                {SENTIMENT_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSentimentChange(key)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                      sentimentFilter === key
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                        : 'border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void fetchRecordings()}
                  className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
            </div>
          )}

          {loadError && !loading && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4">
              <p className="text-sm font-semibold text-red-300">Couldn&apos;t load recordings</p>
              <p className="mt-1 text-xs text-red-300/70 break-all">{loadError}</p>
              <button
                type="button"
                onClick={() => void fetchRecordings()}
                className="mt-3 rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.03]" />
              ))}
            </div>
          ) : recordings.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="mb-3 text-[11px] text-slate-600">
                {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
                {sentimentFilter ? ` · ${sentimentFilter}` : ''}
                {search ? ` · "${search}"` : ''}
              </p>
              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              >
                {recordings.map((rec) => (
                  <RecordingCard
                    key={rec.id}
                    rec={rec}
                    activePlayId={activePlayId}
                    onActivatePlay={setActivePlayId}
                    onReprocess={handleReprocess}
                  />
                ))}
              </motion.div>
            </>
          )}
        </div>
    </main>
  );
}
