'use client';

import { useState, useCallback } from 'react';
import type { DialerMode, LeadRecord } from '@/lib/dialer/state-machine';

interface DialerModeState {
  mode: DialerMode;
  selectedLead: LeadRecord | null;
  activeCallId: string | null;
  activeCallDbId: string | null;
}

export function useDialerMode() {
  const [state, setState] = useState<DialerModeState>({
    mode: 'browse',
    selectedLead: null,
    activeCallId: null,
    activeCallDbId: null,
  });

  const selectLead = useCallback((lead: LeadRecord | null) => {
    setState((prev) => ({
      ...prev,
      mode: lead ? 'preview' : 'browse',
      selectedLead: lead,
    }));
  }, []);

  const startCall = useCallback((callId: string, dbCallId: string) => {
    setState((prev) => ({
      ...prev,
      mode: 'live',
      activeCallId: callId,
      activeCallDbId: dbCallId,
    }));
  }, []);

  const endCall = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mode: prev.selectedLead ? 'preview' : 'browse',
      activeCallId: null,
      activeCallDbId: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ mode: 'browse', selectedLead: null, activeCallId: null, activeCallDbId: null });
  }, []);

  return {
    mode: state.mode,
    selectedLead: state.selectedLead,
    activeCallId: state.activeCallId,
    activeCallDbId: state.activeCallDbId,
    selectLead,
    startCall,
    endCall,
    reset,
  };
}
