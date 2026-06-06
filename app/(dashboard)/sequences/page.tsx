'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Zap, Play, Users, ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { SequenceTimeline } from '@/components/sequences/sequence-timeline';
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
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Sequences"
          description="Multi-touch call cadences — lemlist-style outreach with auto-advance between steps."
          icon={Zap}
        >
          <Button variant="outline" size="sm" onClick={() => void processDue()} className="gap-2 border-white/10">
            <Play className="h-3.5 w-3.5" />
            Process due
          </Button>
        </PageHeader>

        <SurfaceCard className="mb-8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">New sequence</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Template: Call → Wait → Call. Customize steps in a future builder.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 3-touch outbound"
              className="flex-1 bg-white/[0.04] border-white/[0.08]"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span>Wait</span>
              <Input
                type="number"
                min={1}
                max={14}
                value={waitDays}
                onChange={(e) => setWaitDays(Number(e.target.value))}
                className="w-16 text-center bg-white/[0.04] border-white/[0.08]"
              />
              <span>days</span>
            </div>
            <Button
              onClick={() => void createSequence()}
              disabled={creating || !name.trim()}
              className="gap-2 shrink-0 gradient-brand text-white border-0"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </SurfaceCard>

        {loading && (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading sequences…</p>
        )}

        {!loading && sequences.length === 0 && (
          <PremiumEmptyState
            icon={Zap}
            title="No sequences yet"
            description="Build your first cadence above — then enroll leads from the Leads page."
            primaryAction={{ label: 'Go to leads', href: '/leads' }}
            accent="violet"
          />
        )}

        <div className="space-y-4">
          {sequences.map((seq) => (
            <SurfaceCard key={seq.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-white">{seq.name}</h3>
                  {seq.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{seq.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="capitalize border-white/10">
                    {seq.status}
                  </Badge>
                  <Badge className="bg-primary/15 text-primary border-0">
                    {seq.sequence_steps?.length ?? 0} steps
                  </Badge>
                </div>
              </div>

              <SequenceTimeline steps={seq.sequence_steps ?? []} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Enroll leads from bulk actions on the Leads page
                </div>
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition"
                >
                  Enroll leads
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </main>
  );
}
