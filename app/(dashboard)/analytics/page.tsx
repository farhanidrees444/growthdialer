"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Users, CalendarCheck, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import ActivityChart from "@/components/ActivityChart";
import { Card } from "@/components/ui/card";

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
      value: `$${(data.pipelineValue / 1000).toFixed(1)}K`,
      change: data.meetingsBooked > 0 ? "+new" : "—",
      positive: data.meetingsBooked > 0,
      icon: DollarSign,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15",
      delay: 0.21,
    },
  ];
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[oklch(0.086_0.024_282)] p-3 text-xs shadow-xl shadow-black/40">
        <p className="mb-1.5 font-semibold text-foreground">{label}</p>
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

  useEffect(() => {
    fetch("/api/stats/today")
      .then((r) => r.json())
      .then((data: StatsData & { error?: string }) => {
        if (!data.error) setStats(buildStats(data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/analytics/distribution")
      .then((r) => r.json())
      .then((data: DistributionData & { error?: string }) => {
        if (!data.error) setDistribution(data);
      })
      .catch(console.error)
      .finally(() => setDistLoading(false));
  }, []);

  // Only show hours 7am–9pm for the hourly chart
  const hourlyData = distribution?.hourlyConnects.filter((h) => h.hour >= 7 && h.hour <= 21) ?? [];

  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Team performance and call outcomes" />
      <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5" />
              ))
            : (stats ?? []).map((stat) => (
                <StatCard key={stat.title} {...(stat as any)} />
              ))}
        </motion.div>

        {/* Activity chart */}
        <ActivityChart />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Lead status distribution */}
          <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
            <div className="mb-5">
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
                  <Tooltip content={<ChartTooltip />} />
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
          <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
            <div className="mb-5">
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
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="connects" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Weekly trend */}
        <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
          <div className="mb-5">
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
                <Tooltip content={<ChartTooltip />} />
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
