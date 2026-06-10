'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Loader2,
  Monitor,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Settings,
  Signal,
  Smartphone,
  Voicemail,
} from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { InboundHistoryPanel } from '@/components/calls/inbound-history-panel';
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

function phoneStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'ready':
      return { label: 'Ready for calls', color: 'text-emerald-400' };
    case 'initializing':
      return { label: 'Connecting…', color: 'text-amber-400' };
    case 'error':
      return { label: 'Connection issue', color: 'text-red-400' };
    default:
      return { label: 'Starting up…', color: 'text-muted-foreground' };
  }
}

export default function InboundPage() {
  const { apiFetch } = useWorkspace();
  const { phoneStatus } = useWebPhone();
  const [stats, setStats] = useState<InboundStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch('/api/inbound/stats')
      .then((r) => r.json())
      .then((d: InboundStats) => setStats(d))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const ModeIcon = MODE_ICONS[stats?.inbound_mode as keyof typeof MODE_ICONS] ?? Monitor;
  const liveStatus = phoneStatusLabel(phoneStatus);

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Loading inbound hub…</p>
        </div>
      </main>
    );
  }

  if (!stats?.has_numbers) {
    return (
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-4xl">
          <PageHeader
            title="Inbound"
            description="Answer calls to your GrowthDialer numbers — screen-pop leads, route to browser or voicemail."
            icon={PhoneIncoming}
            badge="Hub"
          />
          <PremiumEmptyState
            icon={Phone}
            scene="numbers"
            title="Get a number to receive calls"
            description="Buy a local or toll-free number, then callers reach you in the browser with instant lead screen-pop."
            primaryAction={{ label: 'Buy a number', href: '/numbers' }}
            secondaryAction={{ label: 'Routing settings', href: '/settings?tab=calling' }}
            accent="cyan"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader
          title="Inbound"
          description="Live status, routing, and recent calls to your numbers."
          icon={PhoneIncoming}
          badge="Live"
        >
          <Link
            href="/settings?tab=calling"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary"
          >
            <Settings className="h-3.5 w-3.5" />
            Routing settings
          </Link>
        </PageHeader>

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
                  Routing mode
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
                    Rings {stats.inbound_ring_seconds}s before voicemail
                  </p>
                )}
              </div>
              <Link
                href="/settings?tab=calling"
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Change
              </Link>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Voice connection
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Signal className={cn('h-5 w-5', liveStatus.color)} />
                  <p className={cn('text-lg font-semibold', liveStatus.color)}>{liveStatus.label}</p>
                </div>
                {stats.inbound_mode === 'browser' && phoneStatus !== 'ready' && (
                  <p className="mt-1 text-xs text-amber-400/80">
                    Keep this tab open so inbound calls can ring in your browser.
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  phoneStatus === 'ready' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-pulse',
                )}
              />
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your inbound numbers
          </p>
          <div className="space-y-2">
            {stats.numbers.map((num) => (
              <div
                key={num.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-white">{fmtPhone(num.phone_number)}</p>
                  {num.label && (
                    <p className="text-[11px] text-muted-foreground truncate">{num.label}</p>
                  )}
                </div>
                {num.is_default && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Recent inbound calls</p>
              <p className="text-xs text-muted-foreground">Missed calls highlighted in red</p>
            </div>
            <Link
              href="/call-logs?filter=inbound"
              className="text-xs font-semibold text-primary hover:underline"
            >
              All logs
            </Link>
          </div>
          <InboundHistoryPanel />
        </SurfaceCard>
      </div>
    </main>
  );
}
