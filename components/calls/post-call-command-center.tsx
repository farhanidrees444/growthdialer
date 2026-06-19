'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headphones,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Unplug,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AiStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped_short' | string | null;

export interface PostCallAnalytics {
  summary?: unknown;
  sentiment?: string | null;
  sentiment_score?: number | null;
  next_steps?: unknown;
  suggested_disposition?: string | null;
  objections?: string[] | null;
  buying_signals?: string[] | null;
  error?: string | null;
}

export interface PostCallCommandCenterCall {
  id: string;
  leadName: string;
  company?: string | null;
  phone?: string | null;
  direction?: string | null;
  startedAt?: string | null;
  durationSeconds?: number | null;
  disposition?: string | null;
  notes?: string | null;
  recordingUrl?: string | null;
  transcript?: string | null;
  aiProcessingStatus?: AiStatus;
  aiError?: string | null;
  analytics?: PostCallAnalytics | null;
}

interface PostCallCommandCenterProps {
  call: PostCallCommandCenterCall;
  compact?: boolean;
  recordingHref?: string | null;
  integrationsHref?: string;
  onOpenTranscript?: () => void;
  onSaveNotes?: (notes: string) => Promise<void>;
  onSaveDisposition?: (
    disposition: string,
    notes: string,
    dates?: { callbackAt?: string; meetingAt?: string },
  ) => Promise<void>;
}

const DISPOSITIONS = [
  { key: 'interested', label: 'Interested', tone: 'emerald' },
  { key: 'meeting_booked', label: 'Meeting Booked', tone: 'violet' },
  { key: 'callback', label: 'Callback', tone: 'amber' },
  { key: 'voicemail', label: 'Voicemail', tone: 'blue' },
  { key: 'gatekeeper', label: 'Gatekeeper', tone: 'violet' },
  { key: 'not_interested', label: 'Not Interested', tone: 'slate' },
  { key: 'wrong_number', label: 'Wrong Number', tone: 'red' },
  { key: 'dnc', label: 'Do Not Call', tone: 'red' },
] as const;

const DISPOSITION_CLASS: Record<string, string> = {
  emerald: 'border-emerald-500/35 bg-emerald-500/[0.09] text-emerald-200 hover:bg-emerald-500/[0.14]',
  violet: 'border-violet-500/35 bg-violet-500/[0.09] text-violet-200 hover:bg-violet-500/[0.14]',
  amber: 'border-amber-500/35 bg-amber-500/[0.09] text-amber-200 hover:bg-amber-500/[0.14]',
  blue: 'border-blue-500/35 bg-blue-500/[0.09] text-blue-200 hover:bg-blue-500/[0.14]',
  slate: 'border-white/[0.09] bg-white/[0.035] text-slate-300 hover:bg-white/[0.055]',
  red: 'border-red-500/35 bg-red-500/[0.08] text-red-200 hover:bg-red-500/[0.13]',
};

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return 'Unknown duration';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDisposition(value?: string | null): string {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ');
}

function getSummaryBullets(summary: unknown): string[] {
  if (!summary) return [];
  if (Array.isArray(summary)) return summary.slice(0, 4).map(String);
  if (typeof summary === 'string' && summary.trim()) return [summary.trim()];
  if (typeof summary === 'object' && summary !== null) {
    const bullets = (summary as { bullets?: unknown }).bullets;
    if (Array.isArray(bullets)) return bullets.slice(0, 4).map(String);
  }
  return [];
}

function getNextSteps(nextSteps: unknown): string[] {
  if (!nextSteps) return [];
  if (Array.isArray(nextSteps)) return nextSteps.slice(0, 3).map(String);
  if (typeof nextSteps === 'string') {
    const trimmed = nextSteps.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.slice(0, 3).map(String);
    } catch {
      return [trimmed];
    }
    return [trimmed];
  }
  return [];
}

