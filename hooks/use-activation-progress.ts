'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { ownCallsOrFilter } from '@/lib/auth/call-access';

export type ActivationStepId =
  | 'import_leads'
  | 'phone_number'
  | 'first_call'
  | 'first_disposition';

export interface ActivationProgress {
  loading: boolean;
  steps: Record<ActivationStepId, boolean>;
  completedCount: number;
  totalSteps: number;
  leadCount: number;
  numberCount: number;
  callCount: number;
  refresh: () => void;
}

const DISMISS_KEY = 'gd-activation-dismissed';

export function isActivationDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DISMISS_KEY) === '1';
}

export function dismissActivationChecklist(): void {
  localStorage.setItem(DISMISS_KEY, '1');
}

export function useActivationProgress(): ActivationProgress {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [leadCount, setLeadCount] = useState(0);
  const [numberCount, setNumberCount] = useState(0);
  const [callCount, setCallCount] = useState(0);
  const [dispositionCount, setDispositionCount] = useState(0);

  const refresh = useCallback(async () => {
    const wsId = currentWorkspace?.id;
    if (!wsId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const ownFilter = ownCallsOrFilter(wsId, user.id);

    const [leadsRes, numbersRes, callsRes, dispRes] = await Promise.all([
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', wsId)
        .is('deleted_at', null),
      supabase
        .from('purchased_numbers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .or(ownFilter),
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .or(ownFilter)
        .not('disposition', 'is', null),
    ]);

    setLeadCount(leadsRes.count ?? 0);
    setNumberCount(numbersRes.count ?? 0);
    setCallCount(callsRes.count ?? 0);
    setDispositionCount(dispRes.count ?? 0);
    setLoading(false);
  }, [currentWorkspace?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const steps: Record<ActivationStepId, boolean> = {
    import_leads: leadCount > 0,
    phone_number: numberCount > 0,
    first_call: callCount > 0,
    first_disposition: dispositionCount > 0,
  };

  const completedCount = Object.values(steps).filter(Boolean).length;

  return {
    loading,
    steps,
    completedCount,
    totalSteps: 4,
    leadCount,
    numberCount,
    callCount,
    refresh,
  };
}
