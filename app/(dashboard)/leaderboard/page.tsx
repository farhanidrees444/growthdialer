'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Phone, Target, Calendar, Loader2, Brain, Clock } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader, PeriodToggle } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import {
  SoloLeaderboardFloor,
  PodiumPlaceholder,
  PodiumCard,
  type LeaderboardRow,
} from '@/components/leaderboard/solo-floor';
import { PlanGate } from '@/lib/plan/plan-guard';
import { UpgradePrompt } from '@/lib/plan/upgrade-prompt';

const PERIODS = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
] as const;

type Metric = 'points' | 'calls' | 'talk_time' | 'deals' | 'ai_score';

const METRICS: Array<{ value: Metric; label: string }> = [
  { value: 'calls', label: 'Calls Made' },
  { value: 'talk_time', label: 'Talk Time' },
  { value: 'deals', label: 'Deals Booked' },
  { value: 'ai_score', label: 'AI Score' },
];

function initials(name: string | null) {
  const n = name ?? 'Agent';
  return n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/** Classic podium order: 2nd · 1st · 3rd */
function buildPodiumSlots(rankings: LeaderboardRow[]): (LeaderboardRow | null)[] {
  const byRank = new Map(rankings.filter((r) => r.rank <= 3).map((r) => [r.rank, r]));
  return [byRank.get(2) ?? null, byRank.get(1) ?? null, byRank.get(3) ?? null];
}

export default function LeaderboardPage() {
  const { currentWorkspace, apiFetch } = useWorkspace();
  const [days, setDays] = useState(7);
  const [rankings, setRankings] = useState<LeaderboardRow[]>([]);
  const [solo, setSolo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>('calls');

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    void apiFetch(`/api/workspaces/${currentWorkspace.id}/leaderboard?days=${days}&metric=${metric}`)
      .then((r) => r.json())
      .then((d: { rankings?: LeaderboardRow[]; solo?: boolean }) => {
        if (cancelled) return;
        setRankings(d.rankings ?? []);
        setSolo(d.solo ?? (d.rankings?.length ?? 0) <= 1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiFetch, currentWorkspace?.id, days, metric]);

  const rest = rankings.filter((r) => r.rank > 3);
  const podiumSlots = buildPodiumSlots(rankings);
  const showSolo = !loading && solo && rankings.length === 1;
  const showPodium = !loading && rankings.length > 0 && !showSolo;
  const showEmpty = !loading && rankings.length === 0;

  return (
    <PlanGate
      feature="leaderboard"
      fallback={
        <main className="flex flex-1 items-center justify-center p-6">
          <UpgradePrompt
            feature="leaderboard"
            title="Unlock leaderboards"
            description="Growth includes team rankings and performance comparisons."
            className="max-w-md"
          />
        </main>
      }
    >
      <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Team Leaderboard"
          description={
            solo
              ? 'You’re on a solo floor — invite teammates to unlock live rankings.'
              : 'Live salesfloor rankings — points from connects, meetings, and outcomes.'
          }
          icon={Trophy}
          badge={solo ? 'Solo' : 'Live'}
        >
          <PeriodToggle value={days} onChange={setDays} periods={PERIODS} />
        </PageHeader>

        <div className="mb-5 flex flex-wrap gap-2">
          {METRICS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMetric(item.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                metric === item.value
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-100'
                  : 'border-white/10 bg-black/30 text-slate-400 hover:bg-white/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground">Loading rankings…</p>
          </div>
        )}

        {showEmpty && (
          <PremiumEmptyState
            icon={Trophy}
            scene="leaderboard"
            title="No activity yet"
            description="Start dialing — your points appear here as calls complete. Invite reps from Team to race on connect rate."
            primaryAction={{ label: 'Open dialer', href: '/dialer' }}
            secondaryAction={{ label: 'Invite teammates', href: '/team' }}
            accent="violet"
          />
        )}

        {showSolo && rankings[0] && (
          <SoloLeaderboardFloor row={rankings[0]} days={days} />
        )}

        {showPodium && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {podiumSlots.map((row, i) => (
              <motion.div
                key={row?.user_id ?? `placeholder-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {row ? (
                  <PodiumCard row={row} elevated={row.rank === 1} />
                ) : (
                  <PodiumPlaceholder slot={i === 0 ? 2 : i === 2 ? 3 : 1} />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!loading && rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((row, i) => (
              <motion.div
                key={row.user_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <SurfaceCard className="flex items-center gap-4 px-4 py-3">
                  <span className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">
                    {row.rank}
                  </span>
                  <Avatar size="sm">
                    <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
                      {initials(row.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{row.full_name ?? 'Agent'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{row.role}</p>
                    {!!row.badges?.length && (
                      <p className="mt-1 text-[10px] text-amber-300">{row.badges.join(' · ')}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row.calls}</span>
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{row.connect_rate}%</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{row.meetings}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round((row.talk_time_seconds ?? 0) / 60)}m</span>
                    <span className="flex items-center gap-1"><Brain className="h-3 w-3" />{row.coaching_score ?? 0}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-primary">{row.points}</p>
                    <Badge variant="outline" className="text-[9px] border-white/10">pts</Badge>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </main>
    </PlanGate>
  );
}
