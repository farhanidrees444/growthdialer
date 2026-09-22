'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Clock, Sparkles, FileText, Search, Phone, Headphones,
  TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown,
  ChevronRight, Volume2, X, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { toast } from 'sonner';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { DashErrorState } from '@/components/dashboard/dash-error-state';
import { PageHeader } from '@/components/ui/page-header';
import { RecordingsStatsStrip } from '@/components/recordings/recordings-stats-strip';
import { RecordingQAStatusPill } from '@/components/recordings/recording-qa-scorecard';
import { cn } from '@/lib/utils';
import { PlanGate } from '@/lib/plan/plan-guard';
import { UpgradePrompt } from '@/lib/plan/upgrade-prompt';
import { useSiteTheme } from '@/components/theme/site-theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecordingLead {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface Recording {
  id: string;
  recording_url: string;
  playback_url?: string;
  duration_seconds: number | null;
  transcript: string | null;
  started_at: string;
  disposition: string | null;
  was_recorded: boolean;
  ai_processing_status: string | null;
  ai_error: string | null;
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

interface RecordingDiagnostics {
  ok: boolean;
  summary: {
    total_calls: number;
    calls_with_recording_url: number;
    eligible_recordings_captured?: number;
    calls_marked_was_recorded: number;
    calls_over_30s: number;
    ai_completed: number;
    ai_pending_or_processing: number;
    ai_failed: number;
    ai_stuck_processing: number;
    mirrored_to_storage: number;
    pending_storage_mirror: number;
  };
  issues: string[];
  next_step: string;
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

const SENTIMENT_LIGHT = {
  positive: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-600/25', label: 'Positive' },
  neutral:  { icon: Minus,      color: 'text-zinc-500',   bg: 'bg-zinc-950/[0.03]',    border: 'border-zinc-950/10',     label: 'Neutral'  },
  negative: { icon: TrendingDown, color: 'text-red-600',   bg: 'bg-red-500/[0.08]',     border: 'border-red-600/25',      label: 'Negative' },
} as const;

type SentimentKey = keyof typeof SENTIMENT;

// ─── MiniPlayer ───────────────────────────────────────────────────────────────

function MiniPlayer({ url, id, activeId, onActivate }: {
  url: string; id: string;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}) {
  const { isDark } = useSiteTheme();
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
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all',
          isDark
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_16px_rgba(52,211,153,0.15)]'
            : 'border-emerald-600/30 bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.08] hover:from-emerald-500/[0.14] hover:to-teal-500/[0.14] hover:shadow-[0_6px_20px_rgba(16,185,129,0.15)]',
          'active:scale-95',
        )}
      >
        {isPlaying
          ? <Pause className={cn('h-4 w-4', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
          : <Play className={cn('h-4 w-4 translate-x-0.5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />}
      </button>
      <div className={cn('h-1 w-16 overflow-hidden rounded-full sm:w-24', isDark ? 'bg-white/[0.07]' : 'bg-zinc-950/[0.07]')}>
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
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

const DISP_COLORS_LIGHT: Record<string, string> = {
  interested:    'bg-emerald-500/[0.08] text-emerald-700',
  callback:      'bg-amber-500/[0.08] text-amber-700',
  meeting_booked:'bg-violet-500/[0.08] text-violet-700',
  not_interested:'bg-zinc-500/[0.08] text-zinc-600',
  voicemail:     'bg-blue-500/[0.08] text-blue-700',
  no_answer:     'bg-zinc-500/[0.07] text-zinc-500',
  wrong_number:  'bg-red-500/[0.08] text-red-700',
  dnc:           'bg-red-600/[0.08] text-red-700',
};

function DispositionBadge({ disp }: { disp: string | null }) {
  const { isDark } = useSiteTheme();
  if (!disp) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${isDark ? (DISP_COLORS[disp] ?? 'bg-white/[0.05] text-slate-500') : (DISP_COLORS_LIGHT[disp] ?? 'bg-zinc-950/[0.04] text-zinc-500')}`}>
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
  const { isDark } = useSiteTheme();
  const [expanded, setExpanded] = useState(false);

  const name = getLeadName(rec.leads, rec.to_number);
  const sentKey = (rec.ai_sentiment ?? '') as SentimentKey;
  const sent = isDark ? SENTIMENT[sentKey] : SENTIMENT_LIGHT[sentKey];
  const summaryBullets = getSummaryBullets(rec.ai_summary_raw);
  const nextSteps = getNextSteps(rec.ai_next_steps_raw);
  const isProcessing = rec.ai_processing_status === 'processing';
  const hasAi = !!rec.analytics_id && !!sent;
  const needsAi = !rec.analytics_id && !isProcessing;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5',
        isDark
          ? 'border-white/[0.07] bg-[oklch(0.09_0.006_285)] hover:border-emerald-500/20 hover:shadow-[0_8px_32px_rgba(52,211,153,0.08)]'
          : 'border-zinc-950/[0.07] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)] hover:border-emerald-600/25 hover:shadow-[0_12px_32px_rgba(16,185,129,0.12)]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 p-4">
        {/* Player */}
        <MiniPlayer
          url={rec.playback_url ?? rec.recording_url}
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
          <RecordingQAStatusPill
            className="hidden md:inline-flex"
            call={{
              recordingUrl: rec.playback_url ?? rec.recording_url,
              durationSeconds: rec.duration_seconds,
              transcript: rec.transcript,
              disposition: rec.disposition,
              aiProcessingStatus: rec.ai_processing_status,
              aiError: rec.ai_error,
            }}
            analytics={rec.analytics_id ? {
              transcript: rec.transcript,
              summary: rec.ai_summary_raw,
              sentiment: rec.ai_sentiment,
              sentiment_score: rec.ai_sentiment_score,
              objections: rec.ai_objections,
              next_steps: rec.ai_next_steps_raw,
            } : null}
          />
          {isProcessing && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
              <RefreshCw className="h-3 w-3 animate-spin" /> Analyzing…
            </span>
          )}
          <Link
            href={`/recordings/${rec.id}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition',
              isDark
                ? 'border-white/[0.07] text-slate-600 hover:border-white/[0.12] hover:text-slate-300'
                : 'border-zinc-950/[0.08] bg-white text-zinc-500 shadow-sm hover:border-zinc-950/20 hover:text-zinc-800',
            )}
            title="View full recording"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition',
              isDark
                ? 'border-white/[0.07] text-slate-600 hover:border-white/[0.12] hover:text-slate-300'
                : 'border-zinc-950/[0.08] bg-white text-zinc-500 shadow-sm hover:border-zinc-950/20 hover:text-zinc-800',
            )}
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
            className={cn('overflow-hidden border-t', isDark ? 'border-white/[0.06]' : 'border-zinc-950/[0.06]')}
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
                <PlanGate
                  feature="ai_call_scoring"
                  fallback={
                    <UpgradePrompt
                      feature="ai_call_scoring"
                      title="Unlock AI summaries"
                      description="Growth includes call summaries, scoring, and coaching signals."
                    />
                  }
                >
                  <div className={cn(
                      'rounded-xl border p-4',
                      isDark
                        ? 'border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.05]'
                        : 'border-emerald-600/20 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04]',
                    )}>
                    <div className="mb-2.5 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-emerald-300' : 'text-emerald-700')}>AI Summary</span>
                    </div>
                    <ul className="space-y-1.5">
                      {summaryBullets.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-white/75 leading-relaxed">
                          <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', isDark ? 'bg-emerald-400/60' : 'bg-emerald-600/60')} />
                          {b}
                        </li>
                      ))}
                    </ul>

                    {/* Keywords */}
                    {rec.ai_keywords && rec.ai_keywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {rec.ai_keywords.slice(0, 6).map((kw, i) => (
                          <span key={i} className={cn(
                            'rounded-full border px-2 py-0.5 text-[11px]',
                            isDark ? 'border-white/[0.08] bg-white/[0.04] text-slate-400' : 'border-zinc-950/[0.08] bg-zinc-950/[0.03] text-zinc-600',
                          )}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Next steps */}
                    {nextSteps.length > 0 && (
                      <div className={cn('mt-3 border-t pt-3', isDark ? 'border-white/[0.06]' : 'border-zinc-950/[0.06]')}>
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Next Steps</p>
                        <ul className="space-y-1">
                          {nextSteps.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className={cn('mt-0.5 shrink-0', isDark ? 'text-teal-400' : 'text-teal-600')}>-&gt;</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </PlanGate>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 text-sm text-slate-500',
                    isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-zinc-950/[0.06] bg-zinc-950/[0.02]',
                  )}>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  AI is transcribing and analyzing this call…
                </div>
              )}

              {/* Reprocess button */}
              {needsAi && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReprocess(rec.id); }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                    isDark
                      ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300 hover:bg-emerald-500/15 hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]'
                      : 'border-emerald-600/30 bg-emerald-500/[0.08] text-emerald-700 hover:bg-emerald-500/[0.14]',
                  )}
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
                  <div className={cn(
                      'max-h-52 overflow-y-auto rounded-xl border p-3',
                      isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-zinc-950/[0.08] bg-zinc-950/[0.02]',
                    )}>
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
    <div className="py-8">
      <PremiumEmptyState
        icon={Volume2}
        scene="recordings"
        accent="emerald"
        title="Recordings appear after eligible calls"
        description="Calls need saved audio and a conversation longer than 30 seconds before playback, transcripts, and AI analysis show here."
        features={[
          { icon: Clock, label: '30s+ calls only' },
          { icon: FileText, label: 'Transcription' },
          { icon: Sparkles, label: 'AI insights' },
          { icon: Search, label: 'Full-text search' },
        ]}
        primaryAction={{ label: 'Start dialing', href: '/dialer' }}
        secondaryAction={{ label: 'Recording settings', href: '/settings?tab=recording' }}
      />
    </div>
  );
}

