'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Trophy, Phone, Target, Calendar } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';

interface RankRow {
  rank: number;
  user_id: string;
  full_name: string | null;
  role: string;
  calls: number;
  connects: number;
  meetings: number;
  connect_rate: number;
  points: number;
}

const PERIODS = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
] as const;

export default function LeaderboardPage() {
  const { currentWorkspace, apiFetch } = useWorkspace();
  const [days, setDays] = useState(7);
  const [rankings, setRankings] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    void apiFetch(`/api/workspaces/${currentWorkspace.id}/leaderboard?days=${days}`)
      .then((r) => r.json())
      .then((d: { rankings?: RankRow[] }) => setRankings(d.rankings ?? []))
      .finally(() => setLoading(false));
  }, [apiFetch, currentWorkspace?.id, days]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-3xl">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Team Leaderboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Points from connects, meetings, and outcomes</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                days === p.days ? 'bg-violet-500/20 text-violet-200' : 'text-slate-500 hover:text-white',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl space-y-2">
        {loading && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-slate-500">
            Loading rankings…
          </div>
        )}
        {!loading && rankings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center text-sm text-slate-500">
            No call activity in this period. Start dialing to climb the board.
          </div>
        )}
        {rankings.map((row) => (
          <div
            key={row.user_id}
            className={cn(
              'flex items-center gap-4 rounded-2xl border px-4 py-4 transition-colors',
              row.rank <= 3
                ? 'border-amber-500/20 bg-amber-500/[0.04]'
                : 'border-white/[0.06] bg-white/[0.02]',
            )}
          >
            <span className="w-8 text-center text-lg font-bold text-slate-400">
              {row.rank <= 3 ? medals[row.rank - 1] : row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white truncate">{row.full_name ?? 'Agent'}</p>
              <p className="text-xs text-slate-500 capitalize">{row.role}</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row.calls}</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />{row.connect_rate}%</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{row.meetings}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-violet-300">{row.points}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-600">pts</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
