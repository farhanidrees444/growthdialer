'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Brain, Phone, Target } from 'lucide-react';
import { AgentCoachingProfile } from './AgentCoachingProfile';
import { LiveMonitorGrid } from './LiveMonitorGrid';
import type { AgentRosterRow, CoachingCall, CoachingNote, CoachingScore } from './types';

const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

export function CoachingDashboard({
  workspaceId,
  roster,
  scoresByAgent,
  callsByAgent,
  notesByAgent,
}: {
  workspaceId: string | null;
  roster: AgentRosterRow[];
  scoresByAgent: Record<string, CoachingScore[]>;
  callsByAgent: Record<string, CoachingCall[]>;
  notesByAgent: Record<string, CoachingNote[]>;
}) {
  const [selectedAgentId, setSelectedAgentId] = useState(roster[0]?.agent_id ?? '');
  const selected = roster.find((row) => row.agent_id === selectedAgentId) ?? roster[0] ?? null;
  const teamAvg = useMemo(
    () => Math.round(roster.reduce((sum, row) => sum + row.avg_score, 0) / Math.max(1, roster.length)),
    [roster],
  );

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-5 text-white lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3 py-1 text-xs text-violet-100">
                <Brain className="h-3.5 w-3.5" />
                Advanced Coaching
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Coach the floor with real call intelligence.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Monitor active calls, review AI rubric scores, and turn coachable moments into notes agents can act on.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Team avg</p>
                <p className="text-2xl font-bold">{teamAvg}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Agents</p>
                <p className="text-2xl font-bold">{roster.length}</p>
              </div>
            </div>
          </div>
        </div>

        <LiveMonitorGrid workspaceId={workspaceId} />

        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-3">
            {roster.map((agent) => (
              <motion.button
                key={agent.agent_id}
                type="button"
                layout
                transition={SPRING}
                onClick={() => setSelectedAgentId(agent.agent_id)}
                className={`w-full rounded-2xl border p-4 text-left backdrop-blur transition ${
                  selectedAgentId === agent.agent_id
                    ? 'border-[#8B5CF6]/50 bg-[#8B5CF6]/15'
                    : 'border-white/10 bg-black/40 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{agent.full_name}</p>
                    <p className="text-xs capitalize text-slate-500">{agent.role}</p>
                  </div>
                  <span className="rounded-full border border-[#06B6D4]/20 bg-[#06B6D4]/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                    {agent.avg_score}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{agent.calls_this_week} this week</span>
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />30d avg</span>
                </div>
                <div className="mt-3 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agent.trend}>
                      <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.button>
            ))}
            {!roster.length && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-slate-400 backdrop-blur">
                No team members found in this workspace.
              </div>
            )}
          </aside>

          {selected ? (
            <AgentCoachingProfile
              agentName={selected.full_name}
              agentId={selected.agent_id}
              scores={scoresByAgent[selected.agent_id] ?? []}
              calls={callsByAgent[selected.agent_id] ?? []}
              notes={notesByAgent[selected.agent_id] ?? []}
            />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-sm text-slate-400 backdrop-blur">
              Select an agent to review coaching intelligence.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
