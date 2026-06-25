'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { FileText, Save } from 'lucide-react';
import { CoachableMomentsFeed } from './CoachableMomentsFeed';
import { ScoreRadarChart } from './ScoreRadarChart';
import type { CoachingCall, CoachingMoment, CoachingNote, CoachingScore, RubricBreakdown } from './types';

const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

export function AgentCoachingProfile({
  agentName,
  agentId,
  scores,
  calls,
  notes,
}: {
  agentName: string;
  agentId: string;
  scores: CoachingScore[];
  calls: CoachingCall[];
  notes: CoachingNote[];
}) {
  const [noteDraft, setNoteDraft] = useState('');
  const [selectedCallId, setSelectedCallId] = useState(calls[0]?.id ?? '');
  const [saving, setSaving] = useState(false);

  const latestScore = scores[0] ?? null;
  const moments = useMemo<CoachingMoment[]>(
    () => scores.flatMap((score) => score.coachable_moments ?? []).slice(0, 8),
    [scores],
  );
  const trend = scores
    .slice()
    .reverse()
    .map((score, index) => ({ label: `Call ${index + 1}`, score: score.total_score }));

  async function saveNote() {
    if (!selectedCallId || !noteDraft.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/coaching/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ call_id: selectedCallId, note: noteDraft, visible_to_agent: true }),
      });
      setNoteDraft('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div layout transition={SPRING} className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Agent profile</p>
            <h2 className="text-xl font-semibold text-white">{agentName}</h2>
          </div>
          <div className="rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/10 px-4 py-2 text-right">
            <p className="text-[10px] uppercase tracking-widest text-cyan-200">Avg score</p>
            <p className="text-2xl font-bold text-white">{Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / Math.max(1, scores.length))}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <ScoreRadarChart breakdown={(latestScore?.rubric_breakdown ?? {}) as RubricBreakdown} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Score trend</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <p className="mb-3 text-sm font-semibold text-white">Last 10 calls</p>
          <div className="space-y-2">
            {calls.slice(0, 10).map((call) => (
              <button
                key={call.id}
                type="button"
                onClick={() => setSelectedCallId(call.id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.06]"
              >
                <div>
                  <p className="text-sm text-white">{call.prospect_name}</p>
                  <p className="text-xs text-slate-500">{call.prospect_company ?? call.disposition ?? 'Call'}</p>
                </div>
                <span className="text-sm font-bold text-[#8B5CF6]">{call.score ?? '--'}</span>
              </button>
            ))}
            {!calls.length && <p className="text-sm text-slate-500">No calls scored yet.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#8B5CF6]" />
            <p className="text-sm font-semibold text-white">Coaching note</p>
          </div>
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder={agentId ? 'Write a note visible to the agent...' : 'Select an agent first'}
            className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#8B5CF6]/60"
          />
          <button
            type="button"
            onClick={() => void saveNote()}
            disabled={saving || !noteDraft.trim() || !selectedCallId}
            className="mt-3 flex items-center gap-2 rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save note
          </button>
          <div className="mt-4 space-y-2">
            {notes.slice(0, 3).map((note) => (
              <div key={note.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                {note.note}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CoachableMomentsFeed moments={moments} />
    </motion.div>
  );
}
