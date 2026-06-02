'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Clock, Activity, Zap,
  TrendingUp, TrendingDown, Minus,
  ArrowUpDown, Brain, Sparkles, BarChart2, ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { KpiSet } from '@/app/api/analytics/calls/route';

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';
type SortCol  = 'total' | 'connected' | 'connectRate' | 'avgDuration';

interface AnalyticsData {
  current:  KpiSet;
  prev:     KpiSet;
  callsOverTime: { date: string; inbound: number; outbound: number; total: number }[];
  dispositions:  { disposition: string; label: string; count: number; color: string }[];
  hourOfDay:     { hour: number; label: string; total: number; connected: number; connectRate: number }[];
  dayOfWeek:     { day: string; calls: number }[];
  perNumber:     { number: string; total: number; connected: number; avgDuration: number; connectRate: number }[];
  ai: {
    sentiment:    { sentiment: string; count: number; color: string }[];
    intents:      { intent: string; count: number }[];
    keywords:     { word: string; count: number }[];
    totalAnalyzed: number;
  };
  sparklines: {
    totalCalls:  number[];
    connectRate: number[];
    avgDuration: number[];
    talkTime:    number[];
  };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtDuration(s: number): string {
  if (s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;

function fmtTalkTime(s: number): string {
  if (s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDateLabel(iso: string, range: RangeKey): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (range === '7d') return d.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' });
  if (range === 'today') return iso;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function delta(curr: number, prev: number): { label: string; up: boolean; neutral: boolean } {
  if (prev === 0 && curr === 0) return { label: '—', up: true, neutral: true };
  if (prev === 0) return { label: 'New', up: true, neutral: false };
  const pct = ((curr - prev) / prev) * 100;
  const label = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  return { label, up: pct >= 0, neutral: false };
}

// ─── Date range computation ───────────────────────────────────────────────────

function rangeToParams(range: RangeKey, cStart: string, cEnd: string) {
  const now = new Date();
  const end = now.toISOString();
  if (range === 'today') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    return { start, end };
  }
  if (range === '7d')  return { start: new Date(now.getTime() -  7 * 86400_000).toISOString(), end };
  if (range === '30d') return { start: new Date(now.getTime() - 30 * 86400_000).toISOString(), end };
  if (range === '90d') return { start: new Date(now.getTime() - 90 * 86400_000).toISOString(), end };
  // custom
  const start = cStart ? new Date(cStart).toISOString() : new Date(now.getTime() - 30 * 86400_000).toISOString();
  const endC  = cEnd   ? new Date(cEnd + 'T23:59:59Z').toISOString() : end;
  return { start, end: endC };
}

// ─── Glass tooltip ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.1] bg-[oklch(0.09_0.02_282)] px-4 py-3 text-xs shadow-2xl">
      {label && <p className="mb-1.5 font-semibold text-white/70">{label}</p>}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 leading-5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-white/50 capitalize">{p.name}:</span>
          <span className="font-semibold tabular-nums text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini sparkline (inside KPI cards) ───────────────────────────────────────

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ i, v }));
  if (pts.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={pts} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#'')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace('#'')})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title:   string;
  value:   string;
  deltaLabel: string;
  deltaUp: boolean;
  deltaNeutral: boolean;
  spark:   number[];
  color:   string;
  icon:    React.ElementType;
  delay?:  number;
}

function KpiCard({ title, value, deltaLabel, deltaUp, deltaNeutral, spark, color, icon: Icon, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5"
    >
      {/* Background sparkline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 opacity-40">
        <MiniSpark data={spark} color={color} />
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06]"
            style={{ background: `${color}18` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <p className="text-xs font-medium text-white/50">{title}</p>
        </div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-white">{value}</p>
        <div className={cn(
          'mt-2 flex items-center gap-1 text-[11px] font-medium',
          deltaNeutral ? 'text-white/30' : deltaUp ? 'text-emerald-400' : 'text-red-400',
        )}>
          {deltaNeutral ? <Minus className="h-3 w-3" /> : deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{deltaLabel} vs prev period</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton KPI ─────────────────────────────────────────────────────────────

function SkeletonKpi() {
  return <div className="h-[112px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />;
}

// ─── Glass card wrapper ───────────────────────────────────────────────────────

function GCard({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5', className)}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton chart ───────────────────────────────────────────────────────────

function SkeletonChart({ h = 220 }: { h?: number }) {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" style={{ height: h + 56 }} />
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyChart({ message = 'No data for this period' }: { message?: string }) {
  return (
    <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-center">
      <BarChart2 className="h-8 w-8 text-white/10" />
      <p className="text-xs text-white/30">{message}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d',   label: '7 Days' },
  { key: '30d',  label: '30 Days' },
  { key: '90d',  label: '90 Days' },
  { key: 'custom', label: 'Custom' },
];

const KNOWN_DISPS = [
  { value: '',              label: 'All Dispositions' },
  { value: 'interested',   label: 'Interested' },
  { value: 'callback',     label: 'Callback' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'voicemail',    label: 'Voicemail' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'gatekeeper',   label: 'Gatekeeper' },
  { value: 'dnc',          label: 'DNC' },
  { value: 'missed',       label: 'Missed' },
];

export default function AnalyticsPage() {
  const [range, setRange]       = useState<RangeKey>('30d');
  const [cStart, setCStart]     = useState('');
  const [cEnd, setCEnd]         = useState('');
  const [direction, setDir]     = useState('all');
  const [dispFilter, setDisp]   = useState('');
  const [numFilter, setNum]     = useState('');
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [sortCol, setSortCol]   = useState<SortCol>('total');
  const [sortAsc, setSortAsc]   = useState(false);

  const { start, end } = useMemo(
    () => rangeToParams(range, cStart, cEnd),
    [range, cStart, cEnd],
  );

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ start, end, direction, disposition: dispFilter, number: numFilter });
    fetch(`/api/analytics/calls?${p}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d as AnalyticsData); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [start, end, direction, dispFilter, numFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime refresh when calls change
  useEffect(() => {
    let sb: ReturnType<typeof createClient>;
    try { sb = createClient(); } catch { return; }
    const ch = sb.channel('analytics-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, fetchData)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [fetchData]);

  // ── Computed chart data ───────────────────────────────────────────────────
  const timeData = useMemo(() => {
    if (!data?.callsOverTime) return [];
    return data.callsOverTime.map((d) => ({
      ...d,
      label: fmtDateLabel(d.date, range),
    }));
  }, [data?.callsOverTime, range]);

  const hourData = useMemo(
    () => (data?.hourOfDay ?? []).filter((h) => h.hour >= 6 && h.hour <= 22),
    [data?.hourOfDay],
  );

  const sortedNumbers = useMemo(() => {
    const rows = [...(data?.perNumber ?? [])];
    rows.sort((a, b) => {
      const diff = (a[sortCol] as number) - (b[sortCol] as number);
      return sortAsc ? diff : -diff;
    });
    return rows;
  }, [data?.perNumber, sortCol, sortAsc]);

  const kpiDefs = useMemo(() => {
    if (!data) return [];
    const c = data.current;
    const p = data.prev;
    return [
      {
        title: 'Total Calls',
        value: c.totalCalls.toLocaleString(),
        delta: delta(c.totalCalls, p.totalCalls),
        spark: data.sparklines.totalCalls,
        color : 'hsl(258, 90%, 66%)',
        icon:  Phone,
      },
      {
        title: 'Connect Rate',
        value: `${c.connectRate.toFixed(1)}%`,
        delta: delta(c.connectRate, p.connectRate),
        spark: data.sparklines.connectRate,
        color : 'hsl(186, 100%, 42%)',
        icon:  Activity,
      },
      {
        title: 'Avg Duration',
        value: fmtDuration(c.avgDuration),
        delta: delta(c.avgDuration, p.avgDuration),
        spark: data.sparklines.avgDuration,
        color: '#a78bfa',
        icon:  Clock,
      },
      {
        title: 'Total Talk Time',
        value: fmtTalkTime(c.totalTalkTime),
        delta: delta(c.totalTalkTime, p.totalTalkTime),
        spark: data.sparklines.talkTime,
        color: '#34d399',
        icon:  Zap,
      },
    ];
  }, [data]);

  const hasAiData   = (data?.ai.totalAnalyzed ?? 0) > 0;
  const totalCurrent = data?.current.totalCalls ?? 0;
  const isEmpty     = !loading && totalCurrent === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 overflow-y-auto px-3 py-4 space-y-4 lg:px-6 lg:py-5 lg:space-y-5">

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Date range pills */}
        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {RANGE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                range === key
                  ? 'bg-violet-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-white/40 hover:text-white/70',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        <AnimatePresence>
          {range === 'custom' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-[hsl(258,90%,66%)']/50 backdrop-blur-xl" />
              <span className="text-xs text-white/30">to</span>
              <input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-[hsl(258,90%,66%)']/50 backdrop-blur-xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {[
            {
              value: direction,
              onChange: setDir,
              opts: [
                { value: 'all',      label: 'All Calls' },
                { value: 'outbound', label: 'Outbound' },
                { value: 'inbound',  label: 'Inbound' },
              ],
            },
            { value: dispFilter, onChange: setDisp, opts: KNOWN_DISPS },
          ].map((sel, i) => (
            <div key={i} className="relative">
              <select
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
                className="appearance-none cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] py-1.5 pl-3 pr-8 text-xs text-white/60 outline-none hover:border-white/[0.12] focus:border-[hsl(258,90%,66%)']/50 backdrop-blur-xl transition-colors"
              >
                {sel.opts.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[oklch(0.09_0.02_282)] text-white">
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            </div>
          ))}

          {/* Number filter — derived from data */}
          {(data?.perNumber ?? []).length > 1 && (
            <div className="relative">
              <select
                value={numFilter}
                onChange={(e) => setNum(e.target.value)}
                className="appearance-none cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] py-1.5 pl-3 pr-8 text-xs text-white/60 outline-none hover:border-white/[0.12] focus:border-[hsl(258,90%,66%)']/50 backdrop-blur-xl transition-colors"
              >
                <option value="" className="bg-[oklch(0.09_0.02_282)] text-white">All Numbers</option>
                {data!.perNumber.map((n) => (
                  <option key={n.number} value={n.number} className="bg-[oklch(0.09_0.02_282)] text-white">
                    {n.number}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
          : kpiDefs.map((k, i) => (
              <KpiCard key={k.title} title={k.title} value={k.value}
                deltaLabel={k.delta.label} deltaUp={k.delta.up} deltaNeutral={k.delta.neutral}
                spark={k.spark} color={k.color} icon={k.icon} delay={i * 0.05} />
            ))
        }
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center"
        >
          <Phone className="mb-4 h-10 w-10 text-white/10" />
          <p className="text-base font-semibold text-white/50">No calls in this period</p>
          <p className="mt-1 text-xs text-white/25">
            Adjust the date range or start making calls to see analytics here.
          </p>
        </motion.div>
      )}

      {/* ── Charts (only when there is data) ──────────────────────────── */}
      {!isEmpty && (
        <>
          {/* Calls Over Time — area chart */}
          {loading ? <SkeletonChart h={220} /> : (
            <GCard title="Calls Over Time" subtitle={`Outbound (purple) vs Inbound (cyan) — ${RANGE_OPTIONS.find(r => r.key === range)?.label}`}>
              {timeData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(258,90%,66%)'" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(258,90%,66%)'" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(186,100%,42%)'" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(186,100%,42%)'" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<GlassTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: 'rgba(255,255,255,0.45)' }} />
                    <Area type="monotone" dataKey="outbound" name="Outbound" stroke="hsl(258,90%,66%)" strokeWidth={2} fill="url(#gOut)'" dot={false} />
                    <Area type="monotone" dataKey="inbound"  name="Inbound"  stroke="hsl(186,100%,42%)" strokeWidth={2} fill="url(#gIn)'"  dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </GCard>
          )}

          {/* Row: Disposition Donut + Inbound vs Outbound */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {loading ? (
              <><SkeletonChart h={200} /><SkeletonChart h={200} /></>
            ) : (
              <>
                {/* Disposition donut */}
                <GCard title="Disposition Breakdown" subtitle="Call outcomes this period">
                  {data!.dispositions.length === 0 ? (
                    <EmptyChart message="No dispositioned calls yet" />
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        <ResponsiveContainer width={160} height={160}>
                          <PieChart>
                            <Pie data={data!.dispositions} cx="50%" cy="50%"
                              innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="count">
                              {data!.dispositions.map((e) => (
                                <Cell key={e.disposition} fill={e.color} fillOpacity={0.88} />
                              ))}
                            </Pie>
                            <Tooltip content={<GlassTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        {data!.dispositions.slice(0, 6).map((d) => {
                          const tot = data!.dispositions.reduce((s, x) => s + x.count, 0);
                          const pct = tot > 0 ? ((d.count / tot) * 100).toFixed(0) : '0';
                          return (
                            <div key={d.disposition} className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="min-w-0 flex-1 truncate text-xs text-white/60">{d.label}</span>
                              <span className="tabular-nums text-xs font-bold text-white">{d.count}</span>
                              <span className="tabular-nums text-[10px] text-white/30">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </GCard>

                {/* Inbound vs Outbound stacked bar */}
                <GCard title="Inbound vs Outbound" subtitle="Call volume split by day">
                  {timeData.every((d) => d.inbound === 0 && d.outbound === 0) ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={timeData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 10, color: 'rgba(255,255,255,0.45)' }} />
                        <Bar dataKey="outbound" name="Outbound" stackId="a" fill="hsl(258,90%,66%)'" fillOpacity={0.75} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="inbound"  name="Inbound"  stackId="a" fill="hsl(186,100%,42%)'" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </GCard>
              </>
            )}
          </div>

          {/* Row: Best Time to Call + Day of Week */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {loading ? (
              <><SkeletonChart h={180} /><SkeletonChart h={180} /></>
            ) : (
              <>
                {/* Best Time to Call — hours 6am–10pm */}
                <GCard title="Best Time to Call" subtitle="Calls & connect rate by hour (UTC)">
                  {hourData.every((h) => h.total === 0) ? (
                    <EmptyChart message="No call time data yet" />
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={hourData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="total" name="Total" fill="hsl(258,90%,66%)'" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="connected" name="Connected" fill="hsl(186,100%,42%)'" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </GCard>

                {/* Calls by Day of Week */}
                <GCard title="Calls by Day of Week" subtitle="Total calls Mon – Sun">
                  {(data?.dayOfWeek ?? []).every((d) => d.calls === 0) ? (
                    <EmptyChart message="No day-of-week data yet" />
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data?.dayOfWeek ?? []} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="calls" name="Calls"
                          radius={[4, 4, 0, 0]}
                          fill="url(#gOut)"
                        >
                          {(data?.dayOfWeek ?? []).map((entry) => (
                            <Cell key={entry.day} fill="hsl(258,90%,66%)'" fillOpacity={entry.calls > 0 ? 0.75 : 0.2} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </GCard>
              </>
            )}
          </div>

          {/* Per-Number Performance — sortable table */}
          {loading ? <SkeletonChart h={120} /> : (
            (data?.perNumber ?? []).length > 0 && (
              <GCard title="Per-Number Performance" subtitle="Your numbers ranked by call volume">
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        {(
                          [
                            { col: null,          label: 'Number' },
                            { col: 'total',       label: 'Calls' },
                            { col: 'connected',   label: 'Connected' },
                            { col: 'connectRate', label: 'Connect %' },
                            { col: 'avgDuration', label: 'Avg Duration' },
                          ] as { col: SortCol | null; label: string }[]
                        ).map(({ col, label }) => (
                          <th
                            key={label}
                            className={cn(
                              'px-3 py-2 text-left font-medium text-white/30 select-none',
                              col ? 'cursor-pointer hover:text-white/60 transition-colors' : '',
                            )}
                            onClick={() => {
                              if (!col) return;
                              if (sortCol === col) setSortAsc((a) => !a);
                              else { setSortCol(col); setSortAsc(false); }
                            }}
                          >
                            <span className="flex items-center gap-1">
                              {label}
                              {col && <ArrowUpDown className={cn('h-3 w-3', sortCol === col ? 'text-[hsl(258,90%,66%)']' : 'text-white/20')} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {sortedNumbers.map((row) => (
                        <tr key={row.number} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-2.5 font-mono text-white/70">{row.number}</td>
                          <td className="px-3 py-2.5 tabular-nums font-semibold text-white">{row.total}</td>
                          <td className="px-3 py-2.5 tabular-nums text-white/70">{row.connected}</td>
                          <td className="px-3 py-2.5 tabular-nums">
                            <span className={cn('font-medium',
                              row.connectRate >= 60 ? 'text-emerald-400'
                              : row.connectRate >= 30 ? 'text-amber-400'
                              : 'text-red-400/80'
                            )}>
                              {row.connectRate}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-white/50">{fmtDuration(row.avgDuration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GCard>
            )
          )}

          {/* ── AI Insights ─────────────────────────────────────────── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-[hsl(258,90%,66%)']" />
              <p className="text-sm font-semibold text-white">AI Insights</p>
              {data && (
                <span className="rounded-full border border-[hsl(258,90%,66%)]/30 bg-violet-600/10 px-2 py-0.5 text-[10px] text-[hsl(258,90%,66%)']">
                  {data.ai.totalAnalyzed} calls analyzed
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <SkeletonChart h={120} />
                <SkeletonChart h={120} />
                <SkeletonChart h={120} />
              </div>
            ) : !hasAiData ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
                <Sparkles className="mb-3 h-8 w-8 text-[hsl(258,90%,66%)']/30" />
                <p className="text-sm font-medium text-white/40">AI analysis in progress</p>
                <p className="mt-1 text-xs text-white/20">
                  Insights appear once calls have been transcribed and analyzed.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Sentiment */}
                <GCard title="Sentiment Distribution" subtitle={`${data!.ai.totalAnalyzed} analyzed calls`}>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <ResponsiveContainer width={110} height={110}>
                        <PieChart>
                          <Pie data={data!.ai.sentiment} cx="50%" cy="50%"
                            innerRadius={32} outerRadius={50} paddingAngle={2} dataKey="count">
                            {data!.ai.sentiment.map((e) => (
                              <Cell key={e.sentiment} fill={e.color} fillOpacity={0.9} />
                            ))}
                          </Pie>
                          <Tooltip content={<GlassTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {data!.ai.sentiment.map((s) => {
                        const tot = data!.ai.sentiment.reduce((a, b) => a + b.count, 0);
                        return (
                          <div key={s.sentiment} className="flex items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="flex-1 text-xs capitalize text-white/50">{s.sentiment}</span>
                            <span className="tabular-nums text-xs font-bold text-white">{s.count}</span>
                            <span className="tabular-nums text-[10px] text-white/30">
                              {tot > 0 ? ((s.count / tot) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </GCard>

                {/* Top Intents */}
                <GCard title="Top Call Intents" subtitle="Most common AI-detected intents">
                  {data!.ai.intents.length === 0 ? (
                    <EmptyChart message="No intent data" />
                  ) : (
                    <div className="space-y-2">
                      {data!.ai.intents.map((intent, i) => {
                        const max = data!.ai.intents[0].count;
                        return (
                          <div key={intent.intent} className="flex items-center gap-2">
                            <span className="tabular-nums text-[10px] text-white/25 w-4">{i + 1}</span>
                            <span className="flex-1 min-w-0 truncate text-xs capitalize text-white/60">{intent.intent.replace(/_/g ')}</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div className="h-full rounded-full bg-violet-600" style={{ width: `${(intent.count / max) * 100}%` }} />
                            </div>
                            <span className="tabular-nums text-xs font-bold text-white w-6 text-right">{intent.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GCard>

                {/* Trending Keywords */}
                <GCard title="Trending Keywords" subtitle="Most frequent AI-extracted topics">
                  {data!.ai.keywords.length === 0 ? (
                    <EmptyChart message="No keyword data" />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {data!.ai.keywords.map((kw) => {
                        const max = data!.ai.keywords[0].count;
                        const pct = max > 0 ? kw.count / max : 0;
                        const size = pct > 0.7 ? 'text-sm font-semibold' : pct > 0.4 ? 'text-xs font-medium' : 'text-[11px]';
                        const opacity = 0.4 + pct * 0.6;
                        return (
                          <span
                            key={kw.word}
                            className={cn(
                              'inline-flex items-center rounded-lg border border-[hsl(258,90%,66%)']/20 bg-violet-600/10 px-2 py-1 capitalize leading-none',
                              size,
                            )}
                            style={{ color: `rgba(167,139,250,${opacity})` }}
                            title={`${kw.count} mentions`}
                          >
                            {kw.word}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </GCard>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
