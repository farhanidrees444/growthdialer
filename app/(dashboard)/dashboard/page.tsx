"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import Link from "next/link";
import { GsapCountUp } from "@/components/gsap/GsapCountUp";
import { GsapScrollReveal, refreshGsapScrollTriggers } from "@/components/gsap/GsapScrollReveal";
import {
  Phone, Users, CalendarCheck, Clock, TrendingUp, TrendingDown,
  ChevronRight, Activity,
} from "lucide-react";
import {
  AreaChart, Area,
  ResponsiveContainer,
} from "recharts";
import { useLeads } from "@/contexts/leads-context";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { WORKSPACE_ID_HEADER } from "@/lib/auth/workspace-access";
import { cn } from "@/lib/utils";
import type { SystemMetricsData, HourlyMetricPoint } from "@/lib/dashboard-types";
import { ActivationChecklist } from "@/components/activation/activation-checklist";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { KpiGhostSparkline } from "@/components/dashboard/kpi-ghost-sparkline";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { motion, useReducedMotion } from "framer-motion";
import {
  type DashboardRecentCall,
  getRecentCallCounterparty,
  getRecentCallHref,
  getRecentDispositionLabel,
} from "@/lib/calls/recent";
import { ShimmerSkeleton, SkeletonGlassPanel } from "@/components/ui/shimmer-skeleton";
import type { DailyPoint } from "@/components/dashboard/call-activity-chart";

const CallActivityChart = lazy(() =>
  import("@/components/dashboard/call-activity-chart").then((m) => ({ default: m.CallActivityChart })),
);
const NumberHealthCard = lazy(() =>
  import("@/components/dashboard/number-health-card").then((m) => ({ default: m.NumberHealthCard })),
);
const UpNextQueue = lazy(() => import("@/components/dashboard/up-next-queue"));

// ── Types ────────────────────────────────────────────────────────────────────

interface StatsData {
  callsToday: number;
  connectRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  yesterday: { calls: number; connectRate: number };
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  return <ShimmerSkeleton className={className} />;
}

