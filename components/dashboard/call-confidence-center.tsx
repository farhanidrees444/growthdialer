'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Loader2,
  Mic,
  PhoneCall,
  Radio,
  RefreshCw,
  Route,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { useWebPhone } from '@/contexts/webphone-context';
import { cn } from '@/lib/utils';

type ConfidenceStatus = 'healthy' | 'warning' | 'blocked' | 'unknown';

interface ConfidenceCheck {
  id: string;
  label: string;
  status: ConfidenceStatus;
  detail: string;
  action: string;
}

interface LastInboundCall {
  status: string | null;
  started_at: string | null;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  to_number: string | null;
}

interface LastCall {
  status: string | null;
  direction: string | null;
  created_at: string | null;
  duration_seconds: number | null;
  was_recorded: boolean;
  has_playable_recording: boolean;
  ai_processing_status: string | null;
  ai_error: string | null;
  hangup_cause: string | null;
}

interface CallConfidenceHealth {
  overall: ConfidenceStatus;
  checked_at: string;
  checks: ConfidenceCheck[];
  summary: {
    active_numbers: number;
    total_calls: number;
    playable_recordings: number;
    pending_storage_mirror: number;
    ai_pending_or_processing: number;
    ai_failed: number;
    ai_stuck_processing: number;
  };
  last_inbound_call: LastInboundCall | null;
  last_call: LastCall | null;
  next_action: string;
}

const STATUS_COPY: Record<ConfidenceStatus, { label: string; className: string; icon: LucideIcon }> = {
  healthy: {
    label: 'Ready',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    icon: CheckCircle2,
  },
  warning: {
    label: 'Needs check',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    icon: AlertTriangle,
  },
  blocked: {
    label: 'Blocked',
    className: 'border-red-500/25 bg-red-500/10 text-red-300',
    icon: XCircle,
  },
  unknown: {
    label: 'No signal yet',
    className: 'border-white/[0.10] bg-white/[0.04] text-slate-400',
    icon: Clock,
  },
};

const CHECK_ICONS: Record<string, LucideIcon> = {
  browser_voice: Mic,
  voice_service: PhoneCall,
  inbound_webhook: Route,
  last_inbound: Radio,
  recordings: ShieldCheck,
  ai_analysis: Brain,
};

function getOverall(checks: ConfidenceCheck[], serverOverall: ConfidenceStatus | null): ConfidenceStatus {
  if (checks.some((check) => check.status === 'blocked')) return 'blocked';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  if (serverOverall) return serverOverall;
  return 'unknown';
}

function formatCheckedAt(iso: string | null): string {
  if (!iso) return 'Not checked yet';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'No signal yet';
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return 'No duration';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function isHealthError(data: CallConfidenceHealth | { error?: string }): data is { error?: string } {
  return 'error' in data;
}

function statusBadge(status: ConfidenceStatus, className?: string) {
  const meta = STATUS_COPY[status];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', meta.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function useBrowserVoiceCheck(): ConfidenceCheck {
  const {
    phoneStatus,
    micPermission,
    voiceError,
    audioDeviceLabel,
    voiceQuality,
    iceConnectionState,
    staleTabWarning,
  } = useWebPhone();

  if (staleTabWarning) {
    return {
      id: 'browser_voice',
      label: 'Browser voice device',
      status: 'warning',
      detail: 'Another tab may own the active browser voice registration.',
      action: 'Keep one GrowthDialer tab open for calls, then reconnect voice.',
    };
  }

  if (micPermission === 'denied') {
    return {
      id: 'browser_voice',
      label: 'Browser voice device',
      status: 'blocked',
      detail: 'Microphone access is blocked in this browser.',
      action: 'Allow microphone access in browser settings, then reconnect voice.',
    };
  }

  if (phoneStatus === 'ready') {
    return {
      id: 'browser_voice',
      label: 'Browser voice device',
      status: 'healthy',
      detail: `${audioDeviceLabel ?? 'Default microphone'} is registered. Quality: ${voiceQuality}.`,
      action: iceConnectionState ? `Connection state: ${iceConnectionState}.` : 'Ready for inbound and outbound calls.',
    };
  }

  if (phoneStatus === 'error') {
    return {
      id: 'browser_voice',
      label: 'Browser voice device',
      status: 'blocked',
      detail: voiceError ?? 'Browser voice registration failed.',
      action: 'Use the reconnect control or refresh after checking microphone access.',
    };
  }

  return {
    id: 'browser_voice',
    label: 'Browser voice device',
    status: 'warning',
    detail: phoneStatus === 'initializing' ? 'Browser voice is still registering.' : 'Browser voice has not registered yet.',
    action: 'Keep this tab open and allow microphone access.',
  };
}

function CheckCard({ check }: { check: ConfidenceCheck }) {
  const Icon = CHECK_ICONS[check.id] ?? ShieldCheck;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
            <Icon className="h-4 w-4 text-cyan-300" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{check.label}</p>
            <div className="mt-1">{statusBadge(check.status)}</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">{check.detail}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{check.action}</p>
    </div>
  );
}

