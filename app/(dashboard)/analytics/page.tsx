"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Users, CalendarCheck, DollarSign, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import ActivityChart from "@/components/ActivityChart";
import MultiLineChart from "@/components/dashboard/multi-line-chart";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { HourlyMetricPoint } from "@/lib/dashboard-types";

interface StatsData {
  callsToday: number;
  connectRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  yesterday: { calls: number; connectRate: number };
}

interface DistributionData {
  statusDistribution: { status: string; label: string; count: number }[];
  hourlyConnects: { hour: number; label: string; connects: number }[];
  weeklyTrend: { week: string; calls: number; connects: number; connectRate: number }[];
  dispositionBreakdown: { disposition: string; label: string; count: number; color: string }[];
  powerDialStats: { totalSessions: number; avgCallsPerSession: number; totalMeetings: number };
}

const STATUS_COLORS: Record<string, string> = {
  new: "#64748b",
  queued: "#3b82f6",
  contacted: "#f59e0b",
  connected: "#10b981",
  meeting_booked: "#8b5cf6",
  not_interested: "#ef4444",
  do_not_call: "#be123c",
  callback: "#06b6d4",
  wrong_number: "#f97316",
};

function buildStats(data: StatsData) {
  const callDelta = data.callsToday - data.yesterday.calls;
  const rateDelta = data.connectRate - data.yesterday.connectRate;

  return [
    {
      title: "Calls Today",
      value: String(data.callsToday),
      change: callDelta >= 0 ? `+${callDelta}` : String(callDelta),
      positive: callDelta >= 0,
      icon: Phone,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/15",
      delay: 0,
    },
    {
      title: "Connect Rate",
      value: `${data.connectRate.toFixed(1)}%`,
      change: rateDelta >= 0 ? `+${rateDelta.toFixed(1)}%` : `${rateDelta.toFixed(1)}%`,
      positive: rateDelta >= 0,
      icon: Users,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
      delay: 0.07,
    },
    {
      title: "Meetings Booked",
      value: String(data.meetingsBooked),
      change: data.meetingsBooked > 0 ? `+${data.meetingsBooked}` : "—",
      positive: data.meetingsBooked > 0,
      icon: CalendarCheck,
      iconColor: "text-amber-300",
      iconBg: "bg-amber-500/15",
      delay: 0.14,
    },
    {
      title: "Pipeline Value",
      value: data.pipelineValue === 0
        ? "$0"
        : data.pipelineValue >= 1000
          ? `$${(data.pipelineValue / 1000).toFixed(1)}K`
          : `$${data.pipelineValue.toLocaleString()}`,
      change: data.pipelineValue > 0 ? `+$${(data.pipelineValue / 1000).toFixed(1)}K` : "AI-extracted from calls",
      positive: data.pipelineValue > 0,
      icon: DollarSign,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15",
      delay: 0.21,
    },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[oklch(0.086_0.024_282)] p-3 text-xs shadow-xl shadow-black/40">
        <p className="mb-1.5 font-semibold text-foreground">{label}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ReturnType<typeof buildStats> | null>(null);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [distLoading, setDistLoading] = useState(true);
  const [sparkline, setSparkline] = useState<HourlyMetricPoint[]>([]);

  const loadStats = useCallback(() => {
    fetch("/api/stats/today")
      .then((r) => r.json())
      .then((data: StatsData & { error?: string }) => {
        if (!data.error) setStats(buildStats(data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadDistribution = useCallback(() => {
    fetch("/api/analytics/distribution")
      .then((r) => r.json())
      .then((data: DistributionData & { error?: string }) => {
        if (!data.error) setDistribution(data);
      })
      .catch(console.error)
      .finally(() => setDistLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
    loadDistribution();
    // Load hourly sparkline for the multi-line chart
    const token = typeof window !== 'undefined' ? null : null; // client-side only
    fetch('/api/dashboard/metrics', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.sparkline) setSparkline(data.sparkline); })
      .catch(() => {});
  }, [loadStats, loadDistribution]);

  // Realtime: refetch when call data changes
  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try { supabase = createClient(); } catch { return; }
    const sb = supabase;

    const channel = sb
      .channel('analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
        loadStats();
        loadDistribution();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_analytics' }, () => {
        loadDistribution();
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [loadStats, loadDistribution]);

  const hourlyData = distribution?.hourlyConnects.filter((h) => h.hour >= 7 && h.hour <= 21) ?? [];
  const powerStats = distribution?.powerDialStats;
  const hasDispositions = (distribution?.dispositionBreakdown ?? []).length > 0;

  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Team performance and call outcomes" />
      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-4 lg:px-6 lg:py-5 lg:space-y-5">

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5" />
              ))
            : (stats ?? []).map((stat) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <StatCard key={stat.title} {...(stat as any)} />
              ))}
        </motion.div>

        {/* Power Dial Sessions summary (shown only if sessions exist) */}
        {powerStats && powerStats.totalSessions > 0 && (
          <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-4 lg:p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
                <Zap className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold">Power Dial Sessions</h2>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
                <p className="text-2xl font-bold text-white">{powerStats.totalSessions}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Sessions</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
                <p className="text-2xl font-bold text-white">{powerStats.avgCallsPerSession}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Avg Calls / Session</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-300">{powerStats.totalMeetings}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Meetings Booked</p>
              </div>
            </div>
          </Card>
        )}

        {/* Daily activity — hourly breakdown */}
        {sparkline.length > 0 && <MultiLineChart data={sparkline} />}

        {/* Activity chart */}
        <ActivityChart />

        <div className="grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-2">
          {/* Lead status distribution */}
          <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-4 lg:p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
            <div className="mb-4 lg:mb-5">
              <h2 className="font-display text-sm font-semibold">Lead status distribution</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">All-time breakdown by status</p>
            </div>
            {distLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : (distribution?.statusDistribution ?? []).length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                No lead data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distribution?.statusDistribution ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(distribution?.statusDistribution ?? []).map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Best call times */}
          <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-4 lg:p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
            <div className="mb-4 lg:mb-5">
              <h2 className="font-display text-sm font-semibold">Best call times</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Connects by hour of day — last 30 days</p>
            </div>
            {distLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : hourlyData.every((h) => h.connects === 0) ? (
              <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                No answered calls yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="connects" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Disposition breakdown */}
        <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-4 lg:p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
          <div className="mb-4 lg:mb-5">
            <h2 className="font-display text-sm font-semibold">Disposition breakdown</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Call outcomes from all sessions</p>
          </div>
          {distLoading ? (
            <div className="flex h-[160px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : !hasDispositions ? (
            <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
              No dispositioned calls yet — start making calls to see outcomes here
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Bar chart */}
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={distribution?.dispositionBreakdown ?? []}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "oklch(0.65 0.02 286)" }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(distribution?.dispositionBreakdown ?? []).map((entry) => (
                      <Cell key={entry.disposition} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend / summary tiles */}
              <div className="flex flex-col gap-1.5">
                {(distribution?.dispositionBreakdown ?? []).slice(0, 6).map((d) => {
                  const total = (distribution?.dispositionBreakdown ?? []).reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={d.disposition} className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="flex-1 text-xs text-slate-300">{d.label}</span>
                      <span className="font-mono text-xs font-bold text-white">{d.count}</span>
                      <span className="text-[10px] text-slate-500">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Weekly trend */}
        <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-4 lg:p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
          <div className="mb-4 lg:mb-5">
            <h2 className="font-display text-sm font-semibold">Weekly connect rate trend</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Calls, connects, and connect rate — last 4 weeks</p>
          </div>
          {distLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={distribution?.weeklyTrend ?? []} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "oklch(0.65 0.02 286)" }} />
                <Line yAxisId="left" type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line yAxisId="left" type="monotone" dataKey="connects" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="connectRate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="rate %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </main>
    </>
  );
}
