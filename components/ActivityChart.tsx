"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Bucket {
  day: string;
  calls: number;
  connected: number;
  meetings: number;
}

const FALLBACK_WEEK: Bucket[] = [
  { day: "Mon", calls: 0, connected: 0, meetings: 0 },
  { day: "Tue", calls: 0, connected: 0, meetings: 0 },
  { day: "Wed", calls: 0, connected: 0, meetings: 0 },
  { day: "Thu", calls: 0, connected: 0, meetings: 0 },
  { day: "Fri", calls: 0, connected: 0, meetings: 0 },
  { day: "Sat", calls: 0, connected: 0, meetings: 0 },
  { day: "Sun", calls: 0, connected: 0, meetings: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[oklch(0.09_0.006_285)] p-3 text-xs shadow-xl shadow-black/40">
        <p className="mb-1.5 font-semibold text-foreground">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 capitalize">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ActivityChart() {
  const [range, setRange] = useState("week");
  const [data, setData] = useState<Bucket[]>(FALLBACK_WEEK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/activity?period=${range}`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setData(res.data);
        } else {
          setData(FALLBACK_WEEK.slice(0, range === "week" ? 7 : 30));
        }
      })
      .catch((err) => {
        console.error("ActivityChart fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <Card className="border-white/10 bg-[oklch(0.09_0.006_285)]/95 p-5 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold">Call activity</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Calls &amp; connects — last 7 days</p>
        </div>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList className="h-7 border border-white/10 bg-white/5 text-xs">
            <TabsTrigger
              value="week"
              className="h-5 px-3 text-xs data-active:bg-brand/20 data-active:text-brand"
            >
              Week
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="h-5 px-3 text-xs data-active:bg-brand/20 data-active:text-brand"
            >
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="connectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="meetingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.65 0.02 286)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#callsGrad)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="connected"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#connectedGrad)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="meetings"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#meetingsGrad)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "oklch(0.65 0.02 286)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