export function CallConfidenceCenter() {
  const { currentWorkspace, apiFetch } = useWorkspace();
  const [health, setHealth] = useState<CallConfidenceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const browserCheck = useBrowserVoiceCheck();

  const load = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/call-confidence/health');
      const data = await res.json() as CallConfidenceHealth | { error?: string };
      const healthError = isHealthError(data);
      if (!res.ok || healthError) {
        setError(healthError && data.error ? data.error : 'Could not load call confidence checks');
        return;
      }
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load call confidence checks');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, currentWorkspace?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const checks = useMemo(() => [browserCheck, ...(health?.checks ?? [])], [browserCheck, health?.checks]);
  const overall = getOverall(checks, health?.overall ?? null);
  const overallMeta = STATUS_COPY[overall];

  return (
    <section
      data-gsap-reveal
      className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(6,182,212,0.08),rgba(24,24,27,0.70)_42%,rgba(139,92,246,0.08))] shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(6,182,212,0.16),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(139,92,246,0.14),transparent_30%)]" />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">
                Production call confidence
              </p>
              {statusBadge(overall)}
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Call Confidence Center
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              One place to verify voice readiness, inbound routing, recordings, and AI analysis before a customer notices a gap.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-500">
              Checked {formatCheckedAt(health?.checked_at ?? null)}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/30 hover:text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Recheck
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-3">
            <p className="text-sm font-semibold text-red-300">Could not load confidence checks</p>
            <p className="mt-1 text-xs text-red-200/70">{error}</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <CheckCard key={check.id} check={check} />
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className={cn('rounded-2xl border p-4', overallMeta.className)}>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Next action</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {checks.find((check) => check.status === 'blocked')?.action
                ?? checks.find((check) => check.status === 'warning')?.action
                ?? health?.next_action
                ?? 'Run a test call and refresh this panel.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/incoming"
                className="rounded-lg border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
              >
                Incoming
              </Link>
              <Link
                href="/recordings"
                className="rounded-lg border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
              >
                Recordings
              </Link>
              <Link
                href="/settings?tab=calling"
                className="rounded-lg border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Last inbound route</p>
            <p className="mt-2 text-sm font-semibold capitalize text-white">
              {health?.last_inbound_call?.status?.replace(/_/g, ' ') ?? 'No inbound call yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(health?.last_inbound_call?.started_at)}
              {health?.last_inbound_call?.duration_seconds
                ? ` - ${formatDuration(health.last_inbound_call.duration_seconds)}`
                : ''}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Latest call pipeline</p>
            <p className="mt-2 text-sm font-semibold capitalize text-white">
              {health?.last_call?.status?.replace(/_/g, ' ') ?? 'No calls yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {health?.last_call
                ? `${health.last_call.was_recorded ? 'Recorded' : 'No recording'} - AI ${health.last_call.ai_processing_status ?? 'not started'}`
                : 'Start with a real test call.'}
            </p>
            {health?.last_call?.ai_error && (
              <p className="mt-2 line-clamp-2 text-[11px] text-amber-300/80">{health.last_call.ai_error}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
