"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Users, CalendarCheck, Info } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCardWithSparkline from "@/components/dashboard/metric-card-with-sparkline";
import AIHoursSavedCard from "@/components/dashboard/ai-hours-saved-card";
import UpNextQueue from "@/components/dashboard/up-next-queue";
import LiveTerminal from "@/components/dashboard/live-terminal";
import SystemHealthDropdown from "@/components/dashboard/system-health-dropdown";
import { useLeads } from "@/contexts/leads-context";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { createClient } from "@/lib/supabase/client";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SystemMetricsData, HourlyMetricPoint } from "@/lib/dashboard-types";

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

function fmtHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function CallFrequencyChart({ sparkline }: { sparkline: HourlyMetricPoint[] }) {
  const nowHour = new Date().getHours();
  const hourWindow = Array.from({ length: 12 }, (_, i) => (nowHour - 11 + i + 24) % 24);
  const chartData = hourWindow.map((h) => {
    const pt = sparkline.find((p) => p.hour === h);
    return { hour: h, display: fmtHour(h), calls: pt?.calls ?? 0, connected: pt?.connected ?? 0 };
  });
  const hasData = chartData.some((p) => p.calls > 0 || p.connected > 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[oklch(0.07_0.02_286)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white">Live Call Frequency</h3>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-4 rounded bg-cyan-400" />
            <span className="text-[10px] text-slate-500">Calls Made</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-4 rounded bg-violet-400" />
            <span className="text-[10px] text-slate-500">Connected</span>
          </div>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="calls-freq-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="conn-freq-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="display"
              tick={{ fill: "#475569", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-white/10 bg-[oklch(0.1_0.02_282)] px-3 py-2 text-xs shadow-xl">
                    <p className="mb-1 font-medium text-slate-300">{String(label ?? "")}</p>
                    {payload.map((p) => (
                      <p key={String(p.name)} style={{ color: String(p.color ?? "#fff") }}>
                        {p.name}: {p.value}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="calls"
              name="Calls Made"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#calls-freq-grad)"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="connected"
              name="Connected"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#conn-freq-grad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-slate-600">No calls yet today — start dialing</p>
        </div>
      )}
    </div>
  );
}

function FleetStatusBadge() {
  const [activeCount, setActiveCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("purchased_numbers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .then(({ count }) => setActiveCount(count ?? 0));
  }, []);

  if (activeCount === null) return null;

  const isActive = activeCount > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "flex cursor-default items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
            isActive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-400",
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              isActive ? "animate-pulse bg-emerald-400" : "bg-amber-400",
            )}
          />
          {isActive
            ? `${activeCount} Trunk Hub${activeCount !== 1 ? "s" : ""} Active`
            : "No Hubs Configured"}
        </TooltipTrigger>
        <TooltipContent>
          <p>Active SIP trunk connections</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DashboardPage() {
  const session = useSupabaseSession();
  const { leads } = useLeads();
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const fetchMetrics = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/dashboard/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as SystemMetricsData;
        setMetrics(data);
      } else {
        setMetrics(EMPTY_METRICS);
      }
    } catch {
      setMetrics(EMPTY_METRICS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    tokenRef.current = session.access_token;
    fetchMetrics(session.access_token);
  }, [session?.access_token, fetchMetrics]);

  // Realtime: refetch metrics when calls or analytics change
  useEffect(() => {
    if (!session?.user?.id) return;
    let supabase: ReturnType<typeof createClient> | null = null;
    try { supabase = createClient(); } catch { return; }
    const sb = supabase;

    const channel = sb
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls", filter: `user_id=eq.${session.user.id}` },
        () => { if (tokenRef.current) fetchMetrics(tokenRef.current); },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_analytics" },
        () => { if (tokenRef.current) fetchMetrics(tokenRef.current); },
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [session?.user?.id, fetchMetrics]);

  // Keep leads context alive (used by other sidebar badge)
  void leads;

  const m = metrics ?? EMPTY_METRICS;
  const sparkline = m.sparkline;

  const todayCalls = sparkline.reduce((s, p) => s + p.calls, 0);
  const todayConnected = sparkline.reduce((s, p) => s + p.connected, 0);
  const todayMeetings = sparkline.reduce((s, p) => s + p.meetings, 0);
  const connectRate = todayCalls > 0 ? (todayConnected / todayCalls) * 100 : 0;

  const statCards = [
    {
      title: "Calls Today",
      value: String(todayCalls),
      change: "—",
      positive: true,
      neutral: true,
      icon: Phone,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/15",
      delay: 0,
      dataKey: "calls" as const,
      areaColor: "#818cf8",
      areaGradientId: "calls-grad",
    },
    {
      title: "Connect Rate",
      value: `${connectRate.toFixed(1)}%`,
      change: "—",
      positive: true,
      neutral: true,
      icon: Users,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
      delay: 0.07,
      dataKey: "connected" as const,
      areaColor: "#34d399",
      areaGradientId: "connected-grad",
    },
    {
      title: "Meetings Booked",
      value: String(todayMeetings),
      change: "—",
      positive: true,
      neutral: true,
      icon: CalendarCheck,
      iconColor: "text-amber-300",
      iconBg: "bg-amber-500/15",
      delay: 0.14,
      dataKey: "meetings" as const,
      areaColor: "#fbbf24",
      areaGradientId: "meetings-grad",
    },
  ];

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        titleExtra={<FleetStatusBadge />}
        actions={<SystemHealthDropdown />}
      />

      <main className="flex-1 space-y-4 overflow-y-auto px-3 py-3 lg:space-y-5 lg:px-6 lg:py-5">

        {/* Empty state banner */}
        <AnimatePresence>
          {!loading && !m.hasRealData && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/8 px-4 py-3"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-medium text-brand">Showing baseline data</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Start making calls to see your real metrics here. All charts will populate automatically.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone 1: Hero stat cards */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
              ))
            : statCards.map((card) => (
                <MetricCardWithSparkline
                  key={card.title}
                  {...card}
                  sparkline={sparkline}
                />
              ))}
        </div>

        {/* Zone 2 + 3: Command center grid */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">

          {/* Left — live frequency chart + compact activity log */}
          <div className="flex flex-col gap-3 lg:col-span-8">
            {loading ? (
              <div className="h-[264px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ) : (
              <CallFrequencyChart sparkline={sparkline} />
            )}
            <LiveTerminal compact />
          </div>

          {/* Right — Up next queue */}
          <div className="lg:col-span-4">
            <UpNextQueue />
          </div>
        </div>

        {/* AI Hours Saved — shown only once there's real data */}
        {!loading && m.aiHoursSaved.total > 0 && (
          <AIHoursSavedCard data={m.aiHoursSaved} loading={false} />
        )}

        <div className="pb-2 text-center">
          <Link
            href="/analytics"
            className="text-xs text-slate-600 transition-colors hover:text-slate-400"
          >
            View full analytics →
          </Link>
        </div>

      </main>
    </>
  );
}
