'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Input } from '@/components/ui/input';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { CallLogRowCard } from '@/components/calls/call-log-row';
import type { CallLogRow } from '@/lib/calls/display';
import { getCounterparty } from '@/lib/calls/display';
import { cn } from '@/lib/utils';

type DirectionFilter = 'all' | 'inbound' | 'outbound';
type StatusFilter = 'all' | 'missed' | 'connected';

interface CallStats {
  todayTotal: number;
  inboundToday: number;
  outboundToday: number;
  missedToday: number;
  connectedToday: number;
  connectRate: number;
}

const TABS: { id: DirectionFilter; label: string; icon: typeof PhoneIncoming }[] = [
  { id: 'all', label: 'All calls', icon: Clock },
  { id: 'inbound', label: 'Inbound', icon: PhoneIncoming },
  { id: 'outbound', label: 'Outbound', icon: PhoneOutgoing },
];

export default function CallLogsPage() {
  const searchParams = useSearchParams();
  const { apiFetch } = useWorkspace();
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [calls, setCalls] = useState<CallLogRow[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f === 'inbound') setDirection('inbound');
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '60' });
      if (direction !== 'all') params.set('direction', direction);
      if (statusFilter !== 'all') params.set('filter', statusFilter);
      const res = await apiFetch(`/api/calls/logs?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { calls: CallLogRow[]; stats: CallStats };
      setCalls(data.calls ?? []);
      setStats(data.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, direction, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const filtered = search.trim()
    ? calls.filter((c) => {
        const q = search.toLowerCase();
        const name = getCounterparty(c).toLowerCase();
        const nums = `${c.from_number ?? ''} ${c.to_number ?? ''}`.toLowerCase();
        return name.includes(q) || nums.includes(q) || (c.leads?.company?.toLowerCase().includes(q) ?? false);
      })
    : calls;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Call Logs"
          description="Every inbound and outbound call — who called, how long, what happened, and where the recording lives."
          icon={PhoneOutgoing}
          badge="Live"
        />

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Today" value={stats.todayTotal} sub="total calls" />
            <StatCard label="Inbound" value={stats.inboundToday} sub="today" accent="cyan" />
            <StatCard label="Outbound" value={stats.outboundToday} sub="today" accent="violet" />
            <StatCard
              label="Connect rate"
              value={`${stats.connectRate}%`}
              sub={`${stats.missedToday} missed`}
              icon={TrendingUp}
            />
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDirection(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  direction === id
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-white',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['all', 'connected', 'missed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize border transition',
                  statusFilter === f
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-white/[0.08] text-muted-foreground hover:text-white',
                )}
              >
                {f === 'all' ? 'Any status' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, number, or company…"
            className="pl-9 bg-white/[0.04] border-white/[0.08]"
          />
        </div>

        {loading && (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading call history…</p>
        )}

        {!loading && filtered.length === 0 && (
          <PremiumEmptyState
            icon={PhoneMissed}
            title="No calls match"
            description={
              direction === 'inbound'
                ? 'Inbound calls to your numbers will appear here with direction, duration, and recording links.'
                : 'Start dialing from the AI Dialer — every call logs automatically with disposition and AI analysis.'
            }
            primaryAction={{ label: 'Open dialer', href: '/dialer' }}
            secondaryAction={{ label: 'Inbound settings', href: '/settings?tab=calling' }}
            accent="cyan"
          />
        )}

        <div className="space-y-2">
          {filtered.map((call, i) => (
            <CallLogRowCard key={call.id} call={call} index={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = 'default',
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  accent?: 'default' | 'cyan' | 'violet';
  icon?: typeof TrendingUp;
}) {
  const variant = accent === 'cyan' ? 'live' : accent === 'violet' ? 'violet' : 'default';
  return (
    <SurfaceCard variant={variant} className="p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums text-white mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </SurfaceCard>
  );
}
