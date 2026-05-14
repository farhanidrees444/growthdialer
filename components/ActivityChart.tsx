"use client";

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
import { useState } from "react";

const weekData = [
  { day: "Mon", calls: 42, connected: 18, meetings: 3 },
  { day: "Tue", calls: 58, connected: 24, meetings: 5 },
  { day: "Wed", calls: 35, connected: 15, meetings: 2 },
  { day: "Thu", calls: 71, connected: 31, meetings: 7 },
  { day: "Fri", calls: 63, connected: 27, meetings: 6 },
  { day: "Sat", calls: 12, connected: 4, meetings: 1 },
  { day: "Sun", calls: 8, connected: 2, meetings: 0 },
];

const monthData = [
  { day: "W1", calls: 210, connected: 88, meetings: 18 },
  { day: "W2", calls: 268, connected: 112, meetings: 24 },
  { day: "W3", calls: 195, connected: 79, meetings: 15 },
  { day: "W4", calls: 289, connected: 134, meetings: 31 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg p-3 shadow-md text-xs">
        <p className="font-semibold mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 capitalize">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ActivityChart() {
  const [range, setRange] = useState("week");
  const data = range === "week" ? weekData : monthData;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-sm">Call Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Calls, connects & meetings booked</p>
        </div>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList className="h-7 text-xs">
            <TabsTrigger value="week" className="text-xs px-3 h-5">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3 h-5">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
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
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
