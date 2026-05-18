"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HourlyMetricPoint } from "@/lib/dashboard-types";

interface MetricCardWithSparklineProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  neutral?: boolean;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  delay?: number;
  sparkline: HourlyMetricPoint[];
  dataKey: keyof Pick<HourlyMetricPoint, "calls" | "connected" | "meetings" | "ai">;
  areaColor: string;
  areaGradientId: string;
}

export default function MetricCardWithSparkline({
  title,
  value,
  change,
  positive,
  neutral = false,
  icon: Icon,
  iconColor,
  iconBg,
  delay = 0,
  sparkline,
  dataKey,
  areaColor,
  areaGradientId,
}: MetricCardWithSparklineProps) {
  const isNeutral = neutral || change === "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 shadow-lg shadow-black/25 backdrop-blur-sm overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/30">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                isNeutral ? "text-slate-500" : positive ? "text-emerald-400" : "text-red-400"
              )}
            >
              {isNeutral ? (
                <Minus className="h-3.5 w-3.5" />
              ) : positive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{change} vs yesterday</span>
            </div>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10",
              iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
        <div className="h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-white/10 bg-[oklch(0.1_0.02_282)] px-2 py-1 text-xs shadow-xl">
                      <p className="font-semibold">{payload[0].payload.label}</p>
                      <p className="text-muted-foreground">{payload[0].value} {dataKey}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={areaColor}
                strokeWidth={1.5}
                fill={`url(#${areaGradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
