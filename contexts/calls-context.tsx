'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { isAnonymousCaller } from '@/lib/inbound/caller-id-utils';
import { formatInboundCallerDisplay, isValidCallerPhone, normalizeE164 } from '@/lib/inbound/phone';

export type CallPhase = 'idle' | 'incoming' | 'connecting' | 'ended';

export interface CallerContext {
  loading: boolean;
  anonymous: boolean;
  leadName: string | null;
  company: string | null;
  callerName: string | null;
  carrier: string | null;
  pastCallCount: number;
  lastDisposition: string | null;
}

export interface CallsContextValue {
  phase: CallPhase;
  fromNumber: string | null;
  toNumber: string | null;
  callId: string | null;
  ringElapsedSec: number;
  connectError: string | null;
  callerContext: CallerContext;
  isInboundSession: boolean;
  isRinging: boolean;
  accept: () => Promise<void>;
  decline: () => void;
}

const CallsContext = createContext<CallsContextValue | null>(null);

const EMPTY_CALLER_CONTEXT: CallerContext = {
  loading: false,
  anonymous: false,
  leadName: null,
  company: null,
  callerName: null,
  carrier: null,
  pastCallCount: 0,
  lastDisposition: null,
};

function mapIncomingPhase(
  phase: ReturnType<typeof useWebPhone>['incomingCall']['phase'],
): CallPhase {
  if (phase === 'incoming') return 'incoming';
  // A failed call is over — it must never reopen as a fresh "incoming" ring.
  if (phase === 'failed') return 'ended';
  if (phase === 'connecting') return 'connecting';
  if (phase === 'ended') return 'ended';
  return 'idle';
}

function lookupFromForContext(from: string | null): string | null {
  if (!from) return null;
  if (isValidCallerPhone(from)) return normalizeE164(from);
  return null;
}

