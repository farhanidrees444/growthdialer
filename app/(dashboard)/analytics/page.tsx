"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Users, CalendarCheck, DollarSign } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import ActivityChart from "@/components/ActivityChart";

interface StatsData {
  callsToday: number;
  connectRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  yesterday: { calls: number; connectRate: number };
}

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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ReturnType<typeof buildStats> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/today")
      .then((r) => r.json())
      .then((data: StatsData & { error?: string }) => {
        if (!data.error) setStats(buildStats(data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Team performance and call outcomes" />
      <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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
        <ActivityChart />
      </main>
    </>
  );
}
