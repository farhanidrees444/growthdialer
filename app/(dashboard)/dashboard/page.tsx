"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Upload, Users, BarChart2,
  CalendarCheck, DollarSign, Info,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DialerWidget from "@/components/DialerWidget";
import LeadsQueue from "@/components/LeadsQueue";
import RecentActivity from "@/components/RecentActivity";
import MetricCardWithSparkline from "@/components/dashboard/metric-card-with-sparkline";
import AIHoursSavedCard from "@/components/dashboard/ai-hours-saved-card";
import SpamShieldCard from "@/components/dashboard/spam-shield-card";
import LiveTerminal from "@/components/dashboard/live-terminal";
import MultiLineChart from "@/components/dashboard/multi-line-chart";
import SystemHealthDropdown from "@/components/dashboard/system-health-dropdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function QuickActions() {
  const { setImportOpen } = useLeads();
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/90 p-4 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors hover:border-brand/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15">
            <Upload className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">Import leads</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              CSV from CRM or spreadsheet — map columns on upload.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 h-8 bg-brand px-3 text-xs font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]"
              onClick={() => setImportOpen(true)}
            >
              Upload CSV
            </Button>
          </div>
        </div>
      </Card>
      <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/90 p-4 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors hover:border-brand/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">Review queue</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prioritized by AI score — dial from the top or skip.
            </p>
            <Link href="/leads">
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 border-white/15 bg-white/5 text-xs hover:bg-white/10"
              >
                Open leads
              </Button>
            </Link>
          </div>
        </div>
      </Card>
      <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/90 p-4 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors hover:border-brand/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <Phone className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">Start dialing</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Disposition sync and real-time progress tracking.
            </p>
            <Link href="/dialer">
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 border-white/15 bg-white/5 text-xs hover:bg-white/10"
              >
                Open dialer
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const session = useSupabaseSession();
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
    {
      title: "Pipeline Value",
      value: "$0",
      change: "—",
      positive: true,
      neutral: true,
      icon: DollarSign,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15",
      delay: 0.21,
      dataKey: "ai" as const,
      areaColor: "#e879f9",
      areaGradientId: "ai-grad",
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

        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand">Today</p>
            <p className="font-display text-base lg:text-lg font-semibold">Pipeline & activity</p>
          </div>
          <Link href="/analytics">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-white/15 bg-white/5 text-xs hover:bg-white/10"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Full analytics
            </Button>
          </Link>
        </div>

        <QuickActions />

        {/* Stat cards with sparklines */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 lg:gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5"
                />
              ))
            : statCards.map((card) => (
                <MetricCardWithSparkline
                  key={card.title}
                  {...card}
                  sparkline={sparkline}
                />
              ))}
        </div>

        {/* Multi-line chart */}
        {!loading && <MultiLineChart data={sparkline} />}
        {loading && (
          <div className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        )}

        {/* AI moat row */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <AIHoursSavedCard data={m.aiHoursSaved} loading={loading} />
          <SpamShieldCard data={m.spamShield} loading={loading} />
        </div>

        {/* Dialer + Terminal */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          <div className="lg:col-span-1">
            <DialerWidget />
          </div>
          <div className="lg:col-span-2">
            <LiveTerminal />
          </div>
        </div>

        {/* Leads queue + Recent activity */}
        <div className="grid grid-cols-1 gap-3 pb-2 lg:grid-cols-3 lg:gap-4">
          <div className="lg:col-span-2">
            <LeadsQueue limit={5} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>

      </main>
    </>
  );
}
