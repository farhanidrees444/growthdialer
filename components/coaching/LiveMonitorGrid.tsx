'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AgentCallCard } from './AgentCallCard';
import { WhisperDrawer } from './WhisperDrawer';
import type { LiveCall } from './types';

export function LiveMonitorGrid({ workspaceId }: { workspaceId: string | null }) {
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerCall, setDrawerCall] = useState<LiveCall | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/coaching/active-calls', { cache: 'no-store' });
      const data = await res.json() as { calls?: LiveCall[] };
      setCalls(data.calls ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    if (!workspaceId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`active-calls-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_calls', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => void fetchCalls(), 300);
        },
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [fetchCalls, workspaceId]);

  async function barge(call: LiveCall) {
    setActionError(null);
    const res = await fetch('/api/coaching/barge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ call_id: call.call_id ?? call.id }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) setActionError(data.error ?? 'Barge failed');
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#06B6D4]" />
            <h2 className="text-sm font-semibold text-white">Live monitor</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Realtime updates from active calls, debounced at 300ms.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {calls.length} live
        </span>
      </div>

      {actionError && (
        <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : calls.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-sm text-slate-400">
          No live calls right now.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {calls.map((call) => (
            <AgentCallCard
              key={call.call_id ?? call.id}
              call={call}
              onWhisper={setDrawerCall}
              onBarge={(nextCall) => void barge(nextCall)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawerCall && <WhisperDrawer call={drawerCall} onClose={() => setDrawerCall(null)} />}
      </AnimatePresence>
    </section>
  );
}
