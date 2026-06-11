'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, Sparkles, Zap } from 'lucide-react';
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

export function InboundHealthPanel({ phoneReady, onActivated }: Props) {
  const { apiFetch } = useWorkspace();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState<string | null>(null);
  const autoSetupTried = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    void apiFetch('/api/inbound/health')
      .then((r) => r.json())
      .then((d: HealthData) => setHealth(d))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const handleActivate = useCallback(async () => {
    setActivating(true);
    setActivateMsg(null);
    try {
      const res = await apiFetch('/api/inbound/activate-routing', { method: 'POST' });
      const data = await res.json() as { message?: string; activated?: number; primary_routed?: boolean };
      setActivateMsg(data.message ?? 'Numbers linked to your voice line.');
      load();
      if ((data.activated ?? 0) > 0 || data.primary_routed) onActivated?.();
      return data;
    } catch {
      setActivateMsg('Could not link your numbers. Try again in a moment.');
      return null;
    } finally {
      setActivating(false);
    }
  }, [apiFetch, load, onActivated]);

  const runPrepare = useCallback(async () => {
    setActivating(true);
    setActivateMsg(null);
    try {
      const res = await apiFetch('/api/inbound/prepare', { method: 'POST' });
      const data = await res.json() as { message?: string; primary_routed?: boolean; routing_activated?: number };
      setActivateMsg(data.message ?? 'Line setup refreshed.');
      load();
      if (data.primary_routed) onActivated?.();
      return data;
    } catch {
      setActivateMsg('Could not refresh your line setup. Try again.');
      return null;
    } finally {
      setActivating(false);
    }
  }, [apiFetch, load, onActivated]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoSetupTried.current || activating) return;
    autoSetupTried.current = true;

    void (async () => {
      await runPrepare();
      const refreshed = await apiFetch('/api/inbound/health').then((r) => r.json()) as HealthData;
      setHealth(refreshed);
      if (refreshed.needs_activation) {
        await handleActivate();
      }
    })();
  }, [activating, runPrepare, handleActivate, apiFetch]);

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
  const showAction = health.action?.type === 'activate_routing' && (health.needs_activation || activating);

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
            {activating ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            ) : (
              <Sparkles className="h-5 w-5 text-cyan-400" />
            )}
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

      {showAction && (
        <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5">
          <p className="text-xs text-muted-foreground">
            {activating
              ? 'Linking your numbers to your voice line…'
              : `${health.unrouted_count ?? 0} number${(health.unrouted_count ?? 0) === 1 ? '' : 's'} waiting to be linked`}
          </p>
          <button
            type="button"
            onClick={() => void (health.needs_activation ? handleActivate() : runPrepare())}
            disabled={activating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-60"
          >
            {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {health.action?.label ?? 'Link numbers for inbound'}
          </button>
        </div>
      )}

      {activateMsg && (
        <p className="relative mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
          {activateMsg}
        </p>
      )}

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
    </div>
  );
}
