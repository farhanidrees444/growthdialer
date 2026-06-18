'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { useWorkspace } from '@/contexts/workspace-context';
import { getSavedQueueConfig } from '@/lib/dialer/queue-config';
import { setParallelAutoAnswer } from '@/lib/parallel-dial/auto-answer-flag';
import { useParallelRealtime } from '@/hooks/use-parallel-realtime';
import type {
  ParallelDialLeg,
  ParallelDialSession,
  ParallelSessionSummary,
} from '@/lib/parallel-dial/types';

export type ParallelDialerState =
  | 'idle'
  | 'starting'
  | 'dialing'
  | 'connected'
  | 'disposition'
  | 'paused'
  | 'ending';

export interface ParallelSessionConfig {
  lines_count: number;
  amd_enabled?: boolean;
  vm_drop_enabled?: boolean;
}

interface UseParallelDialerOptions {
  onLeadConnected?: (lead: LeadRecord, leg: ParallelDialLeg) => void;
  onSessionComplete?: (summary: ParallelSessionSummary) => void;
}

const LS_KEY = 'parallel_session_v1';

export function useParallelDialer(options: UseParallelDialerOptions = {}) {
  const { apiFetch } = useWorkspace();
  const [state, setState] = useState<ParallelDialerState>('idle');
  const [session, setSession] = useState<ParallelDialSession | null>(null);
  const [legs, setLegs] = useState<ParallelDialLeg[]>([]);
  const [summary, setSummary] = useState<ParallelSessionSummary | null>(null);
  const [config, setConfig] = useState<ParallelSessionConfig>({ lines_count: 2 });
  const [dialedLeadIds, setDialedLeadIds] = useState<string[]>([]);
  const [winnerLeg, setWinnerLeg] = useState<ParallelDialLeg | null>(null);

  const stateRef = useRef(state);
  const sessionRef = useRef(session);
  const dialedRef = useRef(dialedLeadIds);
  const winnerHandledRef = useRef(false);
  const onLeadConnectedRef = useRef(options.onLeadConnected);
  const onSessionCompleteRef = useRef(options.onSessionComplete);
  const legsRef = useRef(legs);

  stateRef.current = state;
  sessionRef.current = session;
  dialedRef.current = dialedLeadIds;
  onLeadConnectedRef.current = options.onLeadConnected;
  onSessionCompleteRef.current = options.onSessionComplete;
  legsRef.current = legs;

  const handleLegRealtime = useCallback((leg: ParallelDialLeg) => {
    setLegs((prev) => {
      const idx = prev.findIndex((l) => l.id === leg.id);
      if (idx === -1) return [...prev, leg];
      const next = [...prev];
      next[idx] = leg;
      return next;
    });

    if (leg.is_winner && leg.status === 'connected' && !winnerHandledRef.current && leg.lead_id) {
      winnerHandledRef.current = true;
      setWinnerLeg(leg);
      const lead: LeadRecord = {
        id: leg.lead_id,
        name: leg.lead_name ?? 'Lead',
        phone: leg.phone,
        status: 'new',
      };
      onLeadConnectedRef.current?.(lead, leg);
    }
  }, []);

  const handleSessionRealtime = useCallback((sess: ParallelDialSession) => {
    setSession(sess);
  }, []);

  useParallelRealtime({
    sessionId: session?.id ?? null,
    enabled: state !== 'idle' && state !== 'ending',
    onLegUpdate: handleLegRealtime,
    onSessionUpdate: handleSessionRealtime,
  });

  const clearLS = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  }, []);

  const saveLS = useCallback((sessionId: string) => {
    try { localStorage.setItem(LS_KEY, sessionId); } catch { /* noop */ }
  }, []);

  const refreshSession = useCallback(async (sessionId: string) => {
    const res = await apiFetch(`/api/dialer/parallel-session/${sessionId}`);
    if (!res.ok) return null;
    const data = await res.json() as { session: ParallelDialSession; legs: ParallelDialLeg[] };
    setSession(data.session);
    setLegs(data.legs);
    return data;
  }, [apiFetch]);

  const dialNextBatch = useCallback(async (sess: ParallelDialSession, excludeIds: string[]) => {
    winnerHandledRef.current = false;
    setWinnerLeg(null);
    setState('dialing');

    const res = await apiFetch(`/api/dialer/parallel-session/${sess.id}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exclude_lead_ids: excludeIds,
        queue_config: getSavedQueueConfig(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      toast.error(err.error ?? 'Failed to dial batch');
      setState('paused');
      return false;
    }

    const data = await res.json() as { session: ParallelDialSession; legs: ParallelDialLeg[] };
    setSession(data.session);
    setLegs(data.legs);

    const newIds = data.legs.map((l) => l.lead_id).filter(Boolean) as string[];
    setDialedLeadIds((prev) => [...prev, ...newIds]);

    if (!data.legs.length) {
      toast.info('Queue empty — session complete');
      return false;
    }
    return true;
  }, [apiFetch]);

  const endSession = useCallback(async (sess: ParallelDialSession) => {
    setParallelAutoAnswer(false);
    clearLS();
    setState('ending');

    try {
      const res = await apiFetch(`/api/dialer/parallel-session/${sess.id}/end`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json() as { summary: ParallelSessionSummary };
        setSummary(data.summary);
        onSessionCompleteRef.current?.(data.summary);
      }
    } catch { /* noop */ }

    setSession(null);
    setLegs([]);
    setWinnerLeg(null);
    setDialedLeadIds([]);
    setState('idle');
  }, [apiFetch, clearLS]);

  const start = useCallback(async (cfg?: Partial<ParallelSessionConfig>) => {
    if (stateRef.current !== 'idle') return;
    const merged = { lines_count: 2, amd_enabled: true, vm_drop_enabled: true, ...cfg };
    setConfig(merged);
    setState('starting');
    setParallelAutoAnswer(true);
    winnerHandledRef.current = false;

    try {
      const res = await apiFetch('/api/dialer/parallel-session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...merged,
          queue_config: getSavedQueueConfig(),
          auto_dial: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; code?: string };
        toast.error(err.error ?? 'Could not start parallel session');
        setParallelAutoAnswer(false);
        setState('idle');
        return;
      }

      const data = await res.json() as { session: ParallelDialSession; legs: ParallelDialLeg[] };
      setSession(data.session);
      setLegs(data.legs);
      setDialedLeadIds(data.legs.map((l) => l.lead_id).filter(Boolean) as string[]);
      saveLS(data.session.id);
      setState('dialing');
      toast.success(`Dialing ${data.legs.length} lines in parallel`);
    } catch {
      setParallelAutoAnswer(false);
      setState('idle');
      toast.error('Failed to start parallel dialer');
    }
  }, [apiFetch, saveLS]);

  const pause = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess) return;
    setState('paused');
    await apiFetch(`/api/dialer/parallel-session/${sess.id}/pause`, { method: 'POST' });
  }, [apiFetch]);

  const resume = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || stateRef.current !== 'paused') return;
    await apiFetch(`/api/dialer/parallel-session/${sess.id}/resume`, { method: 'POST' });
    await dialNextBatch(sess, dialedRef.current);
  }, [apiFetch, dialNextBatch]);

  const stop = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess) return;
    await endSession(sess);
  }, [endSession]);

  const cancelBatch = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess) return;
    await apiFetch(`/api/dialer/parallel-session/${sess.id}/cancel-batch`, { method: 'POST' });
    await refreshSession(sess.id);
    setState('dialing');
  }, [apiFetch, refreshSession]);

  const dismissSummary = useCallback(() => setSummary(null), []);

  const onCallStarted = useCallback(() => {
    if (stateRef.current === 'dialing') setState('connected');
  }, []);

  const onCallEnd = useCallback(() => {
    const s = stateRef.current;
    if (s === 'connected') setState('disposition');
  }, []);

  const onDispositionSaved = useCallback(async (
    _disposition: string,
    wasConnected: boolean,
    wasMeeting: boolean,
  ) => {
    const sess = sessionRef.current;
    if (!sess) return;

    if (wasMeeting) {
      setSession((prev) => prev ? {
        ...prev,
        total_meetings: prev.total_meetings + 1,
        status: 'active',
      } : prev);
    }

    winnerHandledRef.current = false;
    setWinnerLeg(null);

    const hasMore = await dialNextBatch(sess, dialedRef.current);
    if (!hasMore) await endSession(sess);
  }, [dialNextBatch, endSession]);

  // Fallback poll (5s) if realtime misses an event
  useEffect(() => {
    const sess = session;
    if (!sess || !['dialing', 'connected'].includes(state)) return;

    const interval = setInterval(() => {
      void refreshSession(sess.id).then((data) => {
        if (!data) return;
        const winner = data.legs.find((l) => l.is_winner && l.status === 'connected');
        if (winner && !winnerHandledRef.current && winner.lead_id) {
          winnerHandledRef.current = true;
          setWinnerLeg(winner);
          const lead: LeadRecord = {
            id: winner.lead_id,
            name: winner.lead_name ?? 'Lead',
            phone: winner.phone,
            status: 'new',
          };
          onLeadConnectedRef.current?.(lead, winner);
        }

        if (stateRef.current === 'dialing') {
          const terminal = ['no_answer', 'busy', 'failed', 'canceled', 'voicemail'];
          const batchLegs = data.legs.filter((l) => l.batch_number === data.session.total_batches);
          const allDone = batchLegs.length > 0 && batchLegs.every(
            (l) => terminal.includes(l.status) || l.is_winner,
          );
          const hasWinner = batchLegs.some((l) => l.is_winner);
          if (allDone && !hasWinner && stateRef.current === 'dialing') {
            void dialNextBatch(data.session, dialedRef.current).then((ok) => {
              if (!ok) void endSession(data.session);
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [session, state, refreshSession, dialNextBatch, endSession]);

  // Restore session on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(LS_KEY);
      if (!savedId) return;
      void refreshSession(savedId).then((data) => {
        if (data?.session && data.session.status !== 'ended') {
          setSession(data.session);
          setLegs(data.legs);
          setState(data.session.status === 'paused' ? 'paused' : 'dialing');
          setParallelAutoAnswer(true);
        }
      });
    } catch { /* noop */ }
  }, [refreshSession]);

  useEffect(() => () => setParallelAutoAnswer(false), []);

  return {
    state,
    session,
    legs,
    summary,
    config,
    winnerLeg,
    isActive: state !== 'idle' && state !== 'ending',
    start,
    pause,
    resume,
    stop,
    cancelBatch,
    onCallStarted,
    onCallEnd,
    onDispositionSaved,
    refreshSession,
    dismissSummary,
  };
}
