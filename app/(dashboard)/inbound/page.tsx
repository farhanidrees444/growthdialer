'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Loader2,
  Monitor,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  RefreshCw,
  Settings,
  Signal,
  Smartphone,
  Voicemail,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { InboundHistoryPanel } from '@/components/calls/inbound-history-panel';
import { InboundHealthPanel } from '@/components/inbound/inbound-health-panel';
import { InboundRingingHero } from '@/components/inbound/inbound-ringing-hero';
import { useInboundRinging } from '@/hooks/use-inbound-ringing';
import { cn } from '@/lib/utils';

interface PurchasedNumber {
  id: string;
  phone_number: string;
  is_default: boolean;
  status: string;
  label: string | null;
}

interface InboundStats {
  inbound_mode: string;
  inbound_mode_label: string;
  inbound_forward_number: string | null;
  inbound_ring_seconds: number;
  missed_call_notify: boolean;
  numbers: PurchasedNumber[];
  has_numbers: boolean;
  missed_count: number;
  today_inbound: number;
  answered_today: number;
  primary_number: string | null;
}

const MODE_ICONS = {
  browser: Monitor,
  forward: Smartphone,
  voicemail: Voicemail,
  off: PhoneOff,
} as const;

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function phoneStatusLabel(status: string): { label: string; color: string; pulse: boolean } {
  switch (status) {
    case 'ready':
      return { label: 'Live — ready for calls', color: 'text-emerald-400', pulse: true };
    case 'initializing':
      return { label: 'Connecting voice…', color: 'text-amber-400', pulse: true };
    case 'error':
      return { label: 'Voice offline', color: 'text-red-400', pulse: false };
    default:
      return { label: 'Starting voice…', color: 'text-muted-foreground', pulse: true };
  }
}

