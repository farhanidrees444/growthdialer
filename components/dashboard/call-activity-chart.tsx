'use client';

import Link from 'next/link';
import { Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { MiniWave } from '@/components/marketing/live-floor/LiveWaveform';
import { ShimmerSkeleton } from '@/components/ui/shimmer-skeleton';
import { WorkflowSceneMotion } from '@/components/ui/workflow-scene-motion';
import { cn } from '@/lib/utils';
import type { HourlyMetricPoint } from '@/lib/dashboard-types';

export interface DailyPoint {
  label: string;
  calls: number;
  connected: number;
}

const premiumPanel =
  'relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl';

function fmtHour(h: number): string {
  if (h === 0) return '12A';
  if (h === 12) return '12P';
  return h > 12 ? `${h - 12}P` : `${h}A`;
}

export function CallActivityChart({
  sparkline,
  weeklyData,
  weeklyLoading,
  timeRange,
  onTimeRangeChange,
}: {
  sparkline: HourlyMetricPoint[];
  weeklyData: DailyPoint[] | null;
  weeklyLoading: boolean;
  timeRange: '24H' | '7D';
  onTimeRangeChange: (r: '24H' | '7D') => void;
}) {
  const nowHour = new Date().getHours();
  const chart24H = Array.from({ length: 24 }, (_, i) => {
    const h = (nowHour - 23 + i + 24) % 24;
    const pt = sparkline.find((p) => p.hour === h);
    return { label: fmtHour(h), calls: pt?.calls ?? 0, connected: pt?.connected ?? 0 };
  });

  const chartData = timeRange === '24H' ? chart24H : (weeklyData ?? []);
  const nonZeroPoints = chartData.filter((p) => p.calls > 0 || p.connected > 0).length;
  const anyData = nonZeroPoints > 0;
  const enoughToChart = nonZeroPoints >= 2;

  return (
    <div data-gsap-reveal className={premiumPanel}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.13),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(6,182,212,0.09),transparent_30%)]"
        aria-hidden
      />
      <div className="relative flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
            <Activity className="h-4 w-4 text-violet-300" />
          </span>
          <h3 className="text-sm font-semibold text-white">Call Activity</h3>
          <MiniWave className="h-3.5 opacity-80" />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.06] bg-black/20 p-0.5">
          {(['24H', '7D'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onTimeRangeChange(r)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                timeRange === r ? 'bg-white/[0.09] text-white' : 'text-slate-600 hover:text-slate-400',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {weeklyLoading && timeRange === '7D' ? (
        <div className="px-5 pb-5">
          <ShimmerSkeleton className="h-[240px] w-full lg:h-[280px]" rounded="rounded-xl" />
        </div>
      ) : enoughToChart ? (
        <>
          <div className="relative h-[240px] px-2 lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="act-calls-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="act-conn-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={timeRange === '24H' ? 3 : 0}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-white/10 bg-[oklch(0.1_0.006_285)] px-3 py-2 text-xs shadow-xl">
                        <p className="mb-1 font-medium text-slate-300">{String(label ?? '')}</p>
                        {payload.map((p) => (
                          <p key={String(p.name)} style={{ color: String(p.color ?? '#fff') }}>
                            {p.name}: {p.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="Calls Made"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#act-calls-grad)"
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="connected"
                  name="Connected"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fill="url(#act-conn-grad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end gap-4 px-5 pb-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 rounded bg-[#8B5CF6]" />
              <span className="text-[10px] text-slate-500">Calls Made</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-[2px] w-3 rounded bg-[#06B6D4]" />
              <span className="text-[10px] text-slate-500">Connected</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[240px] flex-col items-center justify-center gap-4 px-5 lg:h-[280px]">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60 shadow-[0_0_45px_rgba(139,92,246,0.12)]">
            <WorkflowSceneMotion scene="analytics" />
          </div>
          <p className="max-w-xs text-center text-sm text-slate-500">
            {anyData
              ? 'Your activity chart builds as more calls come in'
              : 'Start a call to build your activity timeline'}
          </p>
          <Link
            href="/dialer"
            className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-white"
          >
            Go to dialer
          </Link>
        </div>
      )}
    </div>
  );
}
