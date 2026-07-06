import type { VoiceSdkCall } from '@/lib/voice/telnyx-call-shim';
import { extractCallSidFromSdkCall } from '@/lib/voice/extract-call-id';
import { eventBus } from './eventBus';

export type CallDirection = 'inbound' | 'outbound';
export type CallSessionPhase = 'pending' | 'ringing' | 'connecting' | 'active' | 'ended' | 'failed';

let fallbackCallId = 0;

function stableCallId(call: VoiceSdkCall): string {
  const sid = extractCallSidFromSdkCall(call);
  if (sid) return sid;

  const c = call as VoiceSdkCall & { __gdSessionId?: string };
  if (!c.__gdSessionId) {
    fallbackCallId += 1;
    c.__gdSessionId = call.id || `call-${fallbackCallId}`;
  }
  return c.__gdSessionId;
}

export class CallSession {
  readonly id: string;
  phase: CallSessionPhase;
  private bound = false;

  constructor(
    readonly call: VoiceSdkCall,
    readonly direction: CallDirection,
    readonly meta: { from?: string | null; to?: string | null } = {},
  ) {
    this.id = stableCallId(call);
    this.phase = direction === 'inbound' ? 'ringing' : 'connecting';
  }

  bind(): void {
    if (this.bound) return;
    this.bound = true;

    this.call.on('ringing', () => {
      this.phase = 'ringing';
      eventBus.emit('CALL_SESSION_UPDATED', this.snapshot());
    });

    this.call.on('accept', () => {
      this.phase = 'active';
      eventBus.emit('CALL_SESSION_UPDATED', this.snapshot());
    });

    this.call.on('disconnect', () => {
      this.phase = 'ended';
      eventBus.emit('CALL_SESSION_ENDED', this.snapshot());
      eventBus.emit('CALL_SESSION_UPDATED', this.snapshot());
    });

    this.call.on('cancel', () => {
      this.phase = 'ended';
      eventBus.emit('CALL_SESSION_ENDED', this.snapshot());
      eventBus.emit('CALL_SESSION_UPDATED', this.snapshot());
    });

    this.call.on('reject', () => {
      this.phase = 'ended';
      eventBus.emit('CALL_SESSION_ENDED', this.snapshot());
      eventBus.emit('CALL_SESSION_UPDATED', this.snapshot());
    });

    this.call.on('error', (error: unknown) => {
      this.phase = 'failed';
      eventBus.emit('CALL_SESSION_ERROR', { session: this.snapshot(), error });
      eventBus.emit('CALL_SESSION_UPDATED', this.snapshot());
    });
  }

  snapshot() {
    return {
      id: this.id,
      phase: this.phase,
      direction: this.direction,
      from: this.meta.from ?? null,
      to: this.meta.to ?? null,
      call: this.call,
    };
  }
}
