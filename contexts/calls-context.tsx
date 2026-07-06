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
import { useInboundServerRing } from '@/hooks/use-inbound-server-ring';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { isAnonymousCaller } from '@/lib/twilio/caller-id-utils';
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

function mapIncomingPhase(phase: ReturnType<typeof useWebPhone>['incomingCall']['phase']): CallPhase {
  if (phase === 'incoming' || phase === 'failed') return 'incoming';
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
  const session = useSupabaseSession();
  const userId = session?.user?.id;
  const {
    incomingCall,
    requestMicPermission,
    answerIncomingCall,
    hangup,
    staleTabWarning,
  } = useWebPhone();
  const { registerCallMeta } = useCallContext();
  const { serverRing, clearServerRing } = useInboundServerRing(userId);
  const [callerContext, setCallerContext] = useState<CallerContext>(EMPTY_CALLER_CONTEXT);
  const [ringElapsedSec, setRingElapsedSec] = useState(0);
  const [connectingFromServer, setConnectingFromServer] = useState(false);

  const webrtcPhase = mapIncomingPhase(incomingCall.phase);

  const phase: CallPhase = useMemo(() => {
    if (webrtcPhase !== 'idle') return webrtcPhase;
    if (connectingFromServer) return 'connecting';
    if (serverRing) return 'incoming';
    return 'idle';
  }, [connectingFromServer, serverRing, webrtcPhase]);

  const fromNumber = incomingCall.fromNumber ?? serverRing?.fromNumber ?? null;
  const toNumber = incomingCall.toNumber ?? serverRing?.toNumber ?? null;
  const callId = incomingCall.callId ?? serverRing?.inboundCallId ?? null;

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
      setConnectingFromServer(false);
      return;
    }
    fetchCallerContext(fromNumber);
  }, [fetchCallerContext, fromNumber, phase]);

  useEffect(() => {
    if (webrtcPhase === 'incoming' || webrtcPhase === 'connecting') {
      clearServerRing({ stopTone: false });
      setConnectingFromServer(false);
    }
  }, [clearServerRing, webrtcPhase]);

  useEffect(() => {
    if (phase !== 'incoming' && phase !== 'connecting') return;
    const startedAt = incomingCall.ringStartedAt ?? serverRing?.ringStartedAt ?? Date.now();
    const tick = () => setRingElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [incomingCall.ringStartedAt, phase, serverRing?.ringStartedAt]);

  const accept = useCallback(async () => {
    if (phase !== 'incoming') return;
    const micOk = await requestMicPermission();
    if (!micOk) return;

    registerCallMeta(null, fromNumber ?? '');
    setConnectingFromServer(true);

    await fetch('/api/inbound/accept', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inbound_call_id: serverRing?.inboundCallId,
        provider_call_id: serverRing?.providerCallId,
        from_number: fromNumber,
        to_number: toNumber,
      }),
    }).catch(() => undefined);

    let answered = await answerIncomingCall();
    if (!answered) {
      for (let i = 0; i < 24; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        answered = await answerIncomingCall();
        if (answered) break;
      }
    }

    if (!answered) {
      setConnectingFromServer(false);
    }
    clearServerRing();
  }, [
    answerIncomingCall,
    clearServerRing,
    fromNumber,
    phase,
    registerCallMeta,
    requestMicPermission,
    serverRing?.inboundCallId,
    serverRing?.providerCallId,
    toNumber,
  ]);

  const decline = useCallback(() => {
    void fetch('/api/inbound/decline', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inbound_call_id: serverRing?.inboundCallId,
        provider_call_id: serverRing?.providerCallId,
        from_number: fromNumber,
        to_number: toNumber,
      }),
    }).catch(() => undefined);
    clearServerRing();
    setConnectingFromServer(false);
    hangup();
  }, [clearServerRing, fromNumber, hangup, serverRing?.inboundCallId, serverRing?.providerCallId, toNumber]);

  const connectError = useMemo(() => {
    if (incomingCall.error) return incomingCall.error;
    if (staleTabWarning && phase !== 'idle') {
      return 'Another browser tab may also be registered for calls. Use one active call tab per agent.';
    }
    if (connectingFromServer && webrtcPhase === 'idle') {
      return 'Waiting for voice link — keep this tab open on Incoming.';
    }
    return null;
  }, [connectingFromServer, incomingCall.error, phase, staleTabWarning, webrtcPhase]);

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
