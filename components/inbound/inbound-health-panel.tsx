'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';

type InboundStatus = 'live' | 'almost_ready' | 'needs_setup' | 'offline';

interface InboundBlocker {
  code: string;
  label: string;
  fix: string;
}

interface HealthData {
  status: InboundStatus;
  ready: boolean;
  headline: string;
  subline: string;
  action: { type: 'activate_routing'; label: string } | null;
  primary_number: string | null;
  last_inbound_at: string | null;
  needs_activation?: boolean;
  unrouted_count?: number;
  routed_count?: number;
  blockers?: InboundBlocker[];
}

interface Props {
  phoneReady: boolean;
  onActivated?: () => void;
}

export function InboundHealthPanel({ phoneReady }: Props) {
  const { apiFetch } = useWorkspace();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    void apiFetch('/api/inbound/health')
      .then((r) => r.json())
      .then((d: HealthData) => setHealth(d))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    const onPrepared = () => { load(); };
    window.addEventListener('gd-voice-account-prepared', onPrepared);
    return () => window.removeEventListener('gd-voice-account-prepared', onPrepared);
  }, [load]);

  const activateRouting = useCallback(() => {
    setActivating(true);
    void apiFetch('/api/voice/prepare', { method: 'POST' })
      .then(() => load())
      .finally(() => setActivating(false));
  }, [apiFetch, load]);

  if (loading && !health) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent px-5 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400/70" />
        <p className="text-sm text-muted-foreground">Preparing your inbound line…</p>
      </div>
    );
  }

  if (!health) return null;

  const isLive = health.ready && phoneReady && health.status === 'live';

  if (isLive) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.1] via-emerald-500/[0.04] to-transparent px-5 py-3.5">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-100">Inbound line is live</p>
              <p className="text-xs text-emerald-200/60 truncate">
                {health.primary_number ? `Receiving on ${health.primary_number}` : 'Ready for calls in the browser'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300/80 hover:text-emerald-200 transition disabled:opacity-50"
            aria-label="Refresh status"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border px-5 py-4 sm:py-5',
        health.status === 'offline'
          ? 'border-red-500/20 bg-gradient-to-br from-red-500/[0.08] to-transparent'
          : 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-violet-500/[0.04] to-transparent',
      )}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold sm:text-base text-white">{health.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {health.subline}
              {health.last_inbound_at && (
                <span className="block mt-1 text-white/35">
                  Last call {new Date(health.last_inbound_at).toLocaleString()}
                </span>
              )}
            </p>
            {!phoneReady && health.status !== 'offline' && (
              <p className="mt-2 text-xs text-amber-400/90">
                Voice is connecting — keep this tab open with microphone access allowed.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-muted-foreground hover:text-white transition disabled:opacity-50"
          aria-label="Refresh status"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {(health.blockers?.length ?? 0) > 0 && (
        <ul className="relative mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3">
          {health.blockers!.slice(0, 3).map((b) => (
            <li key={b.code} className="text-xs leading-relaxed">
              <span className="font-medium text-amber-100/90">{b.label}</span>
              <span className="text-white/45"> — {b.fix}</span>
            </li>
          ))}
        </ul>
      )}

      {health.action?.type === 'activate_routing' && (
        <button
          type="button"
          onClick={activateRouting}
          disabled={activating || loading}
          className="relative mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {activating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {health.action.label}
        </button>
      )}
    </div>
  );
}
