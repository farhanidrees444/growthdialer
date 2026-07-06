'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  Copy,
  Check,
  Loader2,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Radio,
  RefreshCw,
  Settings,
  Signal,
  Users,
  Zap,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCalls } from '@/contexts/calls-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { InboundHistoryPanel } from '@/components/calls/inbound-history-panel';
import { PostCallCommandCenter } from '@/components/calls/post-call-command-center';
import { InboundHealthPanel } from '@/components/inbound/inbound-health-panel';
import { LiveWaveform } from '@/components/marketing/live-floor/LiveWaveform';
import { NumberBillingBadge } from '@/components/numbers/number-billing-badge';
import { withBillingMeta } from '@/lib/numbers/billing-lifecycle';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { CallLogRow } from '@/lib/calls/display';

interface PurchasedNumber {
  id: string;
  phone_number: string;
  is_default: boolean;
  status: string;
  label: string | null;
  next_billing_date?: string | null;
  stripe_subscription_id?: string | null;
  days_label?: string | null;
  is_expired?: boolean;
}

interface InboundStats {
  inbound_mode: string;
  inbound_mode_label: string;
  inbound_forward_number: string | null;
  inbound_ring_seconds: number;
  missed_call_notify: boolean;
  numbers: PurchasedNumber[];
  has_numbers: boolean;
  has_callable_numbers?: boolean;
  missed_count: number;
  today_inbound: number;
  answered_today: number;
  primary_number: string | null;
  primary_days_label?: string | null;
  primary_is_expired?: boolean;
}

interface FloorLogEntry {
  id: string;
  ts: string;
  label: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'violet';
}

function fmtPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function phoneStatusLabel(status: string): { label: string; color: string; pulse: boolean } {
  switch (status) {
    case 'ready':
      return { label: 'Ready - line live', color: 'text-emerald-400', pulse: true };
    case 'initializing':
      return { label: 'Connecting voice node...', color: 'text-amber-400', pulse: true };
    case 'error':
      return { label: 'Offline', color: 'text-red-400', pulse: false };
    default:
      return { label: 'Starting...', color: 'text-muted-foreground', pulse: true };
  }
}

function AgentVoiceNode({ phoneStatus, voiceError, onReconnect }: {
  phoneStatus: string;
  voiceError: string | null;
  onReconnect: () => void;
}) {
  const live = phoneStatusLabel(phoneStatus);
  const ready = phoneStatus === 'ready';

  return (
    <SurfaceCard variant="live" className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/90">
            Agent voice node
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={cn(
                'relative flex h-4 w-4 rounded-full',
                ready ? 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)]' : 'bg-amber-400',
                live.pulse && ready && 'animate-pulse',
              )}
            />
            <p className={cn('text-xl font-semibold tracking-tight', live.color)}>{live.label}</p>
          </div>
          {voiceError && phoneStatus === 'error' && (
            <p className="mt-2 max-w-md text-xs leading-relaxed text-red-300/90">{voiceError}</p>
          )}
        </div>
        <div className="flex h-14 items-end justify-center sm:w-40">
          <LiveWaveform bars={24} height={48} />
        </div>
      </div>
      {phoneStatus === 'error' && (
        <button
          type="button"
          onClick={onReconnect}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reconnect voice
        </button>
      )}
    </SurfaceCard>
  );
}

function FloorMatrix({ stats, activeRings }: { stats: InboundStats; activeRings: number }) {
  const ahtSec =
    stats.answered_today > 0
      ? Math.round((stats.today_inbound > 0 ? 180 : 0) / Math.max(stats.answered_today, 1))
      : 0;

  const tiles = [
    { label: 'Queue load', value: activeRings, icon: Radio, accent: 'text-cyan-400', sub: 'live rings' },
    { label: 'Concurrent', value: stats.today_inbound, icon: Users, accent: 'text-violet-400', sub: 'today inbound' },
    { label: 'AHT est.', value: ahtSec ? `${Math.floor(ahtSec / 60)}:${String(ahtSec % 60).padStart(2, '0')}` : '—', icon: Clock, accent: 'text-emerald-400', sub: 'avg handle' },
    { label: 'Answer rate', value: stats.today_inbound ? `${Math.round((stats.answered_today / stats.today_inbound) * 100)}%` : '—', icon: Activity, accent: 'text-amber-400', sub: 'today' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <SurfaceCard className="border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <t.icon className={cn('h-4 w-4', t.accent)} />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-white">{t.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t.sub}</p>
          </SurfaceCard>
        </motion.div>
      ))}
    </div>
  );
}

