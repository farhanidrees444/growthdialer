'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Zap } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';

interface HealthCheck {
  id: string;
  label: string;
  ok: boolean;
  hint?: string;
}

interface HealthData {
  ready: boolean;
  score: number;
  total: number;
  checks: HealthCheck[];
  primary_number: string | null;
  last_inbound_at: string | null;
  inbound_mode: string;
  needs_activation?: boolean;
  unrouted_count?: number;
  routed_count?: number;
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
  const autoActivateTried = useRef(false);

  const load = () => {
    setLoading(true);
    void apiFetch('/api/inbound/health')
      .then((r) => r.json())
      .then((d: HealthData) => setHealth(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [apiFetch]);

  useEffect(() => {
    if (!health?.needs_activation || autoActivateTried.current || activating) return;
    autoActivateTried.current = true;
    void handleActivate();
  }, [health?.needs_activation]);

  const handleActivate = async () => {
    setActivating(true);
    setActivateMsg(null);
    try {
      const res = await apiFetch('/api/inbound/activate-routing', { method: 'POST' });
      const data = await res.json() as { message?: string; activated?: number };
      setActivateMsg(data.message ?? 'Inbound routing updated.');
      load();
      if ((data.activated ?? 0) > 0) onActivated?.();
    } catch {
      setActivateMsg('Could not activate inbound routing. Try again or contact support.');
    } finally {
      setActivating(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking inbound readiness…
      </div>
    );
  }

  if (!health) return null;

  const failedChecks = health.checks.filter((c) => !c.ok);
  const allGood = health.ready && phoneReady && failedChecks.length === 0;

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 sm:px-5',
        allGood
          ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
          : 'border-amber-500/25 bg-amber-500/[0.05]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {allGood ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          )}
          <div>
            <p className={cn('text-sm font-semibold', allGood ? 'text-emerald-300' : 'text-amber-300')}>
              {allGood ? 'Inbound line is live — ready to receive calls' : 'Inbound setup needs attention'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {health.score}/{health.total} checks passed
              {health.last_inbound_at
                ? ` · Last call ${new Date(health.last_inbound_at).toLocaleString()}`
                : ' · No inbound calls logged yet'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 rounded-lg border border-white/[0.08] p-2 text-muted-foreground hover:text-white transition"
          aria-label="Refresh status"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {health.needs_activation && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">
              {health.unrouted_count ?? 0} number{(health.unrouted_count ?? 0) !== 1 ? 's' : ''} not linked to inbound
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One tap links your numbers so calls ring in the browser.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleActivate()}
            disabled={activating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Activate inbound
          </button>
        </div>
      )}

      {activateMsg && (
        <p className="mt-3 text-xs text-cyan-300/90">{activateMsg}</p>
      )}

      {(failedChecks.length > 0 || !phoneReady) && (
        <ul className="mt-3 space-y-1.5">
          {!phoneReady && (
            <li className="flex items-start gap-2 text-xs text-amber-400/90">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              Voice connection not ready — keep this tab open
            </li>
          )}
          {failedChecks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-xs text-amber-300/90">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span><strong className="font-semibold">{c.label}:</strong> {c.hint ?? 'Not configured'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
