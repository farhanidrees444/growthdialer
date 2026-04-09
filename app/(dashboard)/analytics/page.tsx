"use client";

export const dynamic = 'force-dynamic';

import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import ActivityChart from "@/components/ActivityChart";
import { dashboardStats } from "@/lib/dashboard-stats";

export default function AnalyticsPage() {
  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Team performance and call outcomes" />
      <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {dashboardStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </motion.div>
        <ActivityChart />
      </main>
    </>
  );
}
