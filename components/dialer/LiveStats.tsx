'use client';

import { Phone, Users, CalendarCheck, TrendingUp, type LucideIcon } from 'lucide-react';

interface LiveStatsProps {
  calls: number;
  connects: number;
  meetings: number;
  connectRate: number;
}

const STATS: Array<{
  key: 'calls' | 'connects' | 'meetings' | 'connectRate';
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  isRate?: boolean;
}> = [
  { key: 'calls', label: 'Calls Today', icon: Phone, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'connects', label: 'Connects', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'meetings', label: 'Meetings', icon: CalendarCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'connectRate', label: 'Connect Rate', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', isRate: true },
];

export default function LiveStats({ calls, connects, meetings, connectRate }: LiveStatsProps) {
  const values = { calls, connects, meetings, connectRate };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Live Session</p>
        <h1 className="mt-1 text-xl font-bold text-white">AI Dialer</h1>
        <p className="mt-0.5 text-[11px] text-slate-500">Powered by smart routing &amp; call intelligence</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(({ key, label, icon: Icon, color, bg, isRate }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-0.5 text-lg font-bold text-white">
                {isRate
                  ? `${connectRate.toFixed(1)}%`
                  : (values[key] as number)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
