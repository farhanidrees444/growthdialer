'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Zap, Phone, Clock, Users, Play } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SequenceStep {
  id?: string;
  step_order: number;
  step_type: 'call' | 'wait';
  wait_days: number;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sequence_steps: SequenceStep[];
}

export default function SequencesPage() {
  const { apiFetch } = useWorkspace();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [waitDays, setWaitDays] = useState(2);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/sequences');
      if (res.ok) {
        const data = await res.json() as { sequences: Sequence[] };
        setSequences(data.sequences ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { void load(); }, [load]);

  async function createSequence() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          steps: [
            { step_type: 'call', wait_days: 0 },
            { step_type: 'wait', wait_days: waitDays },
            { step_type: 'call', wait_days: 0 },
          ],
        }),
      });
      if (!res.ok) {
        toast.error('Could not create sequence');
        return;
      }
      toast.success('Sequence created');
      setName('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function processDue() {
    const res = await apiFetch('/api/sequences/process', { method: 'POST' });
    if (res.ok) {
      const data = await res.json() as { processed: number };
      toast.success(`Advanced ${data.processed} enrollments`);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-3xl">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-400" />
            Sequences
          </h1>
          <p className="text-sm text-slate-500 mt-1">Multi-step call cadences — PhoneBurner-style outreach</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void processDue()} className="gap-2">
          <Play className="h-3.5 w-3.5" />
          Process due steps
        </Button>
      </div>

      <div className="max-w-3xl mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white mb-3">New sequence</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 3-touch outbound"
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/40"
          />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Wait
            <input
              type="number"
              min={1}
              max={14}
              value={waitDays}
              onChange={(e) => setWaitDays(Number(e.target.value))}
              className="w-14 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-white text-center"
            />
            days between calls
          </label>
          <Button onClick={() => void createSequence()} disabled={creating || !name.trim()} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-600">Template: Call → Wait → Call. Enroll leads from the Leads page (bulk action coming next).</p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      <div className="max-w-3xl space-y-3">
        {sequences.map((seq) => (
          <div key={seq.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-medium text-white">{seq.name}</h3>
                <p className="text-xs text-slate-500 capitalize">{seq.status}</p>
              </div>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                {seq.sequence_steps?.length ?? 0} steps
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(seq.sequence_steps ?? []).map((step) => (
                <span
                  key={step.step_order}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400"
                >
                  {step.step_type === 'call' ? (
                    <><Phone className="h-3 w-3 text-cyan-400" /> Call</>
                  ) : (
                    <><Clock className="h-3 w-3 text-amber-400" /> Wait {step.wait_days}d</>
                  )}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <Users className="h-3 w-3" />
              Enroll via API: POST /api/sequences/{seq.id}/enroll
            </div>
          </div>
        ))}
        {!loading && sequences.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center">
            <Zap className="h-8 w-8 mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">No sequences yet. Create your first cadence above.</p>
          </div>
        )}
      </div>
    </main>
  );
}