export function CallsProvider({ children }: { children: ReactNode }) {
  const {
    incomingCall,
    requestMicPermission,
    answerIncomingCall,
    hangup,
    staleTabWarning,
  } = useWebPhone();
  const { registerCallMeta } = useCallContext();
  const [callerContext, setCallerContext] = useState<CallerContext>(EMPTY_CALLER_CONTEXT);
  const [ringElapsedSec, setRingElapsedSec] = useState(0);
  /** Generic accept failure shown in the call overlay (never vendor-specific). */
  const [connectErrorLocal, setConnectErrorLocal] = useState<string | null>(null);

  // Native inbound: the browser WebRTC client IS the call path now. When it
  // rings, the call is genuinely answerable — no server hunt, no bridge step,
  // no second "server ring" source of truth.
  const phase: CallPhase = mapIncomingPhase(incomingCall.phase);

  const fromNumber = incomingCall.fromNumber;
  const toNumber = incomingCall.toNumber;
  const callId = incomingCall.callId;

  const fetchCallerContext = useCallback((from: string | null) => {
    const lookup = lookupFromForContext(from);
    if (!lookup || isAnonymousCaller(lookup)) {
      setCallerContext({ ...EMPTY_CALLER_CONTEXT, anonymous: !lookup });
      return;
    }

    setCallerContext((prev) => ({ ...prev, loading: true }));
    void fetch(`/api/voice/caller-context?from=${encodeURIComponent(lookup)}`, {
      credentials: 'same-origin',
    })
      .then((r) => r.json())
      .then((data) => {
        setCallerContext({
          loading: false,
          anonymous: Boolean(data.anonymous),
          leadName: data.lead?.name ?? null,
          company: data.lead?.company ?? null,
          callerName: data.lookup?.callerName ?? null,
          carrier: data.lookup?.carrier ?? null,
          pastCallCount: data.past_call_count ?? 0,
          lastDisposition: data.last_disposition ?? null,
        });
      })
      .catch(() => {
        setCallerContext((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  useEffect(() => {
    if (phase === 'idle') {
      setCallerContext(EMPTY_CALLER_CONTEXT);
      setRingElapsedSec(0);
      setConnectErrorLocal(null);
      return;
    }
    fetchCallerContext(fromNumber);
  }, [fetchCallerContext, fromNumber, phase]);

  // Client-side inbound call logging. The server is no longer in the call
  // path, so the browser reports its own inbound calls for call history:
  // create on ring, mark answered on accept, finalize on hangup/miss.
  const loggedCallsRef = useRef(new Map<string, { answered: boolean; liveStartedAt: number | null }>());
  useEffect(() => {
    const id = incomingCall.callId;
    const st = incomingCall.phase;
    if (!id || st === 'idle') return;
    const track = loggedCallsRef.current;

    if (st === 'incoming' && !track.has(id)) {
      track.set(id, { answered: false, liveStartedAt: null });
      void fetch('/api/calls/log', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_number: incomingCall.fromNumber,
          to_number: incomingCall.toNumber,
          telnyx_call_id: id,
          started_at: new Date(incomingCall.ringStartedAt ?? Date.now()).toISOString(),
        }),
      }).catch(() => undefined);
      return;
    }

    const entry = track.get(id);
    if (!entry) return;

    // Answered is ONLY the SDK-confirmed active state (real media flowing).
    // "connecting" is just the answer handshake in progress — marking it
    // answered here was the lie that faked "active" calls with no audio.
    if (!entry.answered && st === 'active') {
      entry.answered = true;
      entry.liveStartedAt = incomingCall.liveStartedAt ?? Date.now();
      void fetch('/api/calls/log', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telnyx_call_id: id,
          answered_at: new Date(entry.liveStartedAt).toISOString(),
          status: 'in-progress',
        }),
      }).catch(() => undefined);
      return;
    }

    if (st === 'ended' || st === 'failed') {
      const endedAtMs = Date.now();
      const duration =
        entry.answered && entry.liveStartedAt
          ? Math.max(0, Math.round((endedAtMs - entry.liveStartedAt) / 1000))
          : 0;
      void fetch('/api/calls/log', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telnyx_call_id: id,
          ended_at: new Date(endedAtMs).toISOString(),
          duration_seconds: duration,
          status: entry.answered ? 'completed' : 'no_answer',
        }),
      }).catch(() => undefined);
      track.delete(id);
    }
  }, [incomingCall]);

  useEffect(() => {
    if (phase !== 'incoming' && phase !== 'connecting') return;
    const startedAt = incomingCall.ringStartedAt ?? Date.now();
    const tick = () => setRingElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [incomingCall.ringStartedAt, phase]);

  const VOICE_CONNECT_ERROR =
    "Voice isn't connected. Check your browser voice connection and try again.";

  const accept = useCallback(async () => {
    if (phase !== 'incoming') return;
    const micOk = await requestMicPermission();
    if (!micOk) return;
    setConnectErrorLocal(null);

    // Native inbound: answer the browser call directly. The shim awaits the
    // real SDK answer() and reports success/failure — the overlay never shows
    // a fake "connecting" state, and there is no server bridge step anymore.
    let answered = await answerIncomingCall();
    const deadline = Date.now() + 3000;
    while (!answered && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      answered = await answerIncomingCall();
    }

    if (!answered) {
      setConnectErrorLocal(VOICE_CONNECT_ERROR);
      return;
    }

    registerCallMeta(null, fromNumber ?? '');
  }, [answerIncomingCall, fromNumber, phase, registerCallMeta, requestMicPermission]);

  const decline = useCallback(() => {
    hangup();
  }, [hangup]);

  const connectError = useMemo(() => {
    if (incomingCall.error) return incomingCall.error;
    if (connectErrorLocal) return connectErrorLocal;
    if (staleTabWarning && phase !== 'idle') {
      return 'Another browser tab may also be registered for calls. Use one active call tab per agent.';
    }
    return null;
  }, [connectErrorLocal, incomingCall.error, phase, staleTabWarning]);

  return (
    <CallsContext.Provider
      value={{
        phase,
        fromNumber,
        toNumber,
        callId,
        ringElapsedSec,
        connectError,
        callerContext,
        isInboundSession: phase !== 'idle',
        isRinging: phase === 'incoming',
        accept,
        decline,
      }}
    >
      {children}
    </CallsContext.Provider>
  );
}

export function useCalls(): CallsContextValue {
  const ctx = useContext(CallsContext);
  if (!ctx) throw new Error('useCalls must be used inside CallsProvider');
  return ctx;
}

export function useCallerDisplayName(from: string | null, ctx: CallerContext): string {
  if (ctx.leadName) return ctx.leadName;
  if (ctx.callerName) return ctx.callerName;
  if (!from || ctx.anonymous) return formatInboundCallerDisplay(from);
  return formatInboundCallerDisplay(from);
}
