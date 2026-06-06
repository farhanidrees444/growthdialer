'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Phone, Target, Calendar, Medal, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';
import { PageHeader, PeriodToggle } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';

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

const PODIUM_VARIANT: ('amber' | 'default' | 'violet')[] = ['amber', 'default', 'violet'];

function initials(name: string | null) {
  const n = name ?? 'Agent';
  return n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

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

  const top3 = rankings.filter((r) => r.rank <= 3);
  const rest = rankings.filter((r) => r.rank > 3);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Team Leaderboard"
          description="Live salesfloor rankings — points from connects, meetings, and outcomes."
          icon={Trophy}
          badge="Live"
        >
          <PeriodToggle value={days} onChange={setDays} periods={PERIODS} />
        </PageHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground">Loading rankings…</p>
          </div>
        )}

        {!loading && rankings.length === 0 && (
          <PremiumEmptyState
            icon={Trophy}
            title="No activity yet"
            description="Start dialing as a team — rankings update in real time as calls complete."
            primaryAction={{ label: 'Open dialer', href: '/dialer' }}
            accent="violet"
          />
        )}

        {!loading && top3.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {top3.map((row, i) => (
              <motion.div
                key={row.user_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <SurfaceCard
                  variant={PODIUM_VARIANT[i]}
                  glow={row.rank === 1}
                  className={cn('p-4 text-center', row.rank === 1 && 'sm:-mt-2 sm:pb-6')}
                >
                  <div className="mb-2 flex justify-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                      {row.rank === 1 ? (
                        <Medal className="h-4 w-4 text-amber-400" />
                      ) : (
                        <span className="text-sm font-bold text-white/70">#{row.rank}</span>
                      )}
                    </span>
                  </div>
                  <Avatar size="lg" className="mx-auto mb-2">
                    <AvatarFallback className="gradient-brand text-white text-sm font-bold">
                      {initials(row.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-white truncate">{row.full_name ?? 'Agent'}</p>
                  <p className="text-[10px] text-muted-foreground capitalize mb-2">{row.role}</p>
                  <p className="text-2xl font-bold tabular-nums text-primary">{row.points}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">points</p>
                </SurfaceCard>
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
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row.calls}</span>
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{row.connect_rate}%</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{row.meetings}</span>
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
  );
}
