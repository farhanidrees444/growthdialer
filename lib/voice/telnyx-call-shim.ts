import type { Call as TelnyxCall } from '@telnyx/webrtc';

export type VoiceSdkCall = TelnyxCall & {
  status: () => string;
  accept: (options?: unknown) => void;
  disconnect: () => void;
  reject: () => void;
  mute: (muted: boolean) => void;
  sendDigits: (digit: string) => void;
  getRemoteStream: () => MediaStream | null;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  parameters?: Record<string, string>;
  customParameters?: Map<string, string>;
};

type TwilioLikeEvent = 'ringing' | 'accept' | 'disconnect' | 'cancel' | 'reject' | 'error';

type PatchedCall = VoiceSdkCall;

const patched = new WeakSet<object>();
const listeners = new WeakMap<object, Map<string, Set<(...args: unknown[]) => void>>>();
const prevStates = new WeakMap<object, string>();
/** Inbound legs the agent explicitly accepted (Accept click). */
const userAcceptedInbound = new WeakSet<object>();

export function isInboundAwaitingUserAccept(call: TelnyxCall): boolean {
  return call.direction === 'inbound'
    && call.state === 'active'
    && !userAcceptedInbound.has(call);
}

export function markInboundUserAccepted(call: TelnyxCall): void {
  userAcceptedInbound.add(call);
}

function getListenerMap(call: object): Map<string, Set<(...args: unknown[]) => void>> {
  let map = listeners.get(call);
  if (!map) {
    map = new Map();
    listeners.set(call, map);
  }
  return map;
}

export function emitVoiceCallEvent(
  call: TelnyxCall,
  event: TwilioLikeEvent,
  ...args: unknown[]
): void {
  const handlers = getListenerMap(call).get(event);
  if (!handlers) return;
  for (const handler of handlers) {
    try {
      handler(...args);
    } catch (err) {
      console.warn('[voice/shim] event handler failed:', event, err);
    }
  }
}

function mapTelnyxStatus(call: TelnyxCall): string {
  switch (call.state) {
    case 'active':
      // Telnyx may bridge a SIP transfer before the agent clicks Accept — keep UI in pre-answer state.
      if (isInboundAwaitingUserAccept(call)) return 'pending';
      return 'open';
    case 'ringing':
      return call.direction === 'inbound' ? 'pending' : 'ringing';
    case 'trying':
    case 'new':
      return 'connecting';
    case 'hangup':
    case 'destroy':
      return 'closed';
    default:
      return call.state || 'connecting';
  }
}

function buildParameters(call: TelnyxCall): Record<string, string> {
  const params: Record<string, string> = {};
  const ids = call.telnyxIDs;
  if (ids.telnyxCallControlId) params.CallSid = ids.telnyxCallControlId;
  if (ids.telnyxSessionId) params.telnyx_session_id = ids.telnyxSessionId;
  if (ids.telnyxLegId) params.telnyx_leg_id = ids.telnyxLegId;

  const opts = call.options ?? {};
  const caller = (opts as { remoteCallerNumber?: string }).remoteCallerNumber
    ?? (opts as { callerNumber?: string }).callerNumber;
  const callee = (opts as { remoteCalleeNumber?: string }).remoteCalleeNumber
    ?? (opts as { destinationNumber?: string }).destinationNumber;
  if (caller) params.From = caller;
  if (callee) params.To = callee;

  const custom = (opts as { customHeaders?: Record<string, string> }).customHeaders;
  if (custom) {
    for (const [key, value] of Object.entries(custom)) {
      if (value) params[key] = value;
    }
  }

  return params;
}

export function patchTelnyxCall(call: TelnyxCall): PatchedCall {
  if (patched.has(call)) return call as PatchedCall;

  const patchedCall = call as PatchedCall;
  prevStates.set(call, call.state);

  patchedCall.parameters = buildParameters(call);
  patchedCall.customParameters = new Map(Object.entries(patchedCall.parameters));

  patchedCall.status = () => mapTelnyxStatus(call);
  patchedCall.accept = () => {
    markInboundUserAccepted(call);
    if (call.state === 'active') {
      emitVoiceCallEvent(call, 'accept');
      return;
    }
    void call.answer();
  };
  patchedCall.disconnect = () => {
    void call.hangup();
  };
  patchedCall.reject = () => {
    void call.hangup();
  };
  patchedCall.mute = (muted: boolean) => {
    if (muted) call.muteAudio();
    else call.unmuteAudio();
  };
  patchedCall.sendDigits = (digit: string) => {
    call.dtmf(digit);
  };
  patchedCall.getRemoteStream = () => {
    try {
      return call.remoteStream ?? null;
    } catch {
      return null;
    }
  };
  patchedCall.on = (event: string, handler: (...args: unknown[]) => void) => {
    const map = getListenerMap(call);
    const set = map.get(event) ?? new Set();
    set.add(handler);
    map.set(event, set);
  };

  patched.add(call);
  return patchedCall;
}

export function handleTelnyxCallStateChange(call: TelnyxCall): void {
  const prev = prevStates.get(call) ?? '';
  const next = call.state;
  if (prev === next) return;
  prevStates.set(call, next);

  const patchedCall = patchTelnyxCall(call);
  patchedCall.parameters = buildParameters(call);
  patchedCall.customParameters = new Map(Object.entries(patchedCall.parameters));

  if (next === 'ringing' && prev !== 'ringing') {
    emitVoiceCallEvent(call, 'ringing');
  }

  if (next === 'active' && prev !== 'active') {
    if (isInboundAwaitingUserAccept(call)) {
      // Pre-bridged SIP transfer — surface as ring, not connected.
      emitVoiceCallEvent(call, 'ringing');
      return;
    }
    emitVoiceCallEvent(call, 'accept');
  }

  if (next === 'hangup' || next === 'destroy') {
    emitVoiceCallEvent(call, 'disconnect');
  }
}
