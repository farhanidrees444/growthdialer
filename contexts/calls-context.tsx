'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import { isAnonymousCaller } from '@/lib/twilio/caller-id-utils';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

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

function mapIncomingPhase(phase: ReturnType<typeof useWebPhone>['incomingCall']['phase']): CallPhase {
  if (phase === 'incoming' || phase === 'failed') return 'incoming';
  if (phase === 'connecting') return 'connecting';
  if (phase === 'ended') return 'ended';
  return 'idle';
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

  const phase = mapIncomingPhase(incomingCall.phase);
  const fromNumber = incomingCall.fromNumber;
  const toNumber = incomingCall.toNumber;
  const callId = incomingCall.callId;

  const fetchCallerContext = useCallback((from: string | null) => {
    if (!from || isAnonymousCaller(from)) {
      setCallerContext({ ...EMPTY_CALLER_CONTEXT, anonymous: true });
      return;
    }

    setCallerContext((prev) => ({ ...prev, loading: true }));
    void fetch(`/api/voice/caller-context?from=${encodeURIComponent(from)}`, {
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
      void Promise.resolve().then(() => {
        setCallerContext(EMPTY_CALLER_CONTEXT);
        setRingElapsedSec(0);
      });
      return;
    }
    void Promise.resolve().then(() => fetchCallerContext(fromNumber));
  }, [fetchCallerContext, fromNumber, phase]);

  useEffect(() => {
    if (phase !== 'incoming' && phase !== 'connecting') return;
    const startedAt = incomingCall.ringStartedAt ?? Date.now();
    const tick = () => setRingElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [incomingCall.ringStartedAt, phase]);

  const accept = useCallback(async () => {
    if (phase !== 'incoming') return;
    const micOk = await requestMicPermission();
    if (!micOk) return;
    registerCallMeta(null, fromNumber ?? '');
    void fetch('/api/inbound/accept', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_number: fromNumber,
        to_number: toNumber,
      }),
    }).catch(() => undefined);
    await answerIncomingCall();
  }, [answerIncomingCall, fromNumber, phase, registerCallMeta, requestMicPermission, toNumber]);

  const decline = useCallback(() => {
    void fetch('/api/inbound/decline', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_number: fromNumber,
        to_number: toNumber,
      }),
    }).catch(() => undefined);
    hangup();
  }, [fromNumber, hangup, toNumber]);

  const connectError = useMemo(() => {
    if (incomingCall.error) return incomingCall.error;
    if (staleTabWarning && phase !== 'idle') {
      return 'Another browser tab may also be registered for calls. Use one active call tab per agent.';
    }
    return null;
  }, [incomingCall.error, phase, staleTabWarning]);

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
  if (!from || ctx.anonymous) return 'Unknown Caller';
  return formatInboundCallerDisplay(from);
}
