'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Loader2, Phone, TrendingUp, Users } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';

interface AgentMetric {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  calls: number;
  connects: number;
  meetings: number;
  talk_time_seconds: number;
  connect_rate: number;
}

function fmtTalk(seconds: number) {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function TeamPerformancePanel() {
  const { currentWorkspace, can } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [totals, setTotals] = useState({ calls: 0, connects: 0, meetings: 0 });

  const visible = can('VIEW_TEAM_ANALYTICS');

  const load = useCallback(async () => {
    if (!currentWorkspace || !visible) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/team-metrics?days=${days}`);
      if (res.ok) {
        const data = await res.json() as {
          agents: AgentMetric[];
          totals: { calls: number; connects: number; meetings: number };
        };
        setAgents(data.agents ?? []);
        setTotals(data.totals ?? { calls: 0, connects: 0, meetings: 0 });
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [currentWorkspace, days, visible]);

  useEffect(() => { void load(); }, [load]);

  if (!visible || !currentWorkspace) return null;

  const teamConnectRate = totals.calls > 0
    ? Math.round((totals.connects / totals.calls) * 1000) / 10
    : 0;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Team performance</h3>
          <span className="text-[10px] uppercase tracking-widest text-slate-600">Manager view</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                days === d ? 'bg-white/[0.10] text-white' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Calls', value: totals.calls, icon: Phone },
          { label: 'Connect rate', value: `${teamConnectRate}%`, icon: TrendingUp },
          { label: 'Meetings', value: totals.meetings, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-slate-500" />
            <p className="text-lg font-bold text-white tabular-nums">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading team stats…
        </div>
      ) : agents.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No call activity in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-slate-600">
                <th className="pb-2 pr-4 font-semibold">Rep</th>
                <th className="pb-2 pr-4 font-semibold">Calls</th>
                <th className="pb-2 pr-4 font-semibold">Connects</th>
                <th className="pb-2 pr-4 font-semibold">Rate</th>
                <th className="pb-2 pr-4 font-semibold">Meetings</th>
                <th className="pb-2 font-semibold">Talk time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {agents.map((a) => (
                <tr key={a.user_id} className="text-slate-300">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-white">{a.full_name ?? a.email ?? 'Unknown'}</p>
                    <p className="text-[11px] capitalize text-slate-600">{a.role}</p>
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">{a.calls}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{a.connects}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{a.connect_rate}%</td>
                  <td className="py-2.5 pr-4 tabular-nums">{a.meetings}</td>
                  <td className="py-2.5 tabular-nums">{fmtTalk(a.talk_time_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
