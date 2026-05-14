"use client";

import { motion } from "framer-motion";
import {
  Phone,
  Users,
  CalendarCheck,
  DollarSign,
  Bell,
  Search,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import DialerWidget from "@/components/DialerWidget";
import LeadsQueue from "@/components/LeadsQueue";
import ActivityChart from "@/components/ActivityChart";
import RecentActivity from "@/components/RecentActivity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Calls Today",
    value: "63",
    change: "+18%",
    positive: true,
    icon: Phone,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100",
    delay: 0,
  },
  {
    title: "Connect Rate",
    value: "34.9%",
    change: "+4.2%",
    positive: true,
    icon: Users,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    delay: 0.07,
  },
  {
    title: "Meetings Booked",
    value: "7",
    change: "+2",
    positive: true,
    icon: CalendarCheck,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    delay: 0.14,
  },
  {
    title: "Pipeline Value",
    value: "$48.2K",
    change: "-3.1%",
    positive: false,
    icon: DollarSign,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    delay: 0.21,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10"
        >
          <div>
            <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Tuesday, April 8 · Good morning, Alex</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              <Search className="w-3.5 h-3.5" />
              Search leads
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </Button>
            <Badge className="bg-emerald-500 text-white text-xs px-2.5 gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
              Online
            </Badge>
          </div>
        </motion.header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* KPI Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Middle row: Dialer + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <DialerWidget />
            </div>
            <div className="lg:col-span-2">
              <ActivityChart />
            </div>
          </div>

          {/* Bottom row: Leads queue + Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-2">
            <div className="lg:col-span-2">
              <LeadsQueue />
            </div>
            <div className="lg:col-span-1">
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
