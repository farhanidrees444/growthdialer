"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Users, CalendarCheck, Info } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCardWithSparkline from "@/components/dashboard/metric-card-with-sparkline";
import AIHoursSavedCard from "@/components/dashboard/ai-hours-saved-card";
import ActiveDialerPreview from "@/components/dashboard/active-dialer-preview";
import UpNextQueue from "@/components/dashboard/up-next-queue";
import LiveTerminal from "@/components/dashboard/live-terminal";
import SystemHealthDropdown from "@/components/dashboard/system-health-dropdown";
import { useLeads } from "@/contexts/leads-context";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import { createClient } from "@/lib/supabase/client";
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

export default function DashboardPage() {
  const session = useSupabaseSession();
  const { leads } = useLeads();
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadsInQueue, setLeadsInQueue] = useState(0);
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

  // Refresh queue count when leads context changes
  useEffect(() => {
    fetch('/api/leads/queue?limit=1&status=queued,new,callback')
      .then((r) => r.json())
      .then((data) => setLeadsInQueue(data.count ?? 0))
      .catch(() => {});
  }, [leads]);

  // Realtime: refetch metrics when calls or analytics change
  useEffect(() => {
    if (!session?.user?.id) return;
    let supabase: ReturnType<typeof createClient> | null = null;
    try { supabase = createClient(); } catch { return; }
    const sb = supabase;

    const channel = sb
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `user_id=eq.${session.user.id}` },
        () => { if (tokenRef.current) fetchMetrics(tokenRef.current); },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_analytics' },
        () => { if (tokenRef.current) fetchMetrics(tokenRef.current); },
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [session?.user?.id, fetchMetrics]);

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

          {/* Left — dialer focal point + compact activity log */}
          <div className="flex flex-col gap-3 lg:col-span-8">
            <ActiveDialerPreview leadsInQueue={leadsInQueue} />
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
