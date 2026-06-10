'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useCallContext } from '@/lib/call-context';
import { useCallOrchestrator } from '@/contexts/call-orchestrator-context';
import { normalizePhone, isE164 } from '@/lib/phone';
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
      if ((lead?.status as string) === 'invalid_phone' || lead?.dnc) {
        toast.error(
          lead?.dnc ? 'This lead is on the Do Not Call list' : 'This lead has an invalid phone number',
        );
        return;
      }

      const e164 = normalizePhone(phone) ?? (isE164(phone) ? phone : null);
      if (!e164) {
        toast.error('Invalid phone number');
        return;
      }

      beginOutboundCall(e164, lead?.id, lead ?? null);
      void startCall(e164, lead ?? null, callerNumber);
    },
    [beginOutboundCall, startCall],
  );
}
