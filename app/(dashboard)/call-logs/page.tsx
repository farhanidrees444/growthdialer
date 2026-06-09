'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  TrendingUp,
  Clock,
  RefreshCw,
  BarChart2,
  Phone,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { Input } from '@/components/ui/input';
import { CallLogRowCard } from '@/components/calls/call-log-row';
import type { CallLogRow, CallDateGroup } from '@/lib/calls/display';
import {
  getCounterparty,
  callDateGroup,
  DATE_GROUP_ORDER,
  DATE_GROUP_LABELS,
} from '@/lib/calls/display';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  { id: 'all', label: 'All', icon: Clock },
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f === 'inbound') setDirection('inbound');
  }, [searchParams]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: '80' });
      if (direction !== 'all') params.set('direction', direction);
      if (statusFilter !== 'all') params.set('filter', statusFilter);
      const res = await apiFetch(`/api/calls/logs?${params}`);
      const data = await res.json() as { calls?: CallLogRow[]; stats?: CallStats; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not load call logs');
        return;
      }
      setCalls(data.calls ?? []);
      setStats(data.stats ?? null);
    } catch {
      toast.error('Could not load call logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch, direction, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return calls;
    const q = search.toLowerCase();
    return calls.filter((c) => {
      const name = getCounterparty(c).toLowerCase();
      const nums = `${c.from_number ?? ''} ${c.to_number ?? ''}`.toLowerCase();
      return name.includes(q) || nums.includes(q) || (c.leads?.company?.toLowerCase().includes(q) ?? false);
    });
  }, [calls, search]);

  const grouped = useMemo(() => {
    const map = new Map<CallDateGroup, CallLogRow[]>();
    for (const g of DATE_GROUP_ORDER) map.set(g, []);
    for (const call of filtered) {
      const g = callDateGroup(call.started_at ?? call.created_at);
      map.get(g)!.push(call);
    }
    return DATE_GROUP_ORDER
      .map((g) => ({ group: g, calls: map.get(g)! }))
      .filter((s) => s.calls.length > 0);
  }, [filtered]);

  let rowIndex = 0;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Call Logs"
          description="Every inbound and outbound call — duration, disposition, recordings, and lead context in one timeline."
          icon={PhoneOutgoing}
          badge="Live"
        >
          <Link
            href="/analytics"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-primary/30 hover:text-white"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </Link>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-primary/30 hover:text-white disabled:opacity-50"
            aria-label="Refresh call logs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </PageHeader>

        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <StatCard label="Today" value={stats.todayTotal} sub="total calls" gradient="from-slate-500/10 to-transparent" />
            <StatCard label="Inbound" value={stats.inboundToday} sub="today" gradient="from-cyan-500/15 to-transparent" valueClass="text-cyan-300" />
            <StatCard label="Outbound" value={stats.outboundToday} sub="today" gradient="from-violet-500/15 to-transparent" valueClass="text-violet-300" />
            <StatCard
              label="Connect rate"
              value={`${stats.connectRate}%`}
              sub={`${stats.missedToday} missed`}
              icon={TrendingUp}
              gradient="from-emerald-500/15 to-transparent"
              valueClass="text-emerald-300"
            />
          </motion.div>
        )}

        <div className="sticky top-0 z-10 -mx-1 mb-4 space-y-3 rounded-2xl border border-white/[0.06] bg-[oklch(0.07_0.006_285)]/95 p-3 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-black/30 p-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDirection(id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                    direction === id
                      ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/15 text-white shadow-sm'
                      : 'text-slate-500 hover:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'connected', 'missed'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-[11px] font-semibold capitalize border transition',
                    statusFilter === f
                      ? 'border-primary/35 bg-primary/12 text-primary'
                      : 'border-white/[0.08] text-slate-500 hover:text-white',
                  )}
                >
                  {f === 'all' ? 'Any status' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, number, or company…"
              className="h-10 pl-9 bg-white/[0.04] border-white/[0.08] focus-visible:ring-violet-500/30"
            />
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-600">
            {filtered.length} call{filtered.length === 1 ? '' : 's'}
            {search.trim() ? ' matching search' : ''}
          </p>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03]"
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState direction={direction} />
        )}

        <div className="space-y-6">
          {grouped.map(({ group, calls: sectionCalls }) => (
            <section key={group}>
              <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
                {DATE_GROUP_LABELS[group]}
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] tabular-nums text-slate-600">
                  {sectionCalls.length}
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-white/[0.08] to-transparent" />
              </h2>
              <div className="space-y-2">
                {sectionCalls.map((call) => {
                  const idx = rowIndex++;
                  return <CallLogRowCard key={call.id} call={call} index={idx} />;
                })}
              </div>
            </section>
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
  gradient,
  valueClass = 'text-white',
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  gradient: string;
  valueClass?: string;
  icon?: typeof TrendingUp;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.07] bg-gradient-to-br p-4',
        gradient,
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', valueClass)}>{value}</p>
      <p className="text-[10px] text-slate-600">{sub}</p>
    </div>
  );
}

function EmptyState({ direction }: { direction: DirectionFilter }) {
  return (
    <div className="py-8">
      <PremiumEmptyState
        icon={PhoneMissed}
        scene="calls"
        accent="cyan"
        title="No calls yet"
        description={
          direction === 'inbound'
            ? 'Inbound calls to your numbers will appear here with duration, disposition, and recording links.'
            : 'Start dialing from the AI Dialer — every call logs automatically with disposition and AI analysis.'
        }
        primaryAction={{ label: 'Open dialer', href: '/dialer' }}
        secondaryAction={{ label: 'Call settings', href: '/settings?tab=calling' }}
      />
    </div>
  );
}