function sanitizePipelineIssue(issue: string): string {
  return issue
    .replace(/Telnyx/gi, 'Voice service')
    .replace(/GROQ\/GEMINI keys/gi, 'AI service keys')
    .replace(/GROQ/gi, 'AI transcription')
    .replace(/GEMINI/gi, 'AI analysis')
    .replace(/INTERNAL_API_SECRET/g, 'internal pipeline secret')
    .replace(/APP_URL \/ NEXT_PUBLIC_APP_URL/g, 'application URL');
}

function RecordingPipelinePanel({
  diagnostics,
  loading,
  busyAction,
  onRefresh,
  onBackfillAi,
  onBackfillStorage,
}: {
  diagnostics: RecordingDiagnostics | null;
  loading: boolean;
  busyAction: 'ai' | 'storage' | null;
  onRefresh: () => void;
  onBackfillAi: () => void;
  onBackfillStorage: () => void;
}) {
  const { isDark } = useSiteTheme();
  const summary = diagnostics?.summary;
  const hasIssues = Boolean(diagnostics && !diagnostics.ok);
  const pendingAi = (summary?.ai_pending_or_processing ?? 0) + (summary?.ai_failed ?? 0);
  const pendingStorage = summary?.pending_storage_mirror ?? 0;

  return (
    <div className={cn(
      'mb-5 overflow-hidden rounded-2xl border p-4',
      isDark
        ? 'border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.06] via-zinc-950/60 to-cyan-500/[0.04]'
        : 'border-zinc-950/[0.06] bg-gradient-to-br from-emerald-500/[0.05] via-white to-cyan-500/[0.05] shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
    )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {diagnostics?.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <p className="text-sm font-semibold text-white">Recording + AI pipeline</p>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
            {loading
              ? 'Checking recording capture, secure playback, and AI analysis status...'
              : diagnostics?.ok
                ? 'Pipeline looks ready. Make a real call over 30 seconds, then refresh here to confirm playback, transcript, and summary.'
                : 'A few checks need attention before eligible recordings and AI analysis are ready.'}
          </p>
        </div>
          <button
            type="button"
            onClick={onRefresh}
            className="dash-btn-ghost shrink-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Recheck
          </button>
      </div>

      {summary && (
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            { label: 'Playable audio', value: summary.calls_with_recording_url },
            { label: 'AI complete', value: summary.ai_completed },
            { label: 'AI pending', value: pendingAi },
            { label: 'Storage pending', value: pendingStorage },
          ].map((item) => (
            <div key={item.label} className={cn(
                'rounded-xl border px-3 py-2',
                isDark ? 'border-white/[0.06] bg-white/[0.025]' : 'border-zinc-950/[0.06] bg-zinc-950/[0.02]',
              )}>
              <p className="font-display text-xl font-semibold text-white">{item.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {hasIssues && diagnostics && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Needs attention</p>
          <ul className="mt-2 space-y-1.5">
            {diagnostics.issues.slice(0, 4).map((issue) => (
              <li key={issue} className="text-xs leading-relaxed text-amber-100/75">
                {sanitizePipelineIssue(issue)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBackfillAi}
          disabled={busyAction !== null}
          className="dash-btn-ghost"
        >
          <Sparkles className={cn('h-3.5 w-3.5', busyAction === 'ai' && 'animate-pulse')} />
          Retry AI queue
        </button>
        <button
          type="button"
          onClick={onBackfillStorage}
          disabled={busyAction !== null}
          className="dash-btn-ghost"
        >
          <FileText className={cn('h-3.5 w-3.5', busyAction === 'storage' && 'animate-pulse')} />
          Secure saved audio
        </button>
      </div>
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
  const { apiFetch } = useWorkspace();
  const { isDark } = useSiteTheme();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<RecordingDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [pipelineAction, setPipelineAction] = useState<'ai' | 'storage' | null>(null);
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
      const res = await apiFetch(`/api/recordings/list?${params}`);
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
  }, [search, sentimentFilter, apiFetch]);

  const fetchDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    try {
      const res = await apiFetch('/api/recordings/diagnostics');
      const data = await res.json() as RecordingDiagnostics;
      if (res.ok) setDiagnostics(data);
    } catch (err) {
      console.warn('Recording diagnostics failed:', err);
    } finally {
      setDiagnosticsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void fetchRecordings('', '');
    void fetchDiagnostics();
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

  const recordingStats = {
    total: recordings.length,
    analyzed: recordings.filter((r) => r.analytics_id).length,
    positive: recordings.filter((r) => r.ai_sentiment === 'positive').length,
    totalMinutes: Math.round(
      recordings.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / 60,
    ),
  };

  const handleReprocess = async (id: string) => {
    toast.loading('Queuing AI analysis…', { id: `rp-${id}` });
    try {
      const res = await apiFetch(`/api/recordings/${id}/reprocess`, { method: 'POST' });
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

  const runPipelineAction = async (kind: 'ai' | 'storage') => {
    setPipelineAction(kind);
    const toastId = `pipeline-${kind}`;
    toast.loading(kind === 'ai' ? 'Retrying AI queue...' : 'Securing saved audio...', { id: toastId });
    try {
      const res = await apiFetch(
        kind === 'ai' ? '/api/recordings/backfill-ai' : '/api/recordings/backfill-storage',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 10 }) },
      );
      const data = await res.json().catch(() => ({})) as { error?: string; queued?: number; mirrored?: number; failed?: number };
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Pipeline action failed', { id: toastId });
        return;
      }
      const count = kind === 'ai' ? data.queued ?? 0 : data.mirrored ?? 0;
      toast.success(count > 0 ? `Started ${count} item${count === 1 ? '' : 's'}` : 'Nothing needed retry', { id: toastId });
      await Promise.all([fetchRecordings(), fetchDiagnostics()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Pipeline action failed', { id: toastId });
    } finally {
      setPipelineAction(null);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-3 py-4 lg:px-6 lg:py-5">
        <div className="mx-auto max-w-4xl">
          <PageHeader
            title="Recordings"
            description="Playback, transcripts, and AI analysis for your calls."
            icon={Headphones}
            className="dash-enter"
          />

          <RecordingPipelinePanel
            diagnostics={diagnostics}
            loading={diagnosticsLoading}
            busyAction={pipelineAction}
            onRefresh={() => { void fetchDiagnostics(); }}
            onBackfillAi={() => { void runPipelineAction('ai'); }}
            onBackfillStorage={() => { void runPipelineAction('storage'); }}
          />

          {/* Controls */}
          {!loading && recordings.length > 0 && (
            <div className="mb-5">
              <RecordingsStatsStrip stats={recordingStats} />
            </div>
          )}

          {(!loading || recordings.length > 0) && (
            <div className={cn(
              'mb-5 space-y-3 rounded-2xl border p-3 backdrop-blur-sm sm:p-4',
              isDark
                ? 'border-white/[0.06] bg-zinc-950/40'
                : 'border-zinc-950/[0.06] bg-white/85 shadow-[0_8px_28px_rgba(9,9,11,0.07)]',
            )}>
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search transcript, name, company…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className={cn(
                    'w-full py-2.5 pl-9 pr-10',
                    isDark
                      ? 'dash-input'
                      : 'rounded-lg border border-zinc-950/10 bg-white text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-sm',
                  )}
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
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold transition-all',
                      sentimentFilter === key
                        ? isDark
                          ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                          : 'border-emerald-600/30 bg-emerald-500/[0.08] text-emerald-700 shadow-[0_4px_14px_rgba(16,185,129,0.12)]'
                        : isDark
                          ? 'border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300'
                          : 'border-zinc-950/[0.08] bg-white text-zinc-500 shadow-sm hover:text-zinc-900',
                    )}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void fetchRecordings()}
                  className="dash-btn-ghost ml-auto"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
            </div>
          )}

          {loadError && !loading && (
            <div className="mb-5">
              <DashErrorState
                compact
                title="Couldn't load recordings"
                description={loadError}
                onRetry={() => void fetchRecordings()}
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn('h-[72px] rounded-2xl', isDark ? 'dash-skeleton' : 'animate-pulse bg-zinc-950/[0.05]')} aria-hidden />
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
