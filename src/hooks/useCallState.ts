'use client';

import { useEffect, useState } from 'react';
import {
  callOrchestrator,
  type CallOrchestratorSnapshot,
} from '@/src/calls/CallOrchestrator';
import { eventBus } from '@/src/calls/eventBus';

export function useCallState() {
  const [state, setState] = useState<CallOrchestratorSnapshot>(() => callOrchestrator.getSnapshot());

  useEffect(() => {
    const off = eventBus.on<CallOrchestratorSnapshot>('CALL_SNAPSHOT', setState);
    setState(callOrchestrator.getSnapshot());
    return off;
  }, []);

  return state;
}
