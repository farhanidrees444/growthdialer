'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import {
  Phone, Clock, Activity, Zap,
  TrendingUp, TrendingDown, Minus,
  ArrowUpDown, Brain, Sparkles, BarChart2, ChevronDown,
  type LucideIcon,
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
import { useSiteTheme } from '@/components/theme/site-theme';
import { AnimatedKpiValue } from '@/components/premium/animated-number';
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
}

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
  const { isDark } = useSiteTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(
      'rounded-xl border px-4 py-3 text-xs',
      isDark
        ? 'border-white/[0.1] bg-[oklch(0.09_0.006_285)] shadow-2xl'
        : 'border-zinc-950/[0.08] bg-white shadow-[0_12px_32px_rgba(9,9,11,0.12)]',
    )}>
      {label && <p className={cn('mb-1.5 font-semibold', isDark ? 'text-white/70' : 'text-zinc-700')}>{label}</p>}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 leading-5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className={cn("capitalize", isDark ? "text-white/50" : "text-zinc-500")}>{p.name}:</span>
          <span className={cn("font-semibold tabular-nums", isDark ? "text-white" : "text-zinc-900")}>{p.value}</span>
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
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace('#', '')})`} dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" />
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
  icon:    LucideIcon;
  delay?:  number;
}

function KpiCard({ title, value, deltaLabel, deltaUp, deltaNeutral, spark, color, icon: Icon, delay = 0 }: KpiCardProps) {
  const { isDark } = useSiteTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay }}
      className={cn(
        'relative overflow-hidden p-5',
        isDark
          ? 'dash-card dash-card-hover'
          : 'rounded-xl border border-zinc-950/[0.07] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(9,9,11,0.10)]',
      )}
    >
      {/* Background sparkline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 opacity-40">
        <MiniSpark data={spark} color={color} />
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl border',
            isDark ? 'border-white/[0.06]' : 'border-zinc-950/[0.06]',
          )}
            style={{ background: `${color}18` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <p className="dash-muted font-medium">{title}</p>
        </div>
        <p className={cn('text-2xl font-bold tabular-nums tracking-tight', isDark ? 'text-white' : 'text-zinc-900')}>
          <AnimatedKpiValue value={value} />
        </p>
        <div className={cn(
          'mt-2 flex items-center gap-1 text-[11px] font-medium',
          isDark
            ? deltaNeutral ? 'text-white/30' : deltaUp ? 'text-emerald-400' : 'text-red-400'
            : deltaNeutral ? 'text-zinc-400' : deltaUp ? 'text-emerald-600' : 'text-red-600',
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
  const { isDark } = useSiteTheme();
  return <div className={cn('h-[112px]', isDark ? 'dash-skeleton' : 'animate-pulse rounded-xl bg-zinc-950/[0.05]')} aria-hidden />;
}

// ─── Glass card wrapper ───────────────────────────────────────────────────────

function GCard({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  const { isDark } = useSiteTheme();
  return (
    <div className={cn(
      'p-5',
      isDark
        ? 'dash-card'
        : 'rounded-xl border border-zinc-950/[0.07] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
      className,
    )}>
      <div className="mb-4">
        <p className="dash-section-title">{title}</p>
        {subtitle && <p className="dash-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton chart ───────────────────────────────────────────────────────────

function SkeletonChart({ h = 220 }: { h?: number }) {
  const { isDark } = useSiteTheme();
  return (
    <div className={cn(isDark ? 'dash-skeleton' : 'animate-pulse rounded-xl bg-zinc-950/[0.05]')} style={{ height: h + 56 }} aria-hidden />
  );
}

// ─── Conversion funnel (real data only — derived from fetched KPIs) ────────────

const FUNNEL_POSITIVE = ['interested', 'callback', 'meeting_booked'];

function ConversionFunnel({ stages }: { stages: { stage: string; value: number; color: string }[] }) {
  const { isDark } = useSiteTheme();
  const max = Math.max(...stages.map((s) => s.value), 1);
  const dials = stages[0]?.value ?? 0;
  return (
    <div className="space-y-1">
      {stages.map((s, i) => {
        const prev = i === 0 ? null : stages[i - 1];
        const conv = prev && prev.value > 0 ? (s.value / prev.value) * 100 : null;
        return (
          <div key={s.stage}>
            {conv !== null && (
              <div className="flex justify-center py-1">
                <span className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums',
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.03] text-white/40'
                      : 'border-zinc-950/[0.08] bg-zinc-950/[0.03] text-zinc-600',
                  )}>
                  {conv.toFixed(1)}% conversion
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-white/50">{s.stage}</span>
              <div className={cn(
                    'relative h-8 flex-1 overflow-hidden rounded-lg',
                    isDark ? 'bg-white/[0.04]' : 'bg-zinc-950/[0.05]',
                  )}>
                <motion.div
                  className="absolute inset-y-0 left-0 w-full rounded-lg"
                  style={{
                    background: `linear-gradient(90deg, ${s.color}55, ${s.color}aa)`,
                    transformOrigin: 'left center',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: s.value / max }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                />
                <span className="absolute inset-y-0 left-2.5 flex items-center text-xs font-bold tabular-nums text-white">
                  {s.value.toLocaleString()}
                </span>
              </div>
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-white/30">
                {dials > 0 ? ((s.value / dials) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        );
      })}
      <p className="pt-3 text-[11px] leading-relaxed text-white/30">
        <span className="font-medium text-white/55">Reading the funnel:</span> bars show the count at each stage,
        percentages on the right are share of dials, badges show stage-to-stage conversion.
        Positive outcome = interested, callback, or meeting booked.
      </p>
    </div>
  );
}

// ─── Channel breakdown (inbound vs outbound share) ───────────────────────────

function ChannelBreakdown({ inbound, outbound }: { inbound: number; outbound: number }) {
  const reduced = useReducedMotion();
  const { isDark } = useSiteTheme();
  const total = inbound + outbound;
  const rows = [
    { name: 'Outbound', value: outbound, color: '#8B5CF6' },
    { name: 'Inbound',  value: inbound,  color: '#06B6D4' },
  ];
  return (
    <div>
      {total === 0 ? (
        <EmptyChart />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={46} outerRadius={68} paddingAngle={3} strokeWidth={0}
                  isAnimationActive={!reduced} animationDuration={900} animationEasing="ease-out"
                >
                  {rows.map((r) => <Cell key={r.name} fill={r.color} fillOpacity={0.88} />)}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums text-white">{total.toLocaleString()}</span>
              <span className="text-[10px] text-white/35">calls</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            {rows.map((r) => (
              <div key={r.name} className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-1.5',
                isDark ? 'border-white/[0.04] bg-white/[0.02]' : 'border-zinc-950/[0.06] bg-zinc-950/[0.02]',
              )}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="flex-1 text-xs text-white/60">{r.name}</span>
                <span className="tabular-nums text-xs font-bold text-white">{r.value.toLocaleString()}</span>
                <span className="tabular-nums text-[10px] text-white/30">
                  {((r.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className={cn(
        'mt-3 border-t pt-3 text-[11px]',
        isDark ? 'border-white/[0.05] text-white/35' : 'border-zinc-950/[0.06] text-zinc-500',
      )}>
        Direction split for this period — calls you placed vs calls you received.
      </p>
    </div>
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
  const { isDark } = useSiteTheme();
  const axisFill = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(9,9,11,0.45)';
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(9,9,11,0.06)';
  const cursorLine = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(9,9,11,0.10)';
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(9,9,11,0.04)';
  const legendColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(9,9,11,0.55)';
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
        color: '#8B5CF6',
        icon:  Phone,
      },
      {
        title: 'Connect Rate',
        value: `${c.connectRate.toFixed(1)}%`,
        delta: delta(c.connectRate, p.connectRate),
        spark: data.sparklines.connectRate,
        color: '#06B6D4',
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

  // Conversion funnel stages + channel totals — derived only from fetched data
  const funnelStages = useMemo(() => {
    if (!data) return null;
    const disp = data.dispositions ?? [];
    const dispTotal = disp.reduce((s, d) => s + d.count, 0);
    const positive = disp
      .filter((d) => FUNNEL_POSITIVE.includes(d.disposition))
      .reduce((s, d) => s + d.count, 0);
    return [
      { stage: 'Dials',             value: data.current.totalCalls,     color: '#8B5CF6' },
      { stage: 'Connected',         value: data.current.connectedCalls, color: '#06B6D4' },
      { stage: 'Dispositioned',      value: dispTotal,                   color: '#a78bfa' },
      { stage: 'Positive outcome',  value: positive,                    color: '#34d399' },
    ];
  }, [data]);

  const channelTotals = useMemo(() => {
    const rows = data?.callsOverTime ?? [];
    return {
      inbound:  rows.reduce((s, r) => s + (r.inbound ?? 0), 0),
      outbound: rows.reduce((s, r) => s + (r.outbound ?? 0), 0),
    };
  }, [data?.callsOverTime]);

  const hasAiData   = (data?.ai.totalAnalyzed ?? 0) > 0;
  const totalCurrent = data?.current.totalCalls ?? 0;
  const isEmpty     = !loading && totalCurrent === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MotionConfig reducedMotion="user">
    <main className="flex-1 overflow-y-auto px-3 py-4 space-y-4 lg:px-6 lg:py-5 lg:space-y-5">

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div className="dash-enter">
        <h1 className="dash-page-title">Analytics</h1>
        <p className="dash-muted mt-1">Call performance, trends, and AI insights.</p>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Date range pills */}
        <div className={cn(
            'flex flex-wrap gap-1 rounded-xl border p-1',
            isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-zinc-950/[0.08] bg-white shadow-sm',
          )}>
          {RANGE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                range === key
                  ? isDark
                    ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/20'
                    : 'border border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.10] text-[#7c3aed] shadow-lg shadow-purple-500/10'
                  : isDark
                    ? 'text-white/40 hover:text-white/70'
                    : 'text-zinc-500 hover:text-zinc-900',
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
                className={cn(
                  'px-3 py-1.5',
                  isDark
                    ? 'dash-input'
                    : 'rounded-lg border border-zinc-950/10 bg-white text-[14px] text-zinc-900 shadow-sm',
                )} />
              <span className="text-xs text-white/30">to</span>
              <input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)}
                className={cn(
                  'px-3 py-1.5',
                  isDark
                    ? 'dash-input'
                    : 'rounded-lg border border-zinc-950/10 bg-white text-[14px] text-zinc-900 shadow-sm',
                )} />
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
                className={cn(
                  'appearance-none cursor-pointer py-1.5 pl-3 pr-8',
                  isDark
                    ? 'dash-input text-white/60!'
                    : 'rounded-lg border border-zinc-950/10 bg-white text-[14px] text-zinc-700 shadow-sm',
                )}
              >
                {sel.opts.map((o) => (
                  <option key={o.value} value={o.value} className={cn(isDark ? 'bg-[oklch(0.09_0.006_285)] text-white' : 'bg-white text-zinc-900')}>
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
                className={cn(
                  'appearance-none cursor-pointer py-1.5 pl-3 pr-8',
                  isDark
                    ? 'dash-input text-white/60!'
                    : 'rounded-lg border border-zinc-950/10 bg-white text-[14px] text-zinc-700 shadow-sm',
                )}
              >
                <option value="" className={cn(isDark ? 'bg-[oklch(0.09_0.006_285)] text-white' : 'bg-white text-zinc-900')}>All Numbers</option>
                {data!.perNumber.map((n) => (
                  <option key={n.number} value={n.number} className={cn(isDark ? 'bg-[oklch(0.09_0.006_285)] text-white' : 'bg-white text-zinc-900')}>
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
          className={cn(
            'flex flex-col items-center justify-center rounded-2xl border py-20 text-center',
            isDark
              ? 'border-white/[0.06] bg-white/[0.02]'
              : 'border-zinc-950/[0.07] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
          )}
        >
          <Phone className="mb-4 h-10 w-10 text-white/10" />
          <p className="text-base font-semibold text-white/50">No calls in this period</p>
          <p className="mt-1 text-xs text-white/25">
            Adjust the date range or start making calls to see analytics here.
          </p>
          <Link href="/dialer" className="dash-btn-primary mt-5">
            Open dialer
          </Link>
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
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisFill }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: axisFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<GlassTooltip />} cursor={{ stroke: cursorLine, strokeWidth: 1 }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: legendColor }} />
                    <Area type="monotone" dataKey="outbound" name="Outbound" stroke="#8B5CF6" strokeWidth={2} fill="url(#gOut)" dot={false} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                    <Area type="monotone" dataKey="inbound"  name="Inbound"  stroke="#06B6D4" strokeWidth={2} fill="url(#gIn)"  dot={false} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </GCard>
          )}

          {/* Row: Conversion Funnel + Channel Breakdown */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SkeletonChart h={200} />
              <SkeletonChart h={200} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <GCard title="Conversion Funnel" subtitle="From dials to positive outcomes">
                {funnelStages && funnelStages.every((s) => s.value === 0) ? (
                  <EmptyChart />
                ) : (
                  funnelStages && <ConversionFunnel stages={funnelStages} />
                )}
              </GCard>
              <GCard
                title="Channel Breakdown"
                subtitle={`Inbound vs outbound — ${RANGE_OPTIONS.find((r) => r.key === range)?.label}`}
              >
                <ChannelBreakdown inbound={channelTotals.inbound} outbound={channelTotals.outbound} />
              </GCard>
            </div>
          )}

          {/* Row: Disposition Donut + Inbound vs Outbound */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {loading ? (
              <><SkeletonChart h={200} /><SkeletonChart h={200} /></>
            ) : (
              <>
                {/* Disposition donut */}
                <GCard title="Disposition Breakdown" subtitle="Share of dispositioned calls">
                  {data!.dispositions.length === 0 ? (
                    <EmptyChart message="No dispositioned calls yet" />
                  ) : (
                    <div>
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
                              <div key={d.disposition} className={cn(
                              'flex items-center gap-2 rounded-lg border px-2.5 py-1.5',
                              isDark ? 'border-white/[0.04] bg-white/[0.02]' : 'border-zinc-950/[0.06] bg-zinc-950/[0.02]',
                            )}>
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="min-w-0 flex-1 truncate text-xs text-white/60">{d.label}</span>
                                <span className="tabular-nums text-xs font-bold text-white">{d.count}</span>
                                <span className="tabular-nums text-[10px] text-white/30">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Clarify the denominator: % above is of dispositioned calls, not all calls */}
                      <p className={cn(
                        'mt-3 border-t pt-3 text-[11px]',
                        isDark ? 'border-white/[0.05] text-white/35' : 'border-zinc-950/[0.06] text-zinc-500',
                      )}>
                        <span className="tabular-nums text-white/60">
                          {data!.dispositions.reduce((s, x) => s + x.count, 0)}
                        </span>{' '}
                        of <span className="tabular-nums text-white/60">{data!.current.totalCalls}</span> calls dispositioned
                        {' '}· percentages are of dispositioned calls
                      </p>
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
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisFill }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: axisFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: cursorFill }} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 10, color: legendColor }} />
                        <Bar dataKey="outbound" name="Outbound" stackId="a" fill="#8B5CF6" fillOpacity={0.75} radius={[0, 0, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                        <Bar dataKey="inbound"  name="Inbound"  stackId="a" fill="#06B6D4" fillOpacity={0.75} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: axisFill }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: axisFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: cursorFill }} />
                        <Bar dataKey="total" name="Total" fill="#8B5CF6" fillOpacity={0.5} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                        <Bar dataKey="connected" name="Connected" fill="#06B6D4" fillOpacity={0.85} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisFill }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: axisFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: cursorFill }} />
                        <Bar dataKey="calls" name="Calls"
                          radius={[4, 4, 0, 0]}
                          fill="url(#gOut)"
                        >
                          {(data?.dayOfWeek ?? []).map((entry) => (
                            <Cell key={entry.day} fill="#8B5CF6" fillOpacity={entry.calls > 0 ? 0.75 : 0.2} />
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
                      <tr className={cn('border-b', isDark ? 'border-white/[0.05]' : 'border-zinc-950/[0.06]')}>
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
                              col ? (isDark ? 'cursor-pointer hover:text-white/60 transition-colors' : 'cursor-pointer hover:text-zinc-700 transition-colors') : '',
                            )}
                            onClick={() => {
                              if (!col) return;
                              if (sortCol === col) setSortAsc((a) => !a);
                              else { setSortCol(col); setSortAsc(false); }
                            }}
                          >
                            <span className="flex items-center gap-1">
                              {label}
                              {col && <ArrowUpDown className={cn('h-3 w-3', sortCol === col ? 'text-[#8B5CF6]' : 'text-white/20')} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-zinc-950/[0.05]')}>
                      {sortedNumbers.map((row) => (
                        <tr key={row.number} className={cn('group transition-colors', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-950/[0.02]')}>
                          <td className="px-3 py-2.5 font-mono text-white/70">{row.number}</td>
                          <td className="px-3 py-2.5 tabular-nums font-semibold text-white">{row.total}</td>
                          <td className="px-3 py-2.5 tabular-nums text-white/70">{row.connected}</td>
                          <td className="px-3 py-2.5 tabular-nums">
                            <span className={cn('font-medium',
                              row.connectRate >= 60 ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                              : row.connectRate >= 30 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                              : (isDark ? 'text-red-400/80' : 'text-red-600')
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
              <Brain className="h-4 w-4 text-[#8B5CF6]" />
              <p className="text-sm font-semibold text-white">AI Insights</p>
              {data && (
                <span className="rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2 py-0.5 text-[10px] text-[#8B5CF6]">
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
              <div className={cn(
                'flex flex-col items-center justify-center rounded-2xl border py-12 text-center',
                isDark
                  ? 'border-white/[0.06] bg-white/[0.02]'
                  : 'border-zinc-950/[0.07] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
              )}>
                <Sparkles className="mb-3 h-8 w-8 text-[#8B5CF6]/30" />
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
                            <span className="flex-1 min-w-0 truncate text-xs capitalize text-white/60">{intent.intent.replace(/_/g, ' ')}</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${(intent.count / max) * 100}%` }} />
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
                              'inline-flex items-center rounded-lg border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-2 py-1 capitalize leading-none',
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
    </MotionConfig>
  );
}
