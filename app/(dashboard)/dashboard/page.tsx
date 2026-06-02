"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Users, CalendarCheck, Clock, TrendingUp, TrendingDown,
  Activity, ChevronRight,
} from "lucide-react";
import { NumberHealthCard } from "@/components/dashboard/number-health-card";
import {
  AreaChart, Area, XAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import { useLeads } from "@/contexts/leads-context";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { SystemMetricsData, HourlyMetricPoint } from "@/lib/dashboard-types";

// ── Types ────────────────────────────────────────────────────────────────────

interface StatsData {
  callsToday: number;
  connectRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  yesterday: { calls: number; connectRate: number };
}

interface RecentCall {
  id: string;
  to_number: string | null;
  duration_seconds: number | null;
  ended_at: string | null;
  disposition: string | null;
  leads: { name: string; company: string } | null;
}


interface DailyPoint {
  label: string;
  calls: number;
  connected: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_SPARKLINE: HourlyMetricPoint[] = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  label: `${String(h).padStart(2, "0")}:00`,
  calls: 0,
  connected: 0,
  meetings: 0,
  ai: 0,
}));

const EMPTY_METRICS: SystemMetricsData = {
  sparkline: EMPTY_SPARKLINE,
  aiHoursSaved: { total: 0, transcription: 0, disposition: 0, summary: 0, dollarValue: 0 },
  spamShield: { health: 100, numbers: [], lastChecked: new Date().toISOString() },
  hasRealData: false,
};

const DISP_STYLES: Record<string, string> = {
  interested: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  callback: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  meeting_booked: "border-violet-500/20 bg-violet-500/10 text-violet-400",
  voicemail: "border-white/[0.08] bg-white/[0.04] text-slate-500",
  not_interested: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  no_answer: "border-white/[0.08] bg-white/[0.04] text-slate-500",
  wrong_number: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  dnc: "border-red-500/20 bg-red-500/10 text-red-400",
};

const DISP_LABELS: Record<string, string> = {
  interested: "Interested",
  callback: "Callback",
  meeting_booked: "Meeting",
  voicemail: "Voicemail",
  not_interested: "No Interest",
  no_answer: "No Answer",
  wrong_number: "Wrong #",
  dnc: "DNC",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtHour(h: number): string {
  if (h === 0) return "12A";
  if (h === 12) return "12P";
  return h > 12 ? `${h - 12}P` : `${h}A`;
}

function fmtDuration(s: number | null): string {
  if (!s || s === 0) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

function fmtTalkTime(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

function avatarGradient(name: string): string {
  const code = (name.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[code];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.05]", className)} />;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  rawValue,
  displayValue,
  loading,
  icon: Icon,
  iconColor,
  color,
  gradientId,
  sparkline,
  dataKey,
  trend,
}: {
  title: string;
  rawValue: number;
  displayValue: string;
  loading: boolean;
  icon: typeof Phone;
  iconColor: string;
  color: string;
  gradientId: string;
  sparkline: HourlyMetricPoint[];
  dataKey: keyof Pick<HourlyMetricPoint, "calls" | "connected" | "meetings">;
  trend?: { pct: number; positive: boolean } | null;
}) {
  const hasData = rawValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-colors hover:border-white/[0.10]"
    >
      <div className="p-4 pb-1">
        <p className="text-[10px] uppercase tracking-widest text-white/40">{title}</p>
        {loading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : hasData ? (
          <>
            <p className="mt-1.5 font-display text-4xl font-light tabular-nums text-white">
              {displayValue}
            </p>
            {trend !== undefined && trend !== null && (
              <div className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium",
                trend.positive ? "text-emerald-400" : "text-rose-400",
              )}>
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(trend.pct).toFixed(0)}% vs yesterday</span>
              </div>
            )}
          </>
        ) : (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <p className="text-xs text-slate-600">No calls yet today</p>
            <Link href="/dialer" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">
              Start dialing →
            </Link>
          </div>
        )}
      </div>
      <div className="h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Call Activity Chart ───────────────────────────────────────────────────────

