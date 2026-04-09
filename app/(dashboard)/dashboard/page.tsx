"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Upload, Users, BarChart2 } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import DialerWidget from "@/components/DialerWidget";
import LeadsQueue from "@/components/LeadsQueue";
import ActivityChart from "@/components/ActivityChart";
import RecentActivity from "@/components/RecentActivity";
import { dashboardStats } from "@/lib/dashboard-stats";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/contexts/leads-context";

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
          {dashboardStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
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