function aiStatusCopy(status: AiStatus, hasAnalytics: boolean, aiError?: string | null) {
  if (aiError || status === 'failed') {
    return {
      icon: Unplug,
      label: 'AI analysis needs attention',
      body: aiError ?? 'The analysis service could not complete this call.',
      className: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-200',
    };
  }
  if (hasAnalytics || status === 'completed') {
    return {
      icon: Sparkles,
      label: 'AI analysis ready',
      body: 'Summary, sentiment, and next-step signals are available from saved call data.',
      className: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200',
    };
  }
  if (status === 'processing' || status === 'pending') {
    return {
      icon: Loader2,
      label: 'AI analysis is processing',
      body: 'Transcript and summary appear automatically after the recorded call is analyzed.',
      className: 'border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-200',
      spin: true,
    };
  }
  if (status === 'skipped_short') {
    return {
      icon: Headphones,
      label: 'Short call',
      body: 'This call was too short for a useful recording analysis.',
      className: 'border-white/[0.09] bg-white/[0.035] text-slate-300',
    };
  }
  return {
    icon: RefreshCw,
    label: 'Waiting for post-call data',
    body: 'Recording, transcript, and AI analysis will fill in here when available.',
    className: 'border-white/[0.09] bg-white/[0.035] text-slate-300',
  };
}

