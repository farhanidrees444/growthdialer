'use client';

import { useCallback } from 'react';
import { useCallContext } from '@/lib/call-context';
import { useCallOrchestrator } from '@/contexts/call-orchestrator-context';
import type { LeadRecord } from '@/components/dialer/LeadCard';

/**
 * Starts an outbound call from any dashboard page with orchestrator registration
 * so disposition modal + DB call record work off the dialer route.
 */
export function useOutboundCall() {
  const { startCall } = useCallContext();
  const { beginOutboundCall } = useCallOrchestrator();

  return useCallback(
    (phone: string, lead?: LeadRecord | null, callerNumber?: string) => {
      beginOutboundCall(phone, lead?.id, lead ?? null);
      void startCall(phone, lead ?? null, callerNumber);
    },
    [beginOutboundCall, startCall],
  );
}
