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
import { useSiteTheme } from '@/components/theme/site-theme';
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

const STATUS_BADGE_LIGHT: Record<ConfidenceStatus, string> = {
  healthy: 'border-emerald-600/25 bg-emerald-600/[0.08] text-emerald-700',
  warning: 'border-amber-600/25 bg-amber-600/[0.08] text-amber-700',
  blocked: 'border-red-600/25 bg-red-600/[0.08] text-red-700',
  unknown: 'border-zinc-950/[0.10] bg-zinc-950/[0.03] text-zinc-500',
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

function statusBadge(status: ConfidenceStatus, className?: string, isDark = true) {
  const meta = STATUS_COPY[status];
  const badgeClass = isDark ? meta.className : STATUS_BADGE_LIGHT[status];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', badgeClass, className)}>
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
  const { isDark } = useSiteTheme();

  return (
    <div className="dash-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            isDark
              ? "border-white/[0.07] bg-white/[0.04]"
              : "border-zinc-950/[0.08] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.06)]",
          )}>
            <Icon className={cn("h-4 w-4", isDark ? "text-cyan-300" : "text-cyan-600")} />
          </span>
          <div>
            <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-zinc-900")}>{check.label}</p>
            <div className="mt-1">{statusBadge(check.status, undefined, isDark)}</div>
          </div>
        </div>
      </div>
      <p className={cn("mt-3 text-xs leading-relaxed", isDark ? "text-slate-400" : "text-zinc-500")}>{check.detail}</p>
      <p className={cn("mt-2 text-[11px] leading-relaxed", isDark ? "text-slate-500" : "text-zinc-500")}>{check.action}</p>
    </div>
  );
}

export function CallConfidenceCenter() {
  const { apiFetch } = useWorkspace();
  const { isDark } = useSiteTheme();
  const [health, setHealth] = useState<CallConfidenceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const browserCheck = useBrowserVoiceCheck();

  const load = useCallback(async () => {
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
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const checks = useMemo(() => [browserCheck, ...(health?.checks ?? [])], [browserCheck, health?.checks]);
  const overall = getOverall(checks, health?.overall ?? null);
  const overallMeta = STATUS_COPY[overall];
  const nextActionLinkClass = isDark
    ? "rounded-lg border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
    : "rounded-lg border border-zinc-950/[0.10] bg-zinc-950/[0.04] px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-950/[0.08]";

  return (
    <section
      data-gsap-reveal
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border backdrop-blur-xl",
        isDark
          ? "border-white/[0.08] bg-[linear-gradient(135deg,rgba(6,182,212,0.08),rgba(24,24,27,0.70)_42%,rgba(139,92,246,0.08))] shadow-[0_20px_70px_rgba(0,0,0,0.34)]"
          : "border-zinc-950/[0.07] bg-[linear-gradient(135deg,rgba(6,182,212,0.10),rgba(255,255,255,0.85)_50%,rgba(139,92,246,0.10))] shadow-[0_20px_60px_-20px_rgba(76,29,149,0.15),0_2px_6px_rgba(9,9,11,0.04)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(6,182,212,0.16),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(139,92,246,0.14),transparent_30%)]" />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn(
                "text-[11px] font-bold uppercase tracking-[0.18em]",
                isDark ? "text-cyan-300/80" : "text-cyan-700",
              )}>
                Production call confidence
              </p>
              {statusBadge(overall, undefined, isDark)}
            </div>
            <h2 className={cn("mt-2 text-lg font-semibold tracking-tight sm:text-xl", isDark ? "text-white" : "text-zinc-950")}>
              Call Confidence Center
            </h2>
            <p className={cn("mt-1 max-w-2xl text-sm leading-relaxed", isDark ? "text-slate-400" : "text-zinc-500")}>
              One place to verify voice readiness, inbound routing, recordings, and AI analysis before a customer notices a gap.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "rounded-full border px-3 py-1.5 text-[11px]",
              isDark
                ? "border-white/[0.08] bg-white/[0.03] text-slate-500"
                : "border-zinc-950/[0.08] bg-white/70 text-zinc-500",
            )}>
              Checked {formatCheckedAt(health?.checked_at ?? null)}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="dash-btn-ghost px-3.5! py-2! text-xs!"
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
          <div className={cn(
            'rounded-2xl border p-4',
            isDark ? overallMeta.className : STATUS_BADGE_LIGHT[overall],
          )}>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Next action</p>
            <p className={cn("mt-2 text-sm font-semibold", isDark ? "text-white" : "text-zinc-950")}>
              {checks.find((check) => check.status === 'blocked')?.action
                ?? checks.find((check) => check.status === 'warning')?.action
                ?? health?.next_action
                ?? 'Run a test call and refresh this panel.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/incoming" className={nextActionLinkClass}>
                Incoming
              </Link>
              <Link href="/recordings" className={nextActionLinkClass}>
                Recordings
              </Link>
              <Link href="/settings?tab=calling" className={nextActionLinkClass}>
                Settings
              </Link>
            </div>
          </div>

          <div className="dash-card p-4">
            <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-zinc-500")}>Last inbound route</p>
            <p className={cn("mt-2 text-sm font-semibold capitalize", isDark ? "text-white" : "text-zinc-900")}>
              {health?.last_inbound_call?.status?.replace(/_/g, ' ') ?? 'No inbound call yet'}
            </p>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-zinc-500")}>
              {formatDateTime(health?.last_inbound_call?.started_at)}
              {health?.last_inbound_call?.duration_seconds
                ? ` - ${formatDuration(health.last_inbound_call.duration_seconds)}`
                : ''}
            </p>
          </div>

          <div className="dash-card p-4">
            <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-zinc-500")}>Latest call pipeline</p>
            <p className={cn("mt-2 text-sm font-semibold capitalize", isDark ? "text-white" : "text-zinc-900")}>
              {health?.last_call?.status?.replace(/_/g, ' ') ?? 'No calls yet'}
            </p>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-zinc-500")}>
              {health?.last_call
                ? `${health.last_call.was_recorded ? 'Recorded' : 'No recording'} - AI ${health.last_call.ai_processing_status ?? 'not started'}`
                : 'Start with a real test call.'}
            </p>
            {health?.last_call?.ai_error && (
              <p className={cn("mt-2 line-clamp-2 text-[11px]", isDark ? "text-amber-300/80" : "text-amber-700")}>{health.last_call.ai_error}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
