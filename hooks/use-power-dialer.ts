'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { LeadRecord } from '@/lib/dialer/state-machine';

export type PowerDialerState =
  | 'idle'
  | 'starting'
  | 'countdown'   // fetching next lead between calls
  | 'preview'     // lead loaded, countdown running
  | 'calling'     // live call active
  | 'paused'
  | 'disposition' // waiting for disposition after call
  | 'ending';     // summary shown

export interface PowerSession {
  id: string;
  total_calls: number;
  connected_calls: number;
  meetings_booked: number;
  total_talk_time: number;
  status: string;
  started_at?: string;
}

export interface SessionSummary {
  calls: number;
  connects: number;
  meetings: number;
  duration: number; // seconds
}

export interface SessionConfig {
  delay_seconds?: number;
  auto_stop_after?: number;
  skip_after_disposition?: string[];
}

interface UsePowerDialerOptions {
  onLeadReady?: (lead: LeadRecord) => void;
  onShouldDial?: (lead: LeadRecord) => void;
  onSessionComplete?: (summary: SessionSummary) => void;
}

const LS_KEY = 'pd_session_v2';

export function usePowerDialer(options: UsePowerDialerOptions = {}) {
  const [pdState, setPdState] = useState<PowerDialerState>('idle');
  const [session, setSession] = useState<PowerSession | null>(null);
  const [currentLead, setCurrentLead] = useState<LeadRecord | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [calledLeadIds, setCalledLeadIds] = useState<string[]>([]);
  const [config, setConfig] = useState<SessionConfig>({ delay_seconds: 5 });
  const [queueRemaining, setQueueRemaining] = useState(0);

  // Stable refs so async code always sees latest values
  const sessionRef = useRef(session);
  const stateRef = useRef(pdState);
  const calledRef = useRef(calledLeadIds);
  const currentLeadRef = useRef(currentLead);
  const configRef = useRef(config);
  const onLeadReadyRef = useRef(options.onLeadReady);
  const onShouldDialRef = useRef(options.onShouldDial);
  const onSessionCompleteRef = useRef(options.onSessionComplete);
  sessionRef.current = session;
  stateRef.current = pdState;
  calledRef.current = calledLeadIds;
  currentLeadRef.current = currentLead;
  configRef.current = config;
  onLeadReadyRef.current = options.onLeadReady;
  onShouldDialRef.current = options.onShouldDial;
  onSessionCompleteRef.current = options.onSessionComplete;

  // State before pausing (to restore on resume)
  const preStateRef = useRef<PowerDialerState>('preview');
  // Guards against double-fire when skipCountdown() is called
  const autoCalledRef = useRef(false);
  // Tracks consecutive API failures for auto-pause
  const consecutiveErrorsRef = useRef(0);

  // ── localStorage helpers ───────────────────────────────────────────────────
  const saveLS = useCallback((sessionId: string, leadId?: string, countdownStart?: number) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sessionId, leadId, countdownStart }));
    } catch { /* SSR safe */ }
  }, []);

  const clearLS = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  // ── Reactive countdown (useEffect+setTimeout — respects pause state) ───────
  // Tick: fires every second only while in 'preview' and countdown > 0
  useEffect(() => {
    if (pdState !== 'preview' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, pdState]);

  // Fire: calls onShouldDial once when countdown reaches 0 in preview state
  useEffect(() => {
    if (pdState !== 'preview' || countdown !== 0 || autoCalledRef.current) return;
    autoCalledRef.current = true;
    const lead = currentLeadRef.current;
    if (lead) onShouldDialRef.current?.(lead);
  }, [countdown, pdState]);

  // ── Internal: set countdown for a lead ────────────────────────────────────
  const startCountdown = useCallback((seconds: number, lead: LeadRecord) => {
    const secs = Math.max(1, seconds);
    autoCalledRef.current = false;
    setCountdown(secs);
    saveLS(sessionRef.current?.id ?? '', lead.id, Date.now());
  }, [saveLS]);

  // ── Internal: end session ──────────────────────────────────────────────────
  const stopSession = useCallback(async (sess: PowerSession) => {
    setCountdown(0);
    clearLS();

    try {
      const res = await fetch(`/api/dialer/power-session/${sess.id}/end`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json() as { summary?: SessionSummary; session?: PowerSession };
        const finalSummary: SessionSummary = data.summary ?? {
          calls: sess.total_calls,
          connects: sess.connected_calls,
          meetings: sess.meetings_booked,
          duration: sess.started_at
            ? Math.floor((Date.now() - new Date(sess.started_at).getTime()) / 1000)
            : 0,
        };
        setSummary(finalSummary);
        onSessionCompleteRef.current?.(finalSummary);
      }
    } catch {
      setSummary({
        calls: sess.total_calls,
        connects: sess.connected_calls,
        meetings: sess.meetings_booked,
        duration: 0,
      });
    }

    setSession(null);
    setCurrentLead(null);
    setCalledLeadIds([]);
    setPdState('ending');
  }, [clearLS]);

  // ── Internal: load next lead after disposition ─────────────────────────────
  const loadNextLead = useCallback(async (sess: PowerSession, doneLeadId: string) => {
    setPdState('countdown');
    const called = [...calledRef.current, doneLeadId];
    setCalledLeadIds(called);

    try {
      const res = await fetch(`/api/dialer/power-session/${sess.id}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeLeadId: doneLeadId, calledLeadIds: called }),
      });
      const data = await res.json() as {
        next_lead?: LeadRecord | null;
        nextLead?: LeadRecord | null;
        queue_remaining?: number;
        done?: boolean;
        ended?: boolean;
        reason?: string;
      };

      const nextLead = data.next_lead ?? data.nextLead ?? null;
      const isDone = data.ended ?? data.done ?? false;

      if (isDone || !nextLead) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await stopSession(sess);
        return;
      }

      consecutiveErrorsRef.current = 0;
      setQueueRemaining(data.queue_remaining ?? 0);
      setCurrentLead(nextLead);
      onLeadReadyRef.current?.(nextLead);
      setPdState('preview');
      startCountdown(configRef.current.delay_seconds ?? 5, nextLead);
    } catch {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= 3) {
        // Auto-pause after 3 consecutive failures
        consecutiveErrorsRef.current = 0;
        preStateRef.current = 'preview';
        setPdState('paused');
        fetch(`/api/dialer/power-session/${sess.id}/pause`, { method: 'POST' }).catch(() => {});
        toast.error('Auto-paused: 3 consecutive errors. Resume when ready.');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await stopSession(sess);
      }
    }
  }, [startCountdown, stopSession]);

  // ── Public: start ──────────────────────────────────────────────────────────
  const start = useCallback(async (cfg?: SessionConfig) => {
    if (stateRef.current !== 'idle') return;
    const merged: SessionConfig = { delay_seconds: 5, ...cfg };
    setConfig(merged);
    setPdState('starting');

    try {
      const res = await fetch('/api/dialer/power-session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!res.ok) throw new Error('Failed to start session');

      const data = await res.json() as {
        session?: PowerSession;
        firstLead?: LeadRecord | null;
        first_lead?: LeadRecord | null;
        queueSize?: number;
        queue_size?: number;
      };

      const sess = data.session;
      const firstLead = data.firstLead ?? data.first_lead ?? null;

      if (!sess || !firstLead) {
        setPdState('idle');
        return;
      }

      setSession(sess);
      setCalledLeadIds([]);
      setCurrentLead(firstLead);
      setQueueRemaining((data.queueSize ?? data.queue_size ?? 1) - 1);
      onLeadReadyRef.current?.(firstLead);
      setPdState('preview');
      startCountdown(merged.delay_seconds ?? 5, firstLead);
      saveLS(sess.id, firstLead.id, Date.now());
    } catch {
      setPdState('idle');
    }
  }, [startCountdown, saveLS]);

  // ── Public: called by page when the phone call actually connects ───────────
  const onCallStarted = useCallback(() => {
    if (stateRef.current === 'paused') return;
    setCountdown(0);
    setPdState('calling');
  }, []);

  // ── Public: called by page when call ends (before disposition) ─────────────
  const onCallEnd = useCallback(() => {
    if (stateRef.current !== 'calling') return;
    setPdState('disposition');
  }, []);

  // ── Public: called by page after disposition is saved ─────────────────────
  const onDispositionSaved = useCallback(async (
    _disposition: string,
    wasConnected: boolean,
    wasMeeting: boolean,
  ) => {
    const sess = sessionRef.current;
    const lead = currentLeadRef.current;
    if (!sess || !lead) return;

    const nextStats = {
      total_calls: sess.total_calls + 1,
      connected_calls: sess.connected_calls + (wasConnected ? 1 : 0),
      meetings_booked: sess.meetings_booked + (wasMeeting ? 1 : 0),
    };
    setSession((prev) => prev ? { ...prev, ...nextStats } : prev);

    // Fire-and-forget stat patch
    fetch(`/api/power-dial/sessions/${sess.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextStats),
    }).catch(() => {});

    await loadNextLead({ ...sess, ...nextStats }, lead.id);
  }, [loadNextLead]);

  // ── Public: pause ──────────────────────────────────────────────────────────
  // Setting pdState to 'paused' causes the tick effect to stop via early return.
  const pause = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || stateRef.current === 'paused') return;

    preStateRef.current = stateRef.current;
    setPdState('paused');

    fetch(`/api/dialer/power-session/${sess.id}/pause`, { method: 'POST' }).catch(() => {});
  }, []);

  // ── Public: resume ─────────────────────────────────────────────────────────
  const resume = useCallback(async () => {
    const sess = sessionRef.current;
    const lead = currentLeadRef.current;
    if (!sess || stateRef.current !== 'paused') return;

    const prev = preStateRef.current;
    fetch(`/api/dialer/power-session/${sess.id}/resume`, { method: 'POST' }).catch(() => {});

    if ((prev === 'preview' || prev === 'countdown') && lead) {
      // Restart full countdown — setPdState and setCountdown batched together
      setPdState('preview');
      startCountdown(configRef.current.delay_seconds ?? 5, lead);
    } else {
      setPdState(prev);
    }
  }, [startCountdown]);

  // ── Public: skip countdown ─────────────────────────────────────────────────
  const skipCountdown = useCallback(() => {
    const lead = currentLeadRef.current;
    if (!lead) return;
    autoCalledRef.current = true; // prevent fire effect from also calling
    setCountdown(0);
    onShouldDialRef.current?.(lead);
  }, []);

  // ── Public: stop ───────────────────────────────────────────────────────────
  const stop = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess) {
      setCountdown(0);
      setPdState('idle');
      setCurrentLead(null);
      clearLS();
      return;
    }
    await stopSession(sess);
  }, [stopSession, clearLS]);

  // ── Public: dismiss summary → back to idle ────────────────────────────────
  const dismissSummary = useCallback(() => {
    setSummary(null);
    setPdState('idle');
  }, []);

  // ── Resume on mount from localStorage ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (!stored) return;
      const { sessionId } = JSON.parse(stored) as { sessionId?: string };
      if (!sessionId) return;

      fetch('/api/dialer/power-session/active')
        .then((r) => r.json())
        .then(({ activeSession }: { activeSession: PowerSession | null }) => {
          if (!mounted || !activeSession || activeSession.id !== sessionId) {
            clearLS();
            return;
          }
          setSession(activeSession);
          if (activeSession.status === 'paused') {
            setPdState('paused');
          } else {
            setPdState('preview');
          }
        })
        .catch(() => clearLS());
    } catch {}
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = pdState !== 'idle' && pdState !== 'ending';

  return {
    state: pdState,
    session,
    currentLead,
    countdown,
    summary,
    isActive,
    queueRemaining,
    config,
    start,
    onCallStarted,
    onCallEnd,
    onDispositionSaved,
    pause,
    resume,
    skipCountdown,
    stop,
    dismissSummary,
    // Back-compat aliases
    startSession: start,
    endSession: stop,
    advanceToNext: onDispositionSaved,
  };
}
