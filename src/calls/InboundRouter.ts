import type { Call } from '@twilio/voice-sdk';

export type InboundDecision =
  | { action: 'queue'; reason: 'device_not_ready' }
  | { action: 'reject'; reason: 'outbound_busy' | 'active_call_busy' }
  | { action: 'ring' };

export function decideInboundCall(params: {
  call: Call;
  deviceReady: boolean;
  hasDevice: boolean;
  hasActiveCall: boolean;
  outboundDialActive: boolean;
}): InboundDecision {
  if (!params.deviceReady || !params.hasDevice) {
    return { action: 'queue', reason: 'device_not_ready' };
  }

  if (params.outboundDialActive) {
    return { action: 'reject', reason: 'outbound_busy' };
  }

  if (params.hasActiveCall) {
    return { action: 'reject', reason: 'active_call_busy' };
  }

  return { action: 'ring' };
}
