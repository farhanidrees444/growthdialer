'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Phone, Target, Calendar, UserPlus, Sparkles } from 'lucide-react';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  full_name: string | null;
  role: string;
  calls: number;
  connects: number;
  meetings: number;
  connect_rate: number;
  points: number;
  talk_time_seconds?: number;
  coaching_score?: number;
  badges?: string[];
};

function initials(name: string | null) {
  const n = name ?? 'You';
  return n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export function SoloLeaderboardFloor({ row, days }: { row: LeaderboardRow; days: number }) {
  const periodLabel = days === 1 ? 'today' : `the last ${days} days`;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-violet-500/[0.05] to-transparent p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
          <div className="relative">
            <Avatar size="lg" className="h-16 w-16 ring-2 ring-amber-500/30">
              <AvatarFallback className="gradient-brand text-lg font-bold text-white">
                {initials(row.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90">
              Solo floor · #{row.rank}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">{row.full_name ?? 'You'}</h2>
            <p className="mt-1 text-sm text-slate-400 capitalize">{row.role}</p>
            <p className="mt-3 text-sm text-slate-500 max-w-md">
              You&apos;re the only rep on this floor {periodLabel}. Invite teammates to unlock
              live rankings, connect-rate races, and manager coaching.
            </p>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            <p className="text-4xl font-bold tabular-nums text-primary">{row.points}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">points</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={Phone} label="Calls" value={row.calls} />
        <StatChip icon={Target} label="Connect rate" value={`${row.connect_rate}%`} />
        <StatChip icon={Calendar} label="Meetings" value={row.meetings} />
        <StatChip icon={Sparkles} label="Connects" value={row.connects} accent />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <PodiumPlaceholder slot={2} />
        <SurfaceCard variant="amber" glow className="p-5 text-center sm:-mt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">You</p>
          <p className="mt-2 text-lg font-bold text-white truncate">{row.full_name ?? 'Agent'}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{row.points}</p>
          <p className="text-[10px] text-muted-foreground">pts</p>
        </SurfaceCard>
        <PodiumPlaceholder slot={3} />
      </div>

      <SurfaceCard className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
        <div>
          <p className="text-sm font-semibold text-white">Ready for a team floor?</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite reps to compare connect rates and meetings booked side-by-side.
          </p>
        </div>
        <Link
          href="/team"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/25"
        >
          <UserPlus className="h-4 w-4" />
          Invite teammates
        </Link>
      </SurfaceCard>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Phone;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <SurfaceCard className={cn('p-3.5', accent && 'border-cyan-500/20')}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className={cn('h-3 w-3', accent ? 'text-cyan-400' : 'text-slate-500')} />
        {label}
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
    </SurfaceCard>
  );
}

export function PodiumPlaceholder({ slot }: { slot: 1 | 2 | 3 }) {
  return (
    <SurfaceCard className="flex flex-col items-center justify-center border-dashed border-white/[0.1] bg-white/[0.01] p-5 text-center min-h-[140px]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white/15 text-sm font-bold text-slate-600">
        #{slot}
      </span>
      <p className="mt-3 text-xs font-medium text-slate-600">Open slot</p>
      <Link
        href="/team"
        className="mt-2 text-[11px] font-semibold text-violet-400/80 hover:text-violet-300 transition"
      >
        Invite rep →
      </Link>
    </SurfaceCard>
  );
}

export function PodiumCard({ row, elevated }: { row: LeaderboardRow; elevated?: boolean }) {
  const variant = row.rank === 1 ? 'amber' : row.rank === 2 ? 'default' : 'violet';

  return (
    <SurfaceCard
      variant={variant}
      glow={row.rank === 1}
      className={cn('p-4 text-center', elevated && 'sm:-mt-2 sm:pb-6')}
    >
      <div className="mb-2 flex justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          {row.rank === 1 ? (
            <Trophy className="h-4 w-4 text-amber-400" />
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
  );
}
