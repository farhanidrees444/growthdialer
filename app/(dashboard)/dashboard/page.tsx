"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Upload, Users, BarChart2,
  CalendarCheck, DollarSign, Info,
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

// Static fallback data shown when no real calls exist yet
const DEMO_STATS = [
  {
    title: "Calls Today",
    value: "63",
    change: "+18%",
    positive: true,
    icon: Phone,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
    delay: 0,
  },
  {
    title: "Connect Rate",
    value: "34.9%",
    change: "+4.2%",
    positive: true,
    icon: Users,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    delay: 0.07,
  },
  {
    title: "Meetings Booked",
    value: "7",
    change: "+2",
    positive: true,
    icon: CalendarCheck,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15",
    delay: 0.14,
  },
  {
    title: "Pipeline Value",
    value: "$48.2K",
    change: "-3.1%",
    positive: false,
    icon: DollarSign,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
    delay: 0.21,
  },
];

function buildLiveStats(data: {
  callsToday: number;
  connectRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  yesterday: { calls: number; connectRate: number };
}) {
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
      change: `+${data.meetingsBooked}`,
      positive: true,
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
              Parallel lines and disposition sync to your CRM.
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
  const [stats, setStats] = useState<ReturnType<typeof buildLiveStats> | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/today')
      .then((r) => r.json())
      .then((data) => {
        if (data.error || data.callsToday === 0) {
          setIsDemo(true);
          setStats(DEMO_STATS as any);
        } else {
          setIsDemo(false);
          setStats(buildLiveStats(data));
        }
      })
      .catch(() => {
        setIsDemo(true);
        setStats(DEMO_STATS as any);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayStats = stats ?? DEMO_STATS;

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

        {isDemo && !loading && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Demo data shown — make your first call to see real stats here.
          </div>
        )}

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
