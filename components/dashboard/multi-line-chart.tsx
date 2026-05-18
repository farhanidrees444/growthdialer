"use client";

import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HourlyMetricPoint } from "@/lib/dashboard-types";

const METRICS = [
  { key: "calls" as const, label: "Total Calls", color: "#818cf8" },
  { key: "connected" as const, label: "Connected", color: "#34d399" },
  { key: "meetings" as const, label: "Meetings", color: "#fbbf24" },
  { key: "ai" as const, label: "AI Processed", color: "#e879f9" },
];

interface MultiLineChartProps {
  data: HourlyMetricPoint[];
}

export default function MultiLineChart({ data }: MultiLineChartProps) {
  const [active, setActive] = useState<Set<string>>(
    new Set(["calls", "connected", "meetings", "ai"])
  );

  function toggle(key: string) {
    setActive((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const monoStyle = { fontFamily: "monospace" };

  return (
    <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Activity — Today (hourly)</p>
        <div className="flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => toggle(m.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                active.has(m.key)
                  ? "border-white/20 bg-white/10 text-foreground"
                  : "border-white/10 bg-transparent text-muted-foreground"
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={3}
              style={monoStyle}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              style={monoStyle}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(0.1 0.02 282)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              itemStyle={{ color: "rgba(255,255,255,0.9)" }}
            />
            {METRICS.filter((m) => active.has(m.key)).map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name={m.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