export function PostCallCommandCenter({
  call,
  compact = false,
  recordingHref,
  integrationsHref = '/integrations',
  onOpenTranscript,
  onSaveNotes,
  onSaveDisposition,
}: PostCallCommandCenterProps) {
  const analytics = call.analytics;
  const summaryBullets = useMemo(() => getSummaryBullets(analytics?.summary), [analytics?.summary]);
  const nextSteps = useMemo(() => getNextSteps(analytics?.next_steps), [analytics?.next_steps]);
  const hasAnalytics = Boolean(analytics && !analytics.error && (summaryBullets.length > 0 || nextSteps.length > 0 || analytics.sentiment));
  const status = aiStatusCopy(call.aiProcessingStatus ?? null, hasAnalytics, analytics?.error ?? call.aiError);
  const StatusIcon = status.icon;
  const statusSpins = 'spin' in status && status.spin;

  const [selectedDisposition, setSelectedDisposition] = useState(call.disposition ?? analytics?.suggested_disposition ?? '');
  const [notes, setNotes] = useState(call.notes ?? '');
  const [followUpDraft, setFollowUpDraft] = useState(nextSteps[0] ?? '');
  const [callbackAt, setCallbackAt] = useState('');
  const [meetingAt, setMeetingAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedDisposition(call.disposition ?? analytics?.suggested_disposition ?? '');
    setNotes(call.notes ?? '');
  }, [call.disposition, call.notes, analytics?.suggested_disposition]);

  useEffect(() => {
    setFollowUpDraft((current) => current || nextSteps[0] || '');
  }, [nextSteps]);

  const saveEnabled = Boolean(onSaveNotes || onSaveDisposition);
  const canSaveDisposition = Boolean(selectedDisposition && onSaveDisposition);
  const selectedMeta = DISPOSITIONS.find((d) => d.key === selectedDisposition);

  const toIsoString = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  };

  async function handleSave() {
    if (!saveEnabled || saving) return;
    setSaving(true);
    try {
      const saveDisposition = onSaveDisposition;
      const saveNotes = onSaveNotes;
      if (selectedDisposition && saveDisposition) {
        await saveDisposition(selectedDisposition, notes, {
          callbackAt: selectedDisposition === 'callback' ? toIsoString(callbackAt) : undefined,
          meetingAt: selectedDisposition === 'meeting_booked' ? toIsoString(meetingAt) : undefined,
        });
      } else if (saveNotes) {
        await saveNotes(notes);
      }
      toast.success('Call wrap-up saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save wrap-up');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={cn(
      'relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[oklch(0.085_0.008_285)] shadow-2xl shadow-black/30',
      compact ? 'p-4' : 'p-5 sm:p-6',
    )}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(52,211,153,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_100%_30%,rgba(34,211,238,0.09),transparent_50%)]" />
      <div className="relative space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300/80">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Post-call command center
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Finish the call while context is fresh
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              {call.leadName}
              {call.company ? ` at ${call.company}` : ''}
              {' '}· {formatDuration(call.durationSeconds)}
              {call.direction ? ` · ${call.direction}` : ''}
            </p>
          </div>
          <div className={cn('rounded-2xl border px-3.5 py-3 text-sm', status.className)}>
            <div className="flex items-center gap-2 font-semibold">
              <StatusIcon className={cn('h-4 w-4', statusSpins && 'animate-spin')} />
              {status.label}
            </div>
            <p className="mt-1 max-w-xs text-xs leading-relaxed opacity-75">{status.body}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-semibold text-white">Outcome and AI summary</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-400">
                  {formatDisposition(call.disposition)}
                </span>
              </div>
              {summaryBullets.length > 0 ? (
                <ul className="space-y-2">
                  {summaryBullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.08] bg-black/15 p-4 text-sm text-slate-500">
                  No AI summary is available yet. This panel will populate from real transcript analysis when processing completes.
                </div>
              )}

              {(analytics?.sentiment || analytics?.suggested_disposition) && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {analytics.sentiment && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-semibold capitalize text-emerald-300">
                      Sentiment: {analytics.sentiment}
                    </span>
                  )}
                  {analytics.suggested_disposition && (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 font-semibold capitalize text-cyan-300">
                      Suggested: {formatDisposition(analytics.suggested_disposition)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold text-white">Evidence and review links</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {recordingHref ? (
                  <Link
                    href={recordingHref}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/[0.12]"
                  >
                    Recording
                    <Headphones className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-xs text-slate-500">
                    Recording pending
                  </span>
                )}
                {call.transcript || onOpenTranscript ? (
                  <button
                    type="button"
                    onClick={onOpenTranscript}
                    disabled={!onOpenTranscript}
                    className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/[0.07] px-3 py-3 text-left text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/[0.12] disabled:opacity-60"
                  >
                    Transcript
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-xs text-slate-500">
                    Transcript pending
                  </span>
                )}
                <Link
                  href={integrationsHref}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-xs font-semibold text-slate-400 transition hover:border-violet-500/25 hover:text-violet-200"
                >
                  CRM setup
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold text-white">Rep wrap-up</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DISPOSITIONS.map((disp) => (
                  <button
                    key={disp.key}
                    type="button"
                    onClick={() => setSelectedDisposition(disp.key)}
                    className={cn(
                      'min-h-11 rounded-xl border px-2.5 py-2 text-left text-[11px] font-semibold capitalize transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40',
                      DISPOSITION_CLASS[disp.tone],
                      selectedDisposition === disp.key && 'ring-2 ring-emerald-400/45',
                    )}
                    aria-pressed={selectedDisposition === disp.key}
                  >
                    {disp.label}
                  </button>
                ))}
              </div>

              {(selectedDisposition === 'callback' || selectedDisposition === 'meeting_booked') && (
                <label className="mt-3 block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {selectedDisposition === 'callback' ? 'Callback reminder' : 'Meeting time'}
                  </span>
                  <input
                    type="datetime-local"
                    value={selectedDisposition === 'callback' ? callbackAt : meetingAt}
                    onChange={(e) => {
                      if (selectedDisposition === 'callback') setCallbackAt(e.target.value);
                      else setMeetingAt(e.target.value);
                    }}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500/30"
                  />
                </label>
              )}

              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">Call note or recap</span>
                <textarea
                  rows={compact ? 3 : 4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add the recap, objections, commitments, and anything the next rep needs."
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-sm leading-relaxed text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!saveEnabled || saving}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                {selectedMeta ? `Save wrap-up · ${selectedMeta.label}` : 'Save call note'}
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Next best action</p>
              {nextSteps.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {nextSteps.map((step) => (
                    <li key={step} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      {step}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  No AI next step is available. Draft a follow-up below without syncing it to a CRM.
                </p>
              )}
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">
                  Follow-up draft
                  <span className="ml-2 rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-slate-500">Draft only</span>
                </span>
                <textarea
                  rows={3}
                  value={followUpDraft}
                  onChange={(e) => setFollowUpDraft(e.target.value)}
                  placeholder="Draft the next step or reminder. CRM sync is not enabled from this panel yet."
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-sm leading-relaxed text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/30"
                />
              </label>
              <div className="mt-3 rounded-xl border border-dashed border-white/[0.08] bg-black/15 p-3">
                <div className="flex items-start gap-2">
                  <Unplug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    CRM handoff is shown as a setup affordance only. Connect an integration before automatic sync actions appear here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
