"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Upload, Users, BarChart2,
  CalendarCheck, DollarSign,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import DialerWidget from "@/components/DialerWidget";
import LeadsQueue from "@/components/LeadsQueue";
import ActivityChart from "@/components/ActivityChart";
import RecentActivity from "@/components/RecentActivity";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/contexts/leads-context";

interface StatsData {
  callsToday: number;
  connectRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  yesterday: { calls: number; connectRate: number };
}

function buildStats(data: StatsData) {
  const hasYesterdayData = data.yesterday.calls > 0 || data.callsToday > 0;
  const callDelta = data.callsToday - data.yesterday.calls;
  const rateDelta = data.connectRate - data.yesterday.connectRate;

  return [
    {
      title: "Calls Today",
      value: String(data.callsToday),
      change: hasYesterdayData ? (callDelta >= 0 ? `+${callDelta}` : String(callDelta)) : "—",
      positive: callDelta >= 0,
      neutral: !hasYesterdayData,
      icon: Phone,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/15",
      delay: 0,
    },
    {
      title: "Connect Rate",
      value: `${data.connectRate.toFixed(1)}%`,
      change: hasYesterdayData ? (rateDelta >= 0 ? `+${rateDelta.toFixed(1)}%` : `${rateDelta.toFixed(1)}%`) : "—",
      positive: rateDelta >= 0,
      neutral: !hasYesterdayData,
      icon: Users,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
      delay: 0.07,
    },
    {
      title: "Meetings Booked",
      value: String(data.meetingsBooked),
      change: hasYesterdayData ? `+${data.meetingsBooked}` : "—",
      positive: data.meetingsBooked >= 0,
      neutral: !hasYesterdayData,
      icon: CalendarCheck,
      iconColor: "text-amber-300",
      iconBg: "bg-amber-500/15",
      delay: 0.14,
    },
    {
      title: "Pipeline Value",
      value: data.pipelineValue > 0 ? `$${(data.pipelineValue / 1000).toFixed(1)}K` : "$0",
      change: "—",
      positive: true,
      neutral: true,
      icon: DollarSign,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15",
      delay: 0.21,
    },
  ];
}

const EMPTY_STATS: StatsData = {
  callsToday: 0,
  connectRate: 0,
  meetingsBooked: 0,
  pipelineValue: 0,
  yesterday: { calls: 0, connectRate: 0 },
};

function QuickActions() {
  const { setImportOpen } = useLeads();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
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
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/today')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStatsData({
            callsToday: data.callsToday ?? 0,
            connectRate: data.connectRate ?? 0,
            meetingsBooked: data.meetingsBooked ?? 0,
            pipelineValue: data.pipelineValue ?? 0,
            yesterday: {
              calls: data.yesterday?.calls ?? 0,
              connectRate: data.yesterday?.connectRate ?? 0,
            },
          });
        } else {
          setStatsData(EMPTY_STATS);
        }
      })
      .catch(() => setStatsData(EMPTY_STATS))
      .finally(() => setLoading(false));
  }, []);

  const displayStats = buildStats(statsData ?? EMPTY_STATS);

  return (
    <>
      <DashboardHeader title="Dashboard" />

      <main className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand">Today</p>
            <p className="font-display text-lg font-semibold">Pipeline & activity</p>
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

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5"
                />
              ))
            : displayStats.map((stat) => (
                <StatCard key={stat.title} {...(stat as any)} />
              ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <DialerWidget />
          </div>
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pb-2 lg:grid-cols-3">
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
