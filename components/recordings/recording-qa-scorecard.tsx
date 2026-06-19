'use client';

import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headphones,
  Loader2,
  type LucideIcon,
  MessageSquareText,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AiStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped_short' | string | null;

export interface RecordingQAAnalytics {
  transcript?: string | null;
  summary?: unknown;
  sentiment?: string | null;
  sentiment_score?: number | null;
  talking_points?: unknown;
  objections?: unknown;
  buying_signals?: unknown;
  next_steps?: unknown;
  suggested_disposition?: string | null;
  error?: string | null;
}

export interface RecordingQACall {
  recordingUrl?: string | null;
  durationSeconds?: number | null;
  transcript?: string | null;
  disposition?: string | null;
  notes?: string | null;
  aiProcessingStatus?: AiStatus;
  aiError?: string | null;
}

interface RecordingQAScorecardProps {
  call: RecordingQACall;
  analytics?: RecordingQAAnalytics | null;
  compact?: boolean;
  className?: string;
}

interface ScoreInput {
  label: string;
  points: number;
  max: number;
  evidence: string;
  tone: 'good' | 'warn' | 'muted';
}

interface ChecklistItem {
  label: string;
  status: 'ready' | 'unavailable' | 'attention';
  evidence: string;
}

interface TalkListenRatio {
  label: string;
  repPercent: number;
  listenerPercent: number;
}

interface QAStatus {
  label: string;
  detail: string;
  tone: 'ready' | 'processing' | 'attention' | 'muted';
  score: number | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toStringArray(value: unknown): string[] {
  const parsed = parseMaybeJson(value);
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'number') return String(item);
      const record = asRecord(item);
      return cleanString(record?.text) ?? cleanString(record?.label) ?? cleanString(record?.content) ?? '';
    }).filter(Boolean);
  }
  if (typeof parsed === 'string') {
    return parsed.trim() ? [parsed.trim()] : [];
  }
  return [];
}

function getSummaryBullets(summary: unknown): string[] {
  const parsed = parseMaybeJson(summary);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return toStringArray(parsed).slice(0, 5);
  if (typeof parsed === 'string') return parsed.trim() ? [parsed.trim()] : [];
  const record = asRecord(parsed);
  return toStringArray(record?.bullets ?? record?.summary ?? record?.points).slice(0, 5);
}

function getNextSteps(value: unknown): string[] {
  return toStringArray(value).slice(0, 4);
}

