'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface PowerSession {
  id: string;
  total_calls: number;
  connected_calls: number;
  meetings_booked: number;
  total_talk_time: number;
  status: string;
}

interface UsePowerDialOptions {
  onLeadReady: (lead: LeadRecord) => void;
  onSessionEnd: (summary: PowerSession) => void;
}

export function usePowerDial({ onLeadReady, onSessionEnd }: UsePowerDialOptions) {
  const [session, setSession] = useState<PowerSession | null>(null);
  const [calledLeadIds, setCalledLeadIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastCallStats, setLastCallStats] = useState<{ connected: boolean; met: boolean } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const isActive = session?.status === 'active';

  // Resume any active session on mount
  useEffect(() => {
    fetch('/api/dialer/power-session/active')
      .then((r) => r.json())
      .then(({ activeSession }) => {
        if (activeSession) {
          setSession(activeSession);
          toast.info('Power dial session resumed');
        }
      })
      .catch(() => {});
  }, []);

  const startSession = useCallback(async (queueSize: number): Promise<void> => {
    if (queueSize === 0) { toast.error('Queue is empty'); return; }

    try {
      const res = await fetch('/api/dialer/power-session/start', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json() as { session: PowerSession; firstLead: LeadRecord | null; queueSize: number };

      setSession(data.session);
      setCalledLeadIds([]);

      if (!data.firstLead) { toast.info('No leads in queue'); return; }

      toast.success(`Power Dial started · ${data.queueSize} leads`);
      onLeadReady(data.firstLead);
    } catch {
      toast.error('Could not start Power Dial');
    }
  }, [onLeadReady]);

  const advanceToNext = useCallback(async (currentLeadId: string, wasConnected: boolean, wasMeeting: boolean) => {
    const sess = sessionRef.current;
    if (!sess) return;

    // Update session stats
    const nextStats = {
      total_calls: sess.total_calls + 1,
      connected_calls: sess.connected_calls + (wasConnected ? 1 : 0),
      meetings_booked: sess.meetings_booked + (wasMeeting ? 1 : 0),
    };

    setLastCallStats({ connected: wasConnected, met: wasMeeting });
    setCalledLeadIds((prev) => [...prev, currentLeadId]);

    // Patch session stats in DB (fire-and-forget)
    fetch(`/api/power-dial/sessions/${sess.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextStats),
    }).catch(() => {});

    setSession((prev) => prev ? { ...prev, ...nextStats } : prev);

    // Start 5-second countdown before next call
    setCountdown(5);
    let secs = 5;
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(async () => {
      secs--;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);

        // Fetch next lead
        const allCalled = [...calledLeadIds, currentLeadId];
        try {
          const res = await fetch(`/api/dialer/power-session/${sess.id}/next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ excludeLeadId: currentLeadId, calledLeadIds: allCalled }),
          });
          const data = await res.json() as { nextLead: LeadRecord | null; done: boolean };

          if (data.done || !data.nextLead) {
            await endSession();
          } else {
            onLeadReady(data.nextLead);
          }
        } catch {
          toast.error('Could not load next lead');
        }
      }
    }, 1000);
  }, [calledLeadIds, onLeadReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const skipCountdown = useCallback(() => {
    clearInterval(countdownRef.current);
    setCountdown(null);
  }, []);

  const endSession = useCallback(async () => {
    const sess = sessionRef.current;
    clearInterval(countdownRef.current);
    setCountdown(null);

    if (!sess) return;

    try {
      const res = await fetch(`/api/dialer/power-session/${sess.id}/end`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json() as { session: PowerSession };
        setSession(null);
        setCalledLeadIds([]);
        onSessionEnd(data.session);
        toast.success(`Session ended · ${data.session.total_calls} calls made`);
      }
    } catch {
      toast.error('Could not end session');
    }
    setSession(null);
  }, [onSessionEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { clearInterval(countdownRef.current); };
  }, []);

  return {
    session,
    isActive,
    countdown,
    lastCallStats,
    startSession,
    advanceToNext,
    skipCountdown,
    endSession,
  };
}