export default function InboundPage() {
  const session = useSupabaseSession();
  const userId = session?.user?.id;
  const { apiFetch } = useWorkspace();
  const { phoneStatus, reconnect } = useWebPhone();
  const { call: ringingCall, accept, decline, isRinging } = useInboundRinging(userId);

  const [stats, setStats] = useState<InboundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const loadStats = useCallback(() => {
    void apiFetch('/api/inbound/stats')
      .then((r) => r.json())
      .then((d: InboundStats) => setStats(d))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (!isRinging) return;
    const onEnd = () => {
      loadStats();
      setHistoryKey((k) => k + 1);
    };
    window.addEventListener('gd-call-ended', onEnd);
    return () => window.removeEventListener('gd-call-ended', onEnd);
  }, [isRinging, loadStats]);

  const handleSyncNumbers = async () => {
    setSyncing(true);
    try {
      await apiFetch('/api/numbers/sync', { method: 'POST' });
      loadStats();
    } finally {
      setSyncing(false);
    }
  };

  const copyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const ModeIcon = MODE_ICONS[stats?.inbound_mode as keyof typeof MODE_ICONS] ?? Monitor;
  const liveStatus = phoneStatusLabel(phoneStatus);
  const primaryNumber = stats?.primary_number ?? stats?.numbers[0]?.phone_number ?? null;

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400/50" />
          <p className="text-sm text-muted-foreground">Loading inbound command center…</p>
        </div>
      </main>
    );
  }

  if (!stats?.has_numbers) {
    return (
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <PageHeader
            title="Inbound"
            description="Your live line for incoming calls — screen-pop, routing, and voicemail."
            icon={PhoneIncoming}
            badge="Command Center"
          />
          <PremiumEmptyState
            icon={Phone}
            scene="numbers"
            title="Get a number to receive calls"
            description="Buy a local or toll-free number. When someone calls, you'll see them here instantly with lead screen-pop."
            primaryAction={{ label: 'Buy a number', href: '/numbers' }}
            secondaryAction={{ label: 'Sync existing numbers', href: '/numbers' }}
            accent="cyan"
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void handleSyncNumbers()}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-white transition disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync numbers from your account
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          title="Inbound"
          description="Your live line — keep this page open to receive calls in the browser."
          icon={PhoneIncoming}
          badge={phoneStatus === 'ready' ? 'Live' : 'Setup'}
        >
          <div className="flex flex-wrap items-center gap-2">
            {phoneStatus === 'error' && (
              <button
                type="button"
                onClick={reconnect}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reconnect voice
              </button>
            )}
            <Link
              href="/settings?tab=calling"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-cyan-500/30 hover:text-cyan-400"
            >
              <Settings className="h-3.5 w-3.5" />
              Routing
            </Link>
          </div>
        </PageHeader>

        {isRinging && ringingCall && (
          <InboundRingingHero call={ringingCall} onAccept={accept} onDecline={() => void decline()} />
        )}

        <InboundHealthPanel
          phoneReady={phoneStatus === 'ready'}
          onActivated={() => loadStats()}
        />

        {/* Hero number card */}
        {primaryNumber && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 sm:p-8"
          >
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-500/[0.08] blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">
                  Your inbound line
                </p>
                <p className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white tabular-nums">
                  {fmtPhone(primaryNumber)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share this number — calls ring here with instant caller ID and lead match.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyNumber(primaryNumber)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy number'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Today', value: stats.today_inbound, icon: PhoneIncoming, accent: 'text-cyan-400' },
            { label: 'Answered', value: stats.answered_today, icon: Phone, accent: 'text-emerald-400' },
            { label: 'Missed', value: stats.missed_count, icon: PhoneMissed, accent: 'text-red-400' },
            { label: 'Ring timeout', value: `${stats.inbound_ring_seconds}s`, icon: Voicemail, accent: 'text-violet-400' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SurfaceCard className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </p>
                  <kpi.icon className={cn('h-4 w-4', kpi.accent)} />
                </div>
                <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-white">
                  {kpi.value}
                </p>
              </SurfaceCard>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SurfaceCard variant="live" className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/80">
                  Routing
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ModeIcon className="h-5 w-5 text-cyan-400" />
                  <p className="text-lg font-semibold text-white">{stats.inbound_mode_label}</p>
                </div>
                {stats.inbound_mode === 'forward' && stats.inbound_forward_number && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Forwards to {fmtPhone(stats.inbound_forward_number)}
                  </p>
                )}
                {['browser', 'forward'].includes(stats.inbound_mode) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Voicemail after {stats.inbound_ring_seconds}s with no answer
                  </p>
                )}
              </div>
              <Link href="/settings?tab=calling" className="shrink-0 text-xs font-semibold text-cyan-400 hover:underline">
                Change
              </Link>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Browser voice
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Signal className={cn('h-5 w-5', liveStatus.color)} />
                  <p className={cn('text-lg font-semibold', liveStatus.color)}>{liveStatus.label}</p>
                </div>
                {stats.inbound_mode === 'browser' && phoneStatus !== 'ready' && (
                  <p className="mt-1 text-xs text-amber-400/80">
                    Stay on this page with mic allowed so calls can ring.
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'h-3 w-3 shrink-0 rounded-full',
                  phoneStatus === 'ready'
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                    : 'bg-amber-400 animate-pulse',
                  liveStatus.pulse && phoneStatus === 'ready' && 'animate-pulse',
                )}
              />
            </div>
          </SurfaceCard>
        </div>

        {stats.numbers.length > 1 && (
          <SurfaceCard className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              All inbound numbers
            </p>
            <div className="space-y-2">
              {stats.numbers.map((num) => (
                <div
                  key={num.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-white">{fmtPhone(num.phone_number)}</p>
                    {num.label && <p className="text-[11px] text-muted-foreground truncate">{num.label}</p>}
                  </div>
                  {num.is_default && (
                    <span className="shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Call activity</p>
              <p className="text-xs text-muted-foreground">Updates live when calls arrive</p>
            </div>
            <Link href="/call-logs?filter=inbound" className="text-xs font-semibold text-cyan-400 hover:underline">
              All logs →
            </Link>
          </div>
          <InboundHistoryPanel key={historyKey} live />
        </SurfaceCard>
      </div>
    </main>
  );
}
