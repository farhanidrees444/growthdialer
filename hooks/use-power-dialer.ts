'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import {
  isPowerSessionActive,
  transitionPowerPhase,
  type PowerDialPhase,
} from '@/lib/dialer/power-state-machine';
import { useWorkspace } from '@/contexts/workspace-context';
import { getSavedQueueConfig } from '@/lib/dialer/queue-config';
import type { DialerQueueConfig } from '@/lib/dialer/queue-query';

/** @deprecated Use PowerDialPhase — kept for component imports */
export type PowerDialerState = PowerDialPhase;

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
  duration: number;
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
  apiFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const LS_KEY = 'pd_session_v2';

function setPhase(
  current: PowerDialPhase,
  next: PowerDialPhase,
  setter: (p: PowerDialPhase) => void,
): void {
  setter(transitionPowerPhase(current, next));
}

export function usePowerDialer(options: UsePowerDialerOptions = {}) {
  const { apiFetch } = useWorkspace();
  const [pdState, setPdState] = useState<PowerDialPhase>('idle');
  const [session, setSession] = useState<PowerSession | null>(null);
  const [currentLead, setCurrentLead] = useState<LeadRecord | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [calledLeadIds, setCalledLeadIds] = useState<string[]>([]);
  const [config, setConfig] = useState<SessionConfig>({ delay_seconds: 5 });
  const [queueRemaining, setQueueRemaining] = useState(0);

  const sessionRef = useRef(session);
  const stateRef = useRef(pdState);
  const calledRef = useRef(calledLeadIds);
  const currentLeadRef = useRef(currentLead);
  const configRef = useRef(config);
  const apiFetchRef = useRef(options.apiFetch ?? apiFetch);
  const onLeadReadyRef = useRef(options.onLeadReady);
  const onShouldDialRef = useRef(options.onShouldDial);
  const onSessionCompleteRef = useRef(options.onSessionComplete);
  sessionRef.current = session;
  stateRef.current = pdState;
  calledRef.current = calledLeadIds;
  currentLeadRef.current = currentLead;
  configRef.current = config;
  apiFetchRef.current = options.apiFetch ?? apiFetch;
  onLeadReadyRef.current = options.onLeadReady;
  onShouldDialRef.current = options.onShouldDial;
  onSessionCompleteRef.current = options.onSessionComplete;

  const preStateRef = useRef<PowerDialPhase>('dialing');
  const autoCalledRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const dialingRef = useRef(false);

  const saveLS = useCallback((
    sessionId: string,
    leadId?: string,
    countdownStart?: number,
    delaySeconds?: number,
    calledIds?: string[],
  ) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        sessionId,
        leadId,
        countdownStart,
        delaySeconds,
        calledLeadIds: calledIds,
      }));
    } catch { /* SSR safe */ }
  }, []);

  const clearLS = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  useEffect(() => {
    if (pdState !== 'dialing' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, pdState]);

  useEffect(() => {
    if (pdState !== 'dialing' || countdown !== 0 || autoCalledRef.current) return;
    const lead = currentLeadRef.current;
    if (!lead) return;

    autoCalledRef.current = true;
    if (dialingRef.current) return;
    dialingRef.current = true;
    onShouldDialRef.current?.(lead);
    dialingRef.current = false;
  }, [countdown, pdState]);

  const startCountdown = useCallback((seconds: number, lead: LeadRecord) => {
    const secs = Math.max(1, seconds);
    autoCalledRef.current = false;
    dialingRef.current = false;
    setCountdown(secs);
    saveLS(
      sessionRef.current?.id ?? '',
      lead.id,
      Date.now(),
      configRef.current.delay_seconds ?? 5,
      calledRef.current,
    );
  }, [saveLS]);

  const stopSession = useCallback(async (sess: PowerSession) => {
    setCountdown(0);
    clearLS();

    try {
      const res = await apiFetchRef.current(`/api/dialer/power-session/${sess.id}/end`, { method: 'POST' });
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
    setPhase(stateRef.current, 'ending', setPdState);
  }, [clearLS]);

  const loadNextLead = useCallback(async (sess: PowerSession, doneLeadId: string) => {
    setPhase(stateRef.current, 'dialing', setPdState);
    const called = [...calledRef.current, doneLeadId];
    setCalledLeadIds(called);

    try {
      const queue_config: DialerQueueConfig = getSavedQueueConfig();
      const res = await apiFetchRef.current(`/api/dialer/power-session/${sess.id}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeLeadId: doneLeadId, calledLeadIds: called, queue_config }),
      });
      const data = await res.json() as {
        next_lead?: LeadRecord | null;
        nextLead?: LeadRecord | null;
        queue_remaining?: number;
        done?: boolean;
        ended?: boolean;
      };

      const nextLead = data.next_lead ?? data.nextLead ?? null;
      const isDone = data.ended ?? data.done ?? false;

      if (isDone || !nextLead) {
        await stopSession(sess);
        return;
      }

      consecutiveErrorsRef.current = 0;
      setQueueRemaining(data.queue_remaining ?? 0);
      setCurrentLead(nextLead);
      onLeadReadyRef.current?.(nextLead);
      setPhase(stateRef.current, 'dialing', setPdState);
      startCountdown(configRef.current.delay_seconds ?? 5, nextLead);
    } catch {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= 3) {
        consecutiveErrorsRef.current = 0;
        preStateRef.current = 'dialing';
        setPhase(stateRef.current, 'paused', setPdState);
        apiFetchRef.current(`/api/dialer/power-session/${sess.id}/pause`, { method: 'POST' }).catch(() => {});
        toast.error('Auto-paused: 3 consecutive errors. Resume when ready.');
      } else {
        await stopSession(sess);
      }
    }
  }, [startCountdown, stopSession]);

  const start = useCallback(async (cfg?: SessionConfig) => {
    if (stateRef.current !== 'idle') return;
    const merged: SessionConfig = { delay_seconds: 5, ...cfg };
    setConfig(merged);
    setPhase(stateRef.current, 'dialing', setPdState);

    try {
      const queue_config = getSavedQueueConfig();
      const res = await apiFetchRef.current('/api/dialer/power-session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...merged, queue_config }),
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
      setPhase('idle', 'dialing', setPdState);
      startCountdown(merged.delay_seconds ?? 5, firstLead);
      saveLS(sess.id, firstLead.id, Date.now(), merged.delay_seconds ?? 5, []);
    } catch {
      setPdState('idle');
    }
  }, [saveLS, startCountdown]);

  const onCallStarted = useCallback(() => {
    if (stateRef.current === 'idle' || stateRef.current === 'paused') return;
    setCountdown(0);
    setPhase(stateRef.current, 'connected', setPdState);
  }, []);

  const onCallEnd = useCallback(() => {
    const s = stateRef.current;
    if (s === 'idle' || s === 'ending' || s === 'paused' || s === 'wrap_up') return;
    setPhase(s, 'wrap_up', setPdState);
  }, []);

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

    fetch(`/api/power-dial/sessions/${sess.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextStats),
    }).catch(() => {});

    await loadNextLead({ ...sess, ...nextStats }, lead.id);
  }, [loadNextLead]);

  const pause = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || stateRef.current === 'paused') return;

    preStateRef.current = stateRef.current;
    setPhase(stateRef.current, 'paused', setPdState);
    apiFetchRef.current(`/api/dialer/power-session/${sess.id}/pause`, { method: 'POST' }).catch(() => {});
  }, []);

  const resume = useCallback(async () => {
    const sess = sessionRef.current;
    const lead = currentLeadRef.current;
    if (!sess || stateRef.current !== 'paused') return;

    const prev = preStateRef.current;
    apiFetchRef.current(`/api/dialer/power-session/${sess.id}/resume`, { method: 'POST' }).catch(() => {});

    if (prev === 'dialing' && lead) {
      setPhase('paused', 'dialing', setPdState);
      startCountdown(configRef.current.delay_seconds ?? 5, lead);
    } else {
      setPhase('paused', prev, setPdState);
    }
  }, [startCountdown]);

  const skipCountdown = useCallback(() => {
    const lead = currentLeadRef.current;
    if (!lead || dialingRef.current) return;
    autoCalledRef.current = true;
    setCountdown(0);
    dialingRef.current = true;
    onShouldDialRef.current?.(lead);
    dialingRef.current = false;
  }, []);

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

  const dismissSummary = useCallback(() => {
    setSummary(null);
    setPdState('idle');
  }, []);

  useEffect(() => {
    let mounted = true;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        sessionId?: string;
        leadId?: string;
        countdownStart?: number;
        delaySeconds?: number;
        calledLeadIds?: string[];
      };
      const { sessionId, leadId, countdownStart, delaySeconds, calledLeadIds: savedCalled } = parsed;
      if (!sessionId) return;

      void (async () => {
        try {
          const res = await apiFetchRef.current('/api/dialer/power-session/active');
          const { activeSession } = await res.json() as { activeSession: PowerSession | null };
          if (!mounted || !activeSession || activeSession.id !== sessionId) {
            clearLS();
            return;
          }

          setSession(activeSession);
          if (savedCalled?.length) setCalledLeadIds(savedCalled);
          if (delaySeconds) setConfig((c) => ({ ...c, delay_seconds: delaySeconds }));

          let lead: LeadRecord | null = null;
          if (leadId) {
            const leadRes = await apiFetchRef.current(`/api/leads/${leadId}`);
            if (leadRes.ok) {
              const data = await leadRes.json() as { lead?: LeadRecord };
              lead = data.lead ?? null;
            }
          }

          if (lead) {
            setCurrentLead(lead);
            onLeadReadyRef.current?.(lead);
          }

          if (activeSession.status === 'paused') {
            setPdState('paused');
            return;
          }

          if (lead && countdownStart && delaySeconds) {
            const elapsed = Math.floor((Date.now() - countdownStart) / 1000);
            const remaining = Math.max(0, delaySeconds - elapsed);
            setPdState('dialing');
            if (remaining > 0) {
              autoCalledRef.current = false;
              setCountdown(remaining);
            } else {
              autoCalledRef.current = true;
              setCountdown(0);
              onShouldDialRef.current?.(lead);
            }
          } else {
            setPdState('dialing');
          }
        } catch {
          clearLS();
        }
      })();
    } catch {}
    return () => { mounted = false; };
  }, [clearLS]);

  const isActive = isPowerSessionActive(pdState);

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
    startSession: start,
    endSession: stop,
    advanceToNext: onDispositionSaved,
  };
}