function normalizeSentimentScore(score?: number | null, sentiment?: string | null): number | null {
  if (typeof score === 'number' && Number.isFinite(score)) {
    if (score > 1) return Math.max(-1, Math.min(1, score / 100));
    return Math.max(-1, Math.min(1, score));
  }
  const label = sentiment?.toLowerCase();
  if (label === 'positive') return 0.65;
  if (label === 'neutral') return 0;
  if (label === 'negative') return -0.65;
  return null;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatDisposition(value?: string | null): string {
  return value ? value.replace(/_/g, ' ') : 'Not set';
}

function hasUsableText(value?: string | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

function getWords(summary: unknown): unknown[] {
  const record = asRecord(parseMaybeJson(summary));
  const words = record?.words;
  return Array.isArray(words) ? words : [];
}

function getSpeakerLabel(record: Record<string, unknown>): string | null {
  return cleanString(record.speaker)
    ?? cleanString(record.speaker_label)
    ?? cleanString(record.channel)
    ?? cleanString(record.role);
}

function isRepSpeaker(label: string): boolean {
  return /\b(rep|agent|sales|user|seller|caller)\b/i.test(label);
}

function isBuyerSpeaker(label: string): boolean {
  return /\b(prospect|customer|lead|buyer|client|callee|contact)\b/i.test(label);
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getTalkListenRatio(summary: unknown): TalkListenRatio | null {
  const words = getWords(summary);
  if (words.length === 0) return null;

  let repSeconds = 0;
  let buyerSeconds = 0;

  for (const item of words) {
    const record = asRecord(item);
    if (!record) continue;
    const speaker = getSpeakerLabel(record);
    const start = getNumber(record.start);
    const end = getNumber(record.end);
    if (!speaker || start === null || end === null || end <= start) continue;

    const duration = end - start;
    if (isRepSpeaker(speaker)) repSeconds += duration;
    if (isBuyerSpeaker(speaker)) buyerSeconds += duration;
  }

  const total = repSeconds + buyerSeconds;
  if (total <= 0) return null;

  return {
    label: `${Math.round(repSeconds)}s / ${Math.round(buyerSeconds)}s`,
    repPercent: (repSeconds / total) * 100,
    listenerPercent: (buyerSeconds / total) * 100,
  };
}

function getScoreInputs(call: RecordingQACall, analytics?: RecordingQAAnalytics | null): ScoreInput[] {
  const summaryBullets = getSummaryBullets(analytics?.summary);
  const transcript = analytics?.transcript ?? call.transcript;
  const sentimentScore = normalizeSentimentScore(analytics?.sentiment_score, analytics?.sentiment);
  const nextSteps = getNextSteps(analytics?.next_steps);
  const objections = toStringArray(analytics?.objections);
  const buyingSignals = toStringArray(analytics?.buying_signals);
  const duration = call.durationSeconds ?? 0;

  const scoreInputs: ScoreInput[] = [];

  if (duration >= 30 && (hasUsableText(transcript) || summaryBullets.length > 0)) {
    scoreInputs.push({
      label: 'Recording evidence',
      points: 20,
      max: 20,
      evidence: hasUsableText(transcript) ? 'Transcript is available for review.' : 'AI summary is available for review.',
      tone: 'good',
    });
  } else {
    scoreInputs.push({
      label: 'Recording evidence',
      points: 0,
      max: 20,
      evidence: duration > 0 && duration < 30 ? 'Call was too short for reliable QA.' : 'Needs transcript or summary data.',
      tone: 'muted',
    });
  }

  if (sentimentScore !== null) {
    const points = sentimentScore > 0.2 ? 20 : sentimentScore < -0.2 ? 8 : 14;
    scoreInputs.push({
      label: 'Customer sentiment',
      points,
      max: 20,
      evidence: `${analytics?.sentiment ?? 'Sentiment'}${analytics?.sentiment_score !== null && analytics?.sentiment_score !== undefined ? ` (${analytics.sentiment_score.toFixed(2)})` : ''}`,
      tone: sentimentScore < -0.2 ? 'warn' : 'good',
    });
  } else {
    scoreInputs.push({
      label: 'Customer sentiment',
      points: 0,
      max: 20,
      evidence: 'No sentiment signal is stored for this call.',
      tone: 'muted',
    });
  }

  scoreInputs.push({
    label: 'Next step captured',
    points: nextSteps.length > 0 ? 15 : 0,
    max: 15,
    evidence: nextSteps[0] ?? 'No next step is stored yet.',
    tone: nextSteps.length > 0 ? 'good' : 'muted',
  });

  scoreInputs.push({
    label: 'Signals captured',
    points: (objections.length > 0 ? 8 : 0) + (buyingSignals.length > 0 ? 7 : 0),
    max: 15,
    evidence: `${objections.length} objection${objections.length === 1 ? '' : 's'}, ${buyingSignals.length} buying signal${buyingSignals.length === 1 ? '' : 's'}`,
    tone: objections.length > 0 || buyingSignals.length > 0 ? 'good' : 'muted',
  });

  scoreInputs.push({
    label: 'Rep wrap-up',
    points: (call.disposition ? 10 : 0) + (hasUsableText(call.notes) ? 10 : 0),
    max: 20,
    evidence: `${call.disposition ? `Disposition: ${formatDisposition(call.disposition)}` : 'Disposition missing'}${hasUsableText(call.notes) ? ' + notes saved' : ' + notes missing'}`,
    tone: call.disposition && hasUsableText(call.notes) ? 'good' : 'warn',
  });

  scoreInputs.push({
    label: 'Structured recap',
    points: summaryBullets.length > 0 ? 10 : 0,
    max: 10,
    evidence: summaryBullets.length > 0 ? `${summaryBullets.length} summary bullet${summaryBullets.length === 1 ? '' : 's'} available.` : 'No structured recap is stored.',
    tone: summaryBullets.length > 0 ? 'good' : 'muted',
  });

  return scoreInputs;
}

function canScore(call: RecordingQACall, analytics?: RecordingQAAnalytics | null): boolean {
  const transcript = analytics?.transcript ?? call.transcript;
  return Boolean(
    call.recordingUrl
    && call.aiProcessingStatus !== 'processing'
    && call.aiProcessingStatus !== 'pending'
    && call.aiProcessingStatus !== 'skipped_short'
    && !call.aiError
    && analytics
    && !analytics.error
    && (hasUsableText(transcript) || getSummaryBullets(analytics.summary).length > 0),
  );
}

export function getRecordingQAStatus(call: RecordingQACall, analytics?: RecordingQAAnalytics | null): QAStatus {
  const aiError = analytics?.error ?? call.aiError;
  const duration = call.durationSeconds ?? 0;
  const transcript = analytics?.transcript ?? call.transcript;

  if (!call.recordingUrl) {
    return {
      label: 'QA unavailable',
      detail: 'No call recording is saved yet.',
      tone: 'muted',
      score: null,
    };
  }

  if (call.aiProcessingStatus === 'skipped_short' || (duration > 0 && duration < 30)) {
    return {
      label: 'QA skipped',
      detail: 'Short call, not enough recording for coaching analysis.',
      tone: 'muted',
      score: null,
    };
  }

  if (aiError || call.aiProcessingStatus === 'failed') {
    return {
      label: 'QA needs attention',
      detail: 'AI analysis did not complete for this recording.',
      tone: 'attention',
      score: null,
    };
  }

  if (call.aiProcessingStatus === 'processing' || call.aiProcessingStatus === 'pending') {
    return {
      label: 'QA processing',
      detail: 'Transcript and analysis are still being prepared.',
      tone: 'processing',
      score: null,
    };
  }

  if (!analytics) {
    return {
      label: 'QA pending',
      detail: 'AI analysis is not attached to this recording yet.',
      tone: 'processing',
      score: null,
    };
  }

  if (!hasUsableText(transcript) && getSummaryBullets(analytics.summary).length === 0) {
    return {
      label: 'QA unavailable',
      detail: 'Needs transcript or structured summary data.',
      tone: 'muted',
      score: null,
    };
  }

  const inputs = getScoreInputs(call, analytics);
  const score = Math.round(inputs.reduce((sum, input) => sum + input.points, 0));
  return {
    label: 'QA readiness',
    detail: 'Based on saved recording, AI analysis, and rep wrap-up evidence.',
    tone: score >= 70 ? 'ready' : 'attention',
    score,
  };
}

function getChecklist(call: RecordingQACall, analytics?: RecordingQAAnalytics | null): ChecklistItem[] {
  const summaryBullets = getSummaryBullets(analytics?.summary);
  const talkingPoints = toStringArray(analytics?.talking_points);
  const objections = toStringArray(analytics?.objections);
  const buyingSignals = toStringArray(analytics?.buying_signals);
  const nextSteps = getNextSteps(analytics?.next_steps);
  const transcript = analytics?.transcript ?? call.transcript;

  return [
    {
      label: 'Structured recap',
      status: summaryBullets.length > 0 ? 'ready' : 'unavailable',
      evidence: summaryBullets[0] ?? 'No AI summary bullets stored.',
    },
    {
      label: 'Discovery topics',
      status: talkingPoints.length > 0 ? 'ready' : 'unavailable',
      evidence: talkingPoints.length > 0 ? talkingPoints.slice(0, 3).join(', ') : 'No talking points stored.',
    },
    {
      label: 'Objection review',
      status: objections.length > 0 ? 'attention' : 'unavailable',
      evidence: objections.length > 0 ? objections.slice(0, 2).join(', ') : 'No objection field available or none detected.',
    },
    {
      label: 'Buying signal review',
      status: buyingSignals.length > 0 ? 'ready' : 'unavailable',
      evidence: buyingSignals.length > 0 ? buyingSignals.slice(0, 2).join(', ') : 'No buying signals stored.',
    },
    {
      label: 'Follow-up commitment',
      status: nextSteps.length > 0 || call.disposition ? 'ready' : 'unavailable',
      evidence: nextSteps[0] ?? (call.disposition ? `Disposition saved: ${formatDisposition(call.disposition)}` : 'No next step or disposition stored.'),
    },
    {
      label: 'Transcript review',
      status: hasUsableText(transcript) ? 'ready' : 'unavailable',
      evidence: hasUsableText(transcript) ? 'Transcript is available for manual coaching review.' : 'No transcript is stored yet.',
    },
  ];
}

function StatusIcon({ tone }: { tone: QAStatus['tone'] }) {
  if (tone === 'ready') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (tone === 'processing') return <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />;
  if (tone === 'attention') return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  return <Minus className="h-4 w-4 text-slate-500" />;
}

export function RecordingQAStatusPill({
  call,
  analytics,
  className,
}: Pick<RecordingQAScorecardProps, 'call' | 'analytics' | 'className'>) {
  const status = getRecordingQAStatus(call, analytics);

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
      status.tone === 'ready' && 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
      status.tone === 'processing' && 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300',
      status.tone === 'attention' && 'border-amber-500/25 bg-amber-500/10 text-amber-300',
      status.tone === 'muted' && 'border-white/[0.08] bg-white/[0.035] text-slate-500',
      className,
    )}>
      <StatusIcon tone={status.tone} />
      {status.score !== null ? `${status.score}% QA` : status.label}
    </span>
  );
}

