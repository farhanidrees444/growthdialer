'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
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
  webhook_url: string | null;
}

interface Props {
  phoneReady: boolean;
}

export function InboundHealthPanel({ phoneReady }: Props) {
  const { apiFetch } = useWorkspace();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    void apiFetch('/api/inbound/health')
      .then((r) => r.json())
      .then((d: HealthData) => setHealth(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [apiFetch]);

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
          aria-label="Refresh health"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

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
      {health.webhook_url && (
        <p className="mt-3 text-[10px] text-white/25 font-mono break-all">
          Webhook: {health.webhook_url}
        </p>
      )}
    </div>
  );
}
