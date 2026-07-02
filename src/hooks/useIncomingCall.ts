'use client';

import { useEffect, useState } from 'react';
import type { VoiceSdkCall } from '@/lib/voice/telnyx-call-shim';
import { eventBus } from '@/src/calls/eventBus';

export function useIncomingCall() {
  const [call, setCall] = useState<VoiceSdkCall | null>(null);

  useEffect(() => {
    const offIncoming = eventBus.on<VoiceSdkCall>('CALL_INCOMING', setCall);
    const offActive = eventBus.on('CALL_ACTIVE', () => setCall(null));
    const offEnded = eventBus.on('CALL_SESSION_ENDED', () => setCall(null));
    return () => {
      offIncoming();
      offActive();
      offEnded();
    };
  }, []);

  return call;
}
