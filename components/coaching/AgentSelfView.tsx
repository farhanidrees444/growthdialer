'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, TrendingDown, TrendingUp } from 'lucide-react';
import { CoachableMomentsFeed } from './CoachableMomentsFeed';
import { WeeklyReportCard } from './WeeklyReportCard';
import type { CoachingCall, CoachingMoment, CoachingScore, WeeklyReport } from './types';

export function AgentSelfView({
  scores,
  calls,
  report,
}: {
  scores: CoachingScore[];
  calls: CoachingCall[];
  report: WeeklyReport | null;
}) {
  const trend = scores
    .slice()
    .reverse()
    .map((score, index) => ({ label: `${index + 1}`, score: score.total_score }));
  const scoredCalls = calls.filter((call) => call.score != null);
  const best = [...scoredCalls].sort((a, b) => Number(b.score) - Number(a.score))[0] ?? null;
  const worst = [...scoredCalls].sort((a, b) => Number(a.score) - Number(b.score))[0] ?? null;
  const moments: CoachingMoment[] = scores.flatMap((score) => score.coachable_moments ?? []).slice(0, 10);

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-5 text-white lg:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-[#06B6D4]">My coaching</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your call score trend</h1>
          <p className="mt-2 text-sm text-slate-400">Review your recent calls, coachable moments, and weekly practice drill.</p>
          <div className="mt-5 h-72 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.35)" />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.35)" />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <p className="text-sm font-semibold text-white">Personal best this week</p>
            </div>
            {best ? (
              <div>
                <p className="text-3xl font-bold text-white">{best.score}</p>
                <p className="text-sm text-emerald-100">{best.prospect_name}</p>
              </div>
            ) : <p className="text-sm text-slate-400">No scored calls this week.</p>}
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-300" />
              <p className="text-sm font-semibold text-white">Focus call this week</p>
            </div>
            {worst ? (
              <div>
                <p className="text-3xl font-bold text-white">{worst.score}</p>
                <p className="text-sm text-amber-100">{worst.prospect_name}</p>
              </div>
            ) : <p className="text-sm text-slate-400">No focus call yet.</p>}
          </div>
        </div>

        <WeeklyReportCard report={report} />

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-[#8B5CF6]" />
            <h2 className="text-sm font-semibold text-white">Coachable moments and suggested scripts</h2>
          </div>
          <CoachableMomentsFeed moments={moments} />
        </section>
      </div>
    </main>
  );
}
