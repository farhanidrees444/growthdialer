'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // ── localStorage helpers ───────────────────────────────────────────────────
  const saveLS = useCallback((sessionId: string, leadId?: string, countdownStart?: number) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sessionId, leadId, countdownStart }));
    } catch { /* SSR safe */ }
  }, []);

  const clearLS = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  // ── Internal: start countdown ──────────────────────────────────────────────
  const startCountdown = useCallback((seconds: number, lead: LeadRecord) => {
    clearInterval(countdownRef.current);
    const secs = Math.max(1, seconds);
    setCountdown(secs);
    saveLS(sessionRef.current?.id ?? '', lead.id, Date.now());

    let remaining = secs;
    countdownRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(0);
        if (stateRef.current !== 'paused') {
          onShouldDialRef.current?.(lead);
        }
      }
    }, 1000);
  }, [saveLS]);

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

      setQueueRemaining(data.queue_remaining ?? 0);
      setCurrentLead(nextLead);
      onLeadReadyRef.current?.(nextLead);
      setPdState('preview');
      startCountdown(configRef.current.delay_seconds ?? 5, nextLead);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      await stopSession(sess);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCountdown]);

  // ── Internal: end session ──────────────────────────────────────────────────
  const stopSession = useCallback(async (sess: PowerSession) => {
    clearInterval(countdownRef.current);
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
    clearInterval(countdownRef.current);
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
  const pause = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || stateRef.current === 'paused') return;

    clearInterval(countdownRef.current);
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
    setPdState(prev);

    fetch(`/api/dialer/power-session/${sess.id}/resume`, { method: 'POST' }).catch(() => {});

    if ((prev === 'preview' || prev === 'countdown') && lead) {
      startCountdown(configRef.current.delay_seconds ?? 5, lead);
    }
  }, [startCountdown]);

  // ── Public: skip countdown ─────────────────────────────────────────────────
  const skipCountdown = useCallback(() => {
    const lead = currentLeadRef.current;
    if (!lead) return;
    clearInterval(countdownRef.current);
    setCountdown(0);
    onShouldDialRef.current?.(lead);
  }, []);

  // ── Public: stop ───────────────────────────────────────────────────────────
  const stop = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess) {
      clearInterval(countdownRef.current);
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
            // Restored — enter preview, let user manually trigger next
            setPdState('preview');
          }
        })
        .catch(() => clearLS());
    } catch {}
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { clearInterval(countdownRef.current); };
  }, []);

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
    // Back-compat aliases for legacy callers
    startSession: start,
    endSession: stop,
    advanceToNext: onDispositionSaved,
  };
}