export function RecordingQAScorecard({
  call,
  analytics,
  compact = false,
  className,
}: RecordingQAScorecardProps) {
  const status = getRecordingQAStatus(call, analytics);
  const scoreInputs = canScore(call, analytics) ? getScoreInputs(call, analytics) : [];
  const checklist = getChecklist(call, analytics);
  const sentimentScore = normalizeSentimentScore(analytics?.sentiment_score, analytics?.sentiment);
  const objections = toStringArray(analytics?.objections);
  const buyingSignals = toStringArray(analytics?.buying_signals);
  const nextSteps = getNextSteps(analytics?.next_steps);
  const talkListenRatio = getTalkListenRatio(analytics?.summary);

  return (
    <section className={cn(
      'relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[oklch(0.085_0.008_285)] shadow-2xl shadow-black/30',
      compact ? 'p-4' : 'p-5 sm:p-6',
      className,
    )}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(16,185,129,0.13),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_100%_15%,rgba(168,85,247,0.10),transparent_52%)]" />
      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300/80">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Recording QA scorecard
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Turn this call into coaching evidence
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              Scores and checklist items only use saved recording, transcript, AI analysis, disposition, and notes already attached to this call.
            </p>
          </div>

          <div className={cn(
            'rounded-2xl border px-4 py-3',
            status.tone === 'ready' && 'border-emerald-500/25 bg-emerald-500/[0.08]',
            status.tone === 'processing' && 'border-cyan-500/25 bg-cyan-500/[0.08]',
            status.tone === 'attention' && 'border-amber-500/25 bg-amber-500/[0.08]',
            status.tone === 'muted' && 'border-white/[0.08] bg-white/[0.035]',
          )}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <StatusIcon tone={status.tone} />
              {status.label}
            </div>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">{status.detail}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-white/[0.07] bg-black/20 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Overall</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-semibold tracking-tight text-white">
                    {status.score !== null ? status.score : '--'}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ 100</span>
                </div>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                <Sparkles className={cn(
                  'h-7 w-7',
                  status.score !== null ? 'text-emerald-300' : 'text-slate-600',
                )} />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              This is a readiness score, not a fabricated QA grade. Missing data stays visible and does not become a guessed metric.
            </p>

            {scoreInputs.length > 0 ? (
              <div className="mt-5 space-y-2">
                {scoreInputs.map((input) => (
                  <div key={input.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-white">{input.label}</p>
                      <span className={cn(
                        'text-xs font-bold tabular-nums',
                        input.tone === 'good' && 'text-emerald-300',
                        input.tone === 'warn' && 'text-amber-300',
                        input.tone === 'muted' && 'text-slate-600',
                      )}>
                        +{input.points}/{input.max}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{input.evidence}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-sm font-semibold text-slate-300">{status.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{status.detail}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                icon={talkListenRatio ? Headphones : AlertTriangle}
                label="Talk/listen ratio"
                value={talkListenRatio ? `${formatPercent(talkListenRatio.repPercent)} / ${formatPercent(talkListenRatio.listenerPercent)}` : 'Unavailable'}
                body={talkListenRatio ? `Speaker timing: ${talkListenRatio.label}` : 'Needs transcript speaker labels and timing data.'}
                tone={talkListenRatio ? 'good' : 'muted'}
              />
              <MetricCard
                icon={sentimentScore !== null && sentimentScore > 0.2 ? TrendingUp : sentimentScore !== null && sentimentScore < -0.2 ? TrendingDown : Minus}
                label="Sentiment"
                value={analytics?.sentiment ?? 'Pending'}
                body={sentimentScore !== null ? `Stored sentiment score: ${sentimentScore.toFixed(2)}` : 'No sentiment score is attached.'}
                tone={sentimentScore === null ? 'muted' : sentimentScore < -0.2 ? 'warn' : 'good'}
              />
              <MetricCard
                icon={MessageSquareText}
                label="Objections"
                value={String(objections.length)}
                body={objections[0] ?? 'No objection field available or none detected.'}
                tone={objections.length > 0 ? 'warn' : 'muted'}
              />
              <MetricCard
                icon={Target}
                label="Buying signals"
                value={String(buyingSignals.length)}
                body={buyingSignals[0] ?? 'No buying signals are stored for this call.'}
                tone={buyingSignals.length > 0 ? 'good' : 'muted'}
              />
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold text-white">Structured QA checklist</p>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        item.status === 'ready' && 'bg-emerald-500/10 text-emerald-300',
                        item.status === 'attention' && 'bg-amber-500/10 text-amber-300',
                        item.status === 'unavailable' && 'bg-white/[0.04] text-slate-600',
                      )}>
                        {item.status === 'ready' ? 'Available' : item.status === 'attention' ? 'Review' : 'Missing'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{item.evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold text-white">Next coaching tip</p>
              </div>
              <p className="text-sm leading-relaxed text-emerald-100/80">
                {nextSteps[0]
                  ?? (objections[0] ? `Review how the rep handled: ${objections[0]}` : null)
                  ?? (analytics?.suggested_disposition ? `Confirm the saved disposition matches "${formatDisposition(analytics.suggested_disposition)}".` : null)
                  ?? 'No AI next step or coaching suggestion is stored yet.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  body,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  body: string;
  tone: 'good' | 'warn' | 'muted';
}) {
  return (
    <div className={cn(
      'rounded-2xl border p-4',
      tone === 'good' && 'border-emerald-500/20 bg-emerald-500/[0.055]',
      tone === 'warn' && 'border-amber-500/20 bg-amber-500/[0.055]',
      tone === 'muted' && 'border-white/[0.07] bg-white/[0.03]',
    )}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className={cn(
          'h-4 w-4',
          tone === 'good' && 'text-emerald-300',
          tone === 'warn' && 'text-amber-300',
          tone === 'muted' && 'text-slate-600',
        )} />
      </div>
      <p className="text-lg font-semibold capitalize text-white">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}