function CallActivityChart({
  sparkline,
  weeklyData,
  weeklyLoading,
  timeRange,
  onTimeRangeChange,
}: {
  sparkline: HourlyMetricPoint[];
  weeklyData: DailyPoint[] | null;
  weeklyLoading: boolean;
  timeRange: '24H' | '7D';
  onTimeRangeChange: (r: '24H' | '7D') => void;
}) {
  const nowHour = new Date().getHours();
  const chart24H = Array.from({ length: 24 }, (_, i) => {
    const h = (nowHour - 23 + i + 24) % 24;
    const pt = sparkline.find(p => p.hour === h);
    return { label: fmtHour(h), calls: pt?.calls ?? 0, connected: pt?.connected ?? 0 };
  });

  const chartData = timeRange === '24H' ? chart24H : (weeklyData ?? []);
  const hasData = chartData.some(p => p.calls > 0 || p.connected > 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Call Activity</h3>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.06] bg-black/20 p-0.5">
          {(['24H'7D'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onTimeRangeChange(r)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                timeRange === r ? "bg-white/[0.09] text-white" : "text-slate-600 hover:text-slate-400",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {weeklyLoading && timeRange === '7D' ? (
        <div className="flex h-[240px] items-center justify-center lg:h-[280px]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
        </div>
      ) : hasData ? (
        <>
          <div className="h-[240px] px-2 lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="act-calls-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(258,90%,66%)'" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(258,90%,66%)'" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="act-conn-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(186,100%,42%)'" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(186,100%,42%)'" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={timeRange === '24H' ? 3 : 0}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-white/10 bg-[oklch(0.1_0.02_282)] px-3 py-2 text-xs shadow-xl">
                        <p className="mb-1 font-medium text-slate-300">{String(label ?? '')}</p>
                        {payload.map(p => (
                          <p key={String(p.name)} style={{ color: String(p.color ?? '#fff') }}>
                            {p.name}: {p.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="calls" name="Calls Made" stroke="hsl(258,90%,66%)" strokeWidth={2} fill="url(#act-calls-grad)'" dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="connected" name="Connected" stroke="hsl(186,100%,42%)" strokeWidth={2} fill="url(#act-conn-grad)'" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end gap-4 px-5 pb-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 rounded bg-violet-600" />
              <span className="text-[10px] text-slate-500">Calls Made</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 rounded bg-[hsl(186,100%,42%)']" />
              <span className="text-[10px] text-slate-500">Connected</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[240px] flex-col items-center justify-center gap-3 px-5 lg:h-[280px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <Activity className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-600">Activity will appear once you start calling</p>
          <Link href="/dialer" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">
            Go to dialer →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Recent Calls ──────────────────────────────────────────────────────────────

function RecentCallsList({ calls, loading }: { calls: RecentCall[] | null; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Recent Calls</h3>
        <Link href="/analytics" className="flex items-center gap-1 text-xs text-slate-600 transition-colors hover:text-slate-400">
          All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : !calls || calls.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <Phone className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-600">No recent calls</p>
          <Link href="/dialer" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">
            Start dialing →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {calls.map(call => {
            const name = call.leads?.name ?? (call.to_number ? formatPhone(call.to_number) : 'Unknown');
            const company = call.leads?.company;
            const dispStyle = call.disposition ? (DISP_STYLES[call.disposition] ?? DISP_STYLES.no_answer) : DISP_STYLES.no_answer;
            const dispLabel = call.disposition ? (DISP_LABELS[call.disposition] ?? call.disposition) : 'No Answer';
            const grad = avatarGradient(name);

            return (
              <div key={call.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white", grad)}>
                  {getInitials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{name}</p>
                  <p className="text-xs text-slate-500">
                    {company && <span className="mr-1">{company} ·</span>}
                    {timeAgo(call.ended_at)}
                    {call.duration_seconds ? ` · ${fmtDuration(call.duration_seconds)}` : ''}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", dispStyle)}>
                  {dispLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const session = useSupabaseSession();
  const { leads } = useLeads();
  void leads;

  const tokenRef = useRef<string | null>(null);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  const [talkTime, setTalkTime] = useState<number | null>(null);

  const [recentCallsLoading, setRecentCallsLoading] = useState(true);
  const [recentCalls, setRecentCalls] = useState<RecentCall[] | null>(null);

  const [weeklyData, setWeeklyData] = useState<DailyPoint[] | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const weeklyLoadedRef = useRef(false);

  const [timeRange, setTimeRange] = useState<'24H' | '7D'>('24H');

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    ?? session?.user?.email?.split('@')[0]
    ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const fetchMetrics = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/dashboard/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMetrics(await res.json() as SystemMetricsData);
      } else {
        setMetrics(EMPTY_METRICS);
      }
    } catch {
      setMetrics(EMPTY_METRICS);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    tokenRef.current = session.access_token;
    fetchMetrics(session.access_token);
  }, [session?.access_token, fetchMetrics]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let supabase: ReturnType<typeof createClient> | null = null;
    try { supabase = createClient(); } catch { return; }
    const sb = supabase;
    const channel = sb
      .channel('dash-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${session.user.id}` },
        () => { if (tokenRef.current) fetchMetrics(tokenRef.current); },
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [session?.user?.id, fetchMetrics]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    fetch('/api/stats/today')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && !data.error) {
          setStats({
            callsToday: data.callsToday ?? 0,
            connectRate: data.connectRate ?? 0,
            meetingsBooked: data.meetingsBooked ?? 0,
            pipelineValue: data.pipelineValue ?? 0,
            yesterday: {
              calls: data.yesterday?.calls ?? 0,
              connectRate: data.yesterday?.connectRate ?? 0,
            },
          });
        }
        if (!cancelled) setStatsLoading(false);
      })
      .catch(() => { if (!cancelled) setStatsLoading(false); });

    supabase
      .from('calls')
      .select('duration_seconds')
      .gte('ended_at', today.toISOString())
      .not('duration_seconds', 'is', null)
      .then(({ data }) => {
        if (!cancelled) {
          const total = (data ?? []).reduce((s, c) => s + ((c.duration_seconds as number) ?? 0), 0);
          setTalkTime(total);
        }
      });

    void supabase
      .from('calls')
      .select('id, to_number, duration_seconds, ended_at, disposition, leads(name, company)')
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) {
          setRecentCalls((data ?? []) as unknown as RecentCall[]);
          setRecentCallsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (timeRange !== '7D' || weeklyLoadedRef.current) return;
    weeklyLoadedRef.current = true;
    setWeeklyLoading(true);

    const supabase = createClient();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    supabase
      .from('calls')
      .select('created_at, answered_at')
      .gte('created_at', cutoff)
      .then(({ data }) => {
        const byDay = new Map<string, { calls: number; connected: number }>();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          byDay.set(d.toISOString().split('T')[0], { calls: 0, connected: 0 });
        }
        for (const call of (data ?? [])) {
          const key = (call.created_at as string).split('T')[0];
          const slot = byDay.get(key);
          if (slot) {
            slot.calls++;
            if (call.answered_at) slot.connected++;
          }
        }
        const result: DailyPoint[] = Array.from(byDay.entries()).map(([date, v]) => ({
          label: new Date(date + 'T12:00:00').toLocaleDateString(', 'en-US', { weekday: 'short' }),
          ...v,
        }));
        setWeeklyData(result);
        setWeeklyLoading(false);
      });
  }, [timeRange]);

  const m = metrics ?? EMPTY_METRICS;
  const sparkline = m.sparkline;

  const callsTrend = stats && stats.yesterday.calls > 0
    ? { pct: ((stats.callsToday - stats.yesterday.calls) / stats.yesterday.calls) * 100, positive: stats.callsToday >= stats.yesterday.calls }
    : null;

  const connectRateTrend = stats && stats.yesterday.connectRate > 0
    ? { pct: stats.connectRate - stats.yesterday.connectRate, positive: stats.connectRate >= stats.yesterday.connectRate }
    : null;

  const allLoading = metricsLoading || statsLoading;

  return (
    <main className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-4 pt-6 pb-4 lg:px-6 lg:pt-8 lg:pb-5">
          <h1 className="text-2xl font-light text-white md:text-3xl">
            {greeting}{firstName ? ' : ''}<span className="font-semibold">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">{dateStr}</p>
        </div>

        {/* KPI Grid — 2×2 mobile, 4×1 desktop */}
        <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:gap-4 lg:px-6">
          <KpiCard
            title="Calls Today"
            rawValue={stats?.callsToday ?? 0}
            displayValue={String(stats?.callsToday ?? 0)}
            loading={allLoading}
            icon={Phone}
            iconColor="text-violet-400"
            color="hsl(258,90%,66%)'"
            gradientId="kpi-calls-grad"
            sparkline={sparkline}
            dataKey="calls"
            trend={callsTrend}
          />
          <KpiCard
            title="Connect Rate"
            rawValue={stats?.connectRate ?? 0}
            displayValue={`${(stats?.connectRate ?? 0).toFixed(1)}%`}
            loading={allLoading}
            icon={Users}
            iconColor="text-cyan-400"
            color="hsl(186,100%,42%)'"
            gradientId="kpi-conn-grad"
            sparkline={sparkline}
            dataKey="connected"
            trend={connectRateTrend}
          />
          <KpiCard
            title="Talk Time"
            rawValue={talkTime ?? 0}
            displayValue={talkTime !== null && talkTime > 0 ? fmtTalkTime(talkTime) : '0m'}
            loading={allLoading || talkTime === null}
            icon={Clock}
            iconColor="text-emerald-400"
            color="#10b981"
            gradientId="kpi-talk-grad"
            sparkline={sparkline}
            dataKey="connected"
            trend={null}
          />
          <KpiCard
            title="Meetings Booked"
            rawValue={stats?.meetingsBooked ?? 0}
            displayValue={String(stats?.meetingsBooked ?? 0)}
            loading={allLoading}
            icon={CalendarCheck}
            iconColor="text-amber-400"
            color="#f59e0b"
            gradientId="kpi-meet-grad"
            sparkline={sparkline}
            dataKey="meetings"
            trend={null}
          />
        </div>

        {/* Call Activity Chart */}
        <div className="mt-4 px-4 lg:mt-5 lg:px-6">
          {metricsLoading ? (
            <div className="h-[300px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ) : (
            <CallActivityChart
              sparkline={sparkline}
              weeklyData={weeklyData}
              weeklyLoading={weeklyLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
        </div>

        {/* Bottom Row — Recent Calls + Number Health */}
        <div className="mt-4 grid grid-cols-1 gap-4 px-4 pb-6 lg:mt-5 lg:grid-cols-2 lg:px-6">
          <RecentCallsList calls={recentCalls} loading={recentCallsLoading} />
          <NumberHealthCard />
        </div>
    </main>
  );
}