function TrafficFeed({ logs }: { logs: FloorLogEntry[] }) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-sm font-semibold text-white">Real-time traffic feed</p>
        <p className="text-xs text-muted-foreground">Live workspace events and call signals</p>
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <li className="px-5 py-8 text-center text-xs text-muted-foreground">Listening for traffic...</li>
          ) : (
            logs.map((row) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-5 py-3 text-xs"
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    row.tone === 'cyan' && 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
                    row.tone === 'emerald' && 'bg-emerald-400',
                    row.tone === 'amber' && 'bg-amber-400',
                    row.tone === 'violet' && 'bg-violet-400',
                  )}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{row.ts}</span>
                <span className="text-white/80">{row.label}</span>
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ul>
    </SurfaceCard>
  );
}

export function IncomingPageClient() {
  const { apiFetch } = useWorkspace();
  const { isRinging } = useCalls();
  const { phoneStatus, reconnect, voiceError, callStatus, voiceQuality, hasInboundActiveSession } = useWebPhone();

  const [stats, setStats] = useState<InboundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [logs, setLogs] = useState<FloorLogEntry[]>([]);
  const [lastWrapUpAt, setLastWrapUpAt] = useState<string | null>(null);
  const [lastWrapUpCall, setLastWrapUpCall] = useState<CallLogRow | null>(null);
  const [wrapUpLoading, setWrapUpLoading] = useState(false);
  const logIdRef = useRef(0);

  const pushLog = useCallback((label: string, tone: FloorLogEntry['tone'] = 'cyan') => {
    const id = `log-${++logIdRef.current}`;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [{ id, ts, label, tone }, ...prev].slice(0, 40));
  }, []);

  const loadStats = useCallback(() => {
    void apiFetch('/api/inbound/stats')
      .then((r) => r.json())
      .then((d: InboundStats) => setStats(d))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const loadLatestWrapUpCall = useCallback(async () => {
    setWrapUpLoading(true);
    try {
      const res = await apiFetch('/api/calls/logs?direction=inbound&limit=1');
      const data = await res.json() as { calls?: CallLogRow[] };
      setLastWrapUpCall(data.calls?.[0] ?? null);
    } catch {
      setLastWrapUpCall(null);
    } finally {
      setWrapUpLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`incoming-numbers-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'purchased_numbers', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as PurchasedNumber;
            if (!row?.id) return;
            const merged = withBillingMeta(row);
            setStats((prev) => {
              if (!prev) return prev;
              const numbers = prev.numbers.map((n) =>
                n.id === row.id ? { ...n, ...merged } : n,
              );
              const primary = numbers.find((n) => n.is_default) ?? numbers[0] ?? null;
              return {
                ...prev,
                numbers,
                primary_number: primary?.phone_number ?? prev.primary_number,
                primary_days_label: primary?.days_label ?? null,
                primary_is_expired: primary?.is_expired ?? false,
              };
            });
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    pushLog('Incoming channel subscribed', 'violet');
    const supabase = createClient();
    const channel = supabase
      .channel('incoming-page-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `direction=eq.inbound` },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown>;
          const status = (row.status as string) ?? 'update';
          pushLog(`incoming call ${status}`, status === 'active' || status === 'completed' ? 'emerald' : 'cyan');
          loadStats();
          setHistoryKey((k) => k + 1);
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [loadStats, pushLog]);

  useEffect(() => {
    if (isRinging) pushLog('Inbound ring - overlay active', 'amber');
  }, [isRinging, pushLog]);

  useEffect(() => {
    if (hasInboundActiveSession && callStatus === 'active') {
      pushLog('Inbound call connected', 'emerald');
    }
  }, [hasInboundActiveSession, callStatus, pushLog]);

  useEffect(() => {
    if (callStatus === 'active') pushLog(`Voice session ${voiceQuality}`, 'emerald');
  }, [callStatus, voiceQuality, pushLog]);

  useEffect(() => {
    const onEnd = () => {
      loadStats();
      setHistoryKey((k) => k + 1);
      setLastWrapUpAt(new Date().toISOString());
      void loadLatestWrapUpCall();
      pushLog('Call session ended', 'violet');
    };
    window.addEventListener('gd-call-ended', onEnd);
    return () => window.removeEventListener('gd-call-ended', onEnd);
  }, [loadLatestWrapUpCall, loadStats, pushLog]);

  const copyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const primaryNumber = stats?.primary_number ?? stats?.numbers[0]?.phone_number ?? null;
  const primaryLine = stats?.numbers.find((n) => n.phone_number === primaryNumber)
    ?? stats?.numbers.find((n) => n.is_default)
    ?? stats?.numbers[0]
    ?? null;
  const activeRings = isRinging ? 1 : 0;

  const saveLatestCallNotes = async (notes: string) => {
    if (!lastWrapUpCall) return;
    const res = await apiFetch(`/api/calls/${lastWrapUpCall.id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save call notes');
    setLastWrapUpCall((prev) => prev ? { ...prev, notes } : prev);
    setHistoryKey((k) => k + 1);
  };

  const saveLatestCallDisposition = async (
    disposition: string,
    notes: string,
    dates?: { callbackAt?: string; meetingAt?: string },
  ) => {
    if (!lastWrapUpCall) return;
    const res = await apiFetch(`/api/calls/${lastWrapUpCall.id}/disposition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disposition,
        notes,
        callback_at: dates?.callbackAt,
        meeting_at: dates?.meetingAt,
      }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save disposition');
    setLastWrapUpCall((prev) => prev ? { ...prev, disposition, notes } : prev);
    setHistoryKey((k) => k + 1);
    loadStats();
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400/50" />
          <p className="text-sm text-muted-foreground">Initializing Incoming...</p>
        </div>
      </main>
    );
  }

  if (!stats?.has_numbers) {
    return (
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <PageHeader
            title="Incoming"
            description="Command center for inbound traffic, agent voice status, and real-time call intelligence."
            icon={Radio}
            badge="Command Center"
          />
          <PremiumEmptyState
            icon={Phone}
            scene="numbers"
            title="Claim a line before receiving calls"
            description="Inbound works when a number is active, routed to your workspace, and browser voice is ready. Keep this page open once setup is complete."
            primaryAction={{ label: 'Claim number', href: '/numbers' }}
            secondaryAction={{ label: 'Call routing', href: '/settings?tab=calling' }}
            features={[
              { icon: Phone, label: 'Active number' },
              { icon: Radio, label: 'Browser voice ready' },
              { icon: Settings, label: 'Routing confirmed' },
            ]}
            accent="cyan"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader
          title="Incoming"
          description="Real-time inbound command center - keep this page open to receive browser-routed calls."
          icon={Radio}
          badge={phoneStatus === 'ready' ? 'Live' : 'Setup'}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/settings?tab=calling"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-cyan-500/30 hover:text-cyan-400"
            >
              <Settings className="h-3.5 w-3.5" />
              Routing
            </Link>
            <button
              type="button"
              onClick={() => { loadStats(); pushLog('Manual stats refresh', 'violet'); }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </PageHeader>

        {isRinging && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] px-4 py-3"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>
            <p className="text-sm font-medium text-cyan-100/90">
              Incoming call - accept in the persistent overlay
            </p>
          </motion.div>
        )}

        {lastWrapUpAt && !isRinging && !hasInboundActiveSession && (
          wrapUpLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-cyan-500/[0.05] p-4 text-sm text-emerald-100/80"
            >
              <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
              Loading latest call wrap-up...
            </motion.div>
          ) : lastWrapUpCall ? (
            <PostCallCommandCenter
              compact
              call={{
                id: lastWrapUpCall.id,
                leadName: lastWrapUpCall.leads?.name ?? fmtPhone(lastWrapUpCall.from_number),
                company: lastWrapUpCall.leads?.company ?? null,
                phone: lastWrapUpCall.leads?.phone ?? lastWrapUpCall.from_number,
                direction: lastWrapUpCall.direction,
                startedAt: lastWrapUpCall.started_at,
                durationSeconds: lastWrapUpCall.duration_seconds,
                disposition: lastWrapUpCall.disposition,
                notes: lastWrapUpCall.notes,
                recordingUrl: lastWrapUpCall.recording_url,
                transcript: lastWrapUpCall.transcript,
                aiProcessingStatus: lastWrapUpCall.ai_processing_status,
                aiError: lastWrapUpCall.ai_error,
                analytics: {
                  summary: lastWrapUpCall.ai_summary,
                  sentiment: lastWrapUpCall.ai_sentiment,
                  sentiment_score: lastWrapUpCall.ai_sentiment_score,
                  next_steps: lastWrapUpCall.ai_next_steps,
                },
              }}
              recordingHref={lastWrapUpCall.recording_url ? `/recordings/${lastWrapUpCall.id}` : null}
              onOpenTranscript={lastWrapUpCall.recording_url ? () => { window.location.href = `/recordings/${lastWrapUpCall.id}`; } : undefined}
              onSaveNotes={saveLatestCallNotes}
              onSaveDisposition={saveLatestCallDisposition}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-cyan-500/[0.05] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Inbound call wrapped</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review the latest call, add notes or disposition, and confirm recording/AI status after calls over 30 seconds.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/call-logs?filter=inbound"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
                  >
                    <PhoneIncoming className="h-3.5 w-3.5" />
                    Open call log
                  </Link>
                  <Link
                    href="/recordings"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    Check recording
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setLastWrapUpAt(null);
                      setLastWrapUpCall(null);
                    }}
                    className="inline-flex items-center rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )
        )}

        <AgentVoiceNode phoneStatus={phoneStatus} voiceError={voiceError} onReconnect={reconnect} />

        <FloorMatrix stats={stats} activeRings={activeRings} />

        {primaryNumber && (
          <SurfaceCard variant="live" className="relative overflow-hidden p-6">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/[0.08] blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/90">Primary line</p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-white">{fmtPhone(primaryNumber)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stats.inbound_mode_label}</p>
                {primaryLine && (
                  <div className="mt-3">
                    <NumberBillingBadge
                      num={primaryLine}
                      onExtend={async () => {
                        const res = await apiFetch(`/api/numbers/${primaryLine.id}/extend`, { method: 'POST' });
                        const data = await res.json() as { error?: string; next_billing_date?: string };
                        if (data.error) throw new Error(data.error);
                        setStats((prev) => {
                          if (!prev) return prev;
                          const numbers = prev.numbers.map((n) =>
                            n.id === primaryLine.id
                              ? withBillingMeta({ ...n, next_billing_date: data.next_billing_date ?? n.next_billing_date })
                              : n,
                          );
                          const primary = numbers.find((n) => n.id === primaryLine.id) ?? numbers[0];
                          return {
                            ...prev,
                            numbers,
                            primary_days_label: primary?.days_label ?? null,
                            primary_is_expired: primary?.is_expired ?? false,
                          };
                        });
                      }}
                    />
                  </div>
                )}
                {stats.primary_is_expired && (
                  <p className="mt-2 text-xs text-red-300/90">Line expired — extend to restore outbound calling.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void copyNumber(primaryNumber)}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy line'}
              </button>
            </div>
          </SurfaceCard>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <InboundHealthPanel phoneReady={phoneStatus === 'ready'} onActivated={() => loadStats()} />
            <SurfaceCard className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Call activity</p>
                  <p className="text-xs text-muted-foreground">Streaming from workspace</p>
                </div>
                <Link href="/call-logs?filter=inbound" className="text-xs font-semibold text-cyan-400 hover:underline">
                  All logs →
                </Link>
              </div>
              <InboundHistoryPanel key={historyKey} live />
            </SurfaceCard>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <TrafficFeed logs={logs} />
            <SurfaceCard className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: 'Inbound', value: stats.today_inbound, icon: PhoneIncoming },
                  { label: 'Answered', value: stats.answered_today, icon: Phone },
                  { label: 'Missed', value: stats.missed_count, icon: PhoneMissed },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <k.icon className="mx-auto h-4 w-4 text-cyan-400/80" />
                    <p className="mt-2 font-display text-lg font-semibold text-white">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground">{k.label}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Network posture</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Connection recovery and edge routing are active on voice sessions. Quality: <span className="text-emerald-400">{voiceQuality}</span>
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-violet-300/80">
                <Zap className="h-3 w-3" />
                Optimized for global agent routing
              </p>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </main>
  );
}