const premiumPanel =
  "relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl";

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  displayValue,
  countUp,
  loading,
  hasActivity,
  icon: Icon,
  iconColor,
  color,
  gradientId,
  sparkline,
  dataKey,
  trend,
}: {
  title: string;
  displayValue: string;
  countUp?: { value: number; decimals?: number; suffix?: string };
  loading: boolean;
  hasActivity: boolean;
  icon: typeof Phone;
  iconColor: string;
  color: string;
  gradientId: string;
  sparkline: HourlyMetricPoint[];
  dataKey: keyof Pick<HourlyMetricPoint, "calls" | "connected" | "meetings">;
  trend?: { pct: number; positive: boolean } | null;
}) {
  // Empty-state is shared across all KPI cards: if there are calls today,
  // every card shows its value (even 0) so the row stays consistent.
  const hasData = hasActivity;
  const reduce = useReducedMotion();

  return (
    <motion.div
      data-gsap-reveal
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(premiumPanel, "transition-all hover:-translate-y-0.5 hover:border-white/[0.13] hover:shadow-[0_26px_90px_rgba(0,0,0,0.42)]")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.16] to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: color }} aria-hidden />
      <div className="p-4 pb-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{title}</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
            <Icon className={cn("h-4 w-4", iconColor)} />
          </span>
        </div>
        {loading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : hasData ? (
          <>
            <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight tabular-nums text-white sm:text-4xl">
              {countUp ? (
                <GsapCountUp
                  value={countUp.value}
                  decimals={countUp.decimals}
                  suffix={countUp.suffix}
                />
              ) : (
                displayValue
              )}
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
          <div className="mt-2 flex flex-col gap-2">
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]"
              animate={reduce ? {} : { scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className={cn("h-4 w-4", iconColor)} />
            </motion.div>
            <p className="max-w-[10rem] text-xs leading-relaxed text-slate-500">
              Metrics unlock after your first completed call.
            </p>
            <Link
              href="/dialer"
              className="inline-flex w-fit items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.1]"
            >
              Open dialer
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
      <div className="h-8 w-full px-1">
        {hasData ? (
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
        ) : (
          <KpiGhostSparkline color={color} className="h-full w-full" />
        )}
      </div>
    </motion.div>
  );
}

// ── Recent Calls ──────────────────────────────────────────────────────────────

function RecentCallsList({ calls, loading }: { calls: DashboardRecentCall[] | null; loading: boolean }) {
  return (
    <div className={premiumPanel}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,0.12),transparent_34%)]" aria-hidden />
      <div className="relative flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-semibold text-white">Recent Calls</h3>
        </div>
        <Link href="/call-logs" className="flex items-center gap-1 text-xs text-slate-600 transition-colors hover:text-slate-400">
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
        <div className="px-4 py-6">
          <PremiumEmptyState
            icon={Phone}
            scene="calls"
            accent="cyan"
            compact
            title="No recent calls"
            description="Completed calls will show here with duration, disposition, and links to recordings when eligible."
            primaryAction={{ label: 'Start dialing', href: '/dialer' }}
            secondaryAction={{ label: 'Import leads', href: '/leads' }}
            className="border-0 bg-transparent py-6 shadow-none"
          />
        </div>
      ) : (
        <div className="relative divide-y divide-white/[0.04]">
          {calls.map(call => {
            const name = getRecentCallCounterparty(call);
            const company = call.leads?.company;
            const dispKey = call.disposition ?? 'no_answer';
            const dispStyle = DISP_STYLES[dispKey] ?? DISP_STYLES.no_answer;
            const dispLabel = getRecentDispositionLabel(call.disposition);
            const grad = avatarGradient(name);
            const href = getRecentCallHref(call);

            return (
              <Link
                key={call.id}
                href={href}
                data-gsap-reveal
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[11px] font-bold text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)]", grad)}>
                  {getInitials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{name}</p>
                  <p className="text-xs text-slate-500">
                    {company && <span className="mr-1">{company} ·</span>}
                    {timeAgo(call.display_at)}
                    {call.duration_seconds ? ` · ${fmtDuration(call.duration_seconds)}` : ''}
                    {call.direction === 'inbound' && (
                      <span className="ml-1 text-cyan-500/80">· Inbound</span>
                    )}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-transform group-hover:scale-[1.02]", dispStyle)}>
                  {dispLabel}
                </span>
              </Link>
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
  const { currentWorkspace, apiFetch } = useWorkspace();
  void leads;

  const tokenRef = useRef<string | null>(null);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  const [talkTime, setTalkTime] = useState<number | null>(null);

  const [recentCallsLoading, setRecentCallsLoading] = useState(true);
  const [recentCalls, setRecentCalls] = useState<DashboardRecentCall[] | null>(null);

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

  const fetchRecentCalls = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await apiFetch('/api/dashboard/recent-calls');
      if (res.ok) {
        const data = await res.json() as { calls?: DashboardRecentCall[] };
        setRecentCalls(data.calls ?? []);
      }
    } catch {
      // keep prior list on transient errors
    } finally {
      setRecentCallsLoading(false);
    }
  }, [apiFetch, currentWorkspace?.id]);

  const fetchMetrics = useCallback(async (token: string) => {
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (currentWorkspace?.id) headers[WORKSPACE_ID_HEADER] = currentWorkspace.id;
      const res = await fetch('/api/dashboard/metrics', { headers });
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
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (!session?.access_token || !currentWorkspace?.id) return;
    tokenRef.current = session.access_token;
    fetchMetrics(session.access_token);
  }, [session?.access_token, currentWorkspace?.id, fetchMetrics]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let supabase: ReturnType<typeof createClient> | null = null;
    try { supabase = createClient(); } catch { return; }
    const sb = supabase;
    const channel = sb
      .channel('dash-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${session.user.id}` },
        () => {
          if (tokenRef.current) fetchMetrics(tokenRef.current);
          void fetchRecentCalls();
        },
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [session?.user?.id, fetchMetrics, fetchRecentCalls]);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    let cancelled = false;
    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wsId = currentWorkspace.id;
    const userId = session?.user?.id;

    apiFetch('/api/stats/today')
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

    let talkQuery = supabase
      .from('calls')
      .select('duration_seconds')
      .gte('created_at', today.toISOString())
      .gt('duration_seconds', 0);
    if (userId) {
      talkQuery = talkQuery.or(`and(workspace_id.eq.${wsId},user_id.eq.${userId}),and(workspace_id.is.null,user_id.eq.${userId})`);
    } else {
      talkQuery = talkQuery.eq('workspace_id', wsId);
    }
    talkQuery.then(({ data }) => {
        if (!cancelled) {
          const total = (data ?? []).reduce((s, c) => s + ((c.duration_seconds as number) ?? 0), 0);
          setTalkTime(total);
        }
      });

    void fetchRecentCalls();

    return () => { cancelled = true; };
  }, [currentWorkspace?.id, session?.user?.id, apiFetch, fetchRecentCalls]);

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
          label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
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
  const hasCallsToday = (stats?.callsToday ?? 0) > 0;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!allLoading) {
      refreshGsapScrollTriggers();
    }
  }, [allLoading, stats, recentCalls]);

  return (
    <GsapScrollReveal className="relative flex-1 overflow-y-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="relative flex-1"
      >
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_42%_0%,rgba(139,92,246,0.1),transparent_32%),radial-gradient(circle_at_92%_28%,rgba(6,182,212,0.06),transparent_28%)]" />
        <div className="relative z-[1]">
        <DashboardHero greeting={greeting} firstName={firstName} dateStr={dateStr} />

        <ActivationChecklist />

        {/* KPI Grid — 2×2 mobile, 4×1 desktop */}
        <div className="grid grid-cols-2 gap-3.5 px-4 pt-1 lg:grid-cols-4 lg:gap-4 lg:px-6 lg:pt-0 xl:gap-5">
          <KpiCard
            title="Calls Today"
            displayValue={String(stats?.callsToday ?? 0)}
            countUp={{ value: stats?.callsToday ?? 0 }}
            loading={allLoading}
            hasActivity={hasCallsToday}
            icon={Phone}
            iconColor="text-violet-400"
            color="#8B5CF6"
            gradientId="kpi-calls-grad"
            sparkline={sparkline}
            dataKey="calls"
            trend={callsTrend}
          />
          <KpiCard
            title="Connect Rate"
            displayValue={`${(stats?.connectRate ?? 0).toFixed(1)}%`}
            countUp={{ value: stats?.connectRate ?? 0, decimals: 1, suffix: '%' }}
            loading={allLoading}
            hasActivity={hasCallsToday}
            icon={Users}
            iconColor="text-cyan-400"
            color="#06B6D4"
            gradientId="kpi-conn-grad"
            sparkline={sparkline}
            dataKey="connected"
            trend={connectRateTrend}
          />
          <KpiCard
            title="Talk Time"
            displayValue={talkTime !== null && talkTime > 0 ? fmtTalkTime(talkTime) : '0m'}
            loading={allLoading || talkTime === null}
            hasActivity={hasCallsToday}
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
            displayValue={String(stats?.meetingsBooked ?? 0)}
            countUp={{ value: stats?.meetingsBooked ?? 0 }}
            loading={allLoading}
            hasActivity={hasCallsToday}
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
          <Suspense
            fallback={
              <SkeletonGlassPanel className="h-[300px] overflow-hidden rounded-[1.5rem]">
                <ShimmerSkeleton className="h-full w-full" rounded="rounded-[1.5rem]" />
              </SkeletonGlassPanel>
            }
          >
            <CallActivityChart
              sparkline={sparkline}
              weeklyData={weeklyData}
              weeklyLoading={weeklyLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </Suspense>
        </div>

        {/* Bottom Row — Recent · Up Next · Number Health */}
        <div
          data-gsap-reveal
          className="mt-4 grid grid-cols-1 gap-4 px-4 pb-6 lg:mt-5 lg:grid-cols-2 xl:grid-cols-3 lg:px-6"
        >
          <RecentCallsList calls={recentCalls} loading={recentCallsLoading} />
          <Suspense
            fallback={
              <SkeletonGlassPanel className="min-h-[320px] overflow-hidden rounded-[1.5rem] p-5">
                <ShimmerSkeleton className="mb-4 h-4 w-24" rounded="rounded-md" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ShimmerSkeleton key={i} className="h-12 w-full" rounded="rounded-xl" />
                  ))}
                </div>
              </SkeletonGlassPanel>
            }
          >
            <UpNextQueue />
          </Suspense>
          <Suspense
            fallback={
              <SkeletonGlassPanel className="min-h-[320px] overflow-hidden rounded-[1.5rem] p-5 lg:col-span-2 xl:col-span-1">
                <ShimmerSkeleton className="mb-4 h-4 w-28" rounded="rounded-md" />
                <ShimmerSkeleton className="mb-3 h-10 w-full" rounded="rounded-xl" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ShimmerSkeleton key={i} className="h-10 w-full" rounded="rounded-lg" />
                  ))}
                </div>
              </SkeletonGlassPanel>
            }
          >
            <NumberHealthCard />
          </Suspense>
        </div>
        </div>
      </motion.div>
    </GsapScrollReveal>
  );
}
