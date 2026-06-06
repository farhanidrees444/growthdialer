'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useWebPhone } from '@/contexts/webphone-context';
import { maybeEmitFirstCallToday } from '@/lib/ui/milestone-events';
import { playConnectChime } from '@/lib/ui/sound-preferences';

/** Watches call state for first-call-today milestone + connect chime (opt-in sound). */
export function MilestoneWatcher() {
  const { callStatus } = useWebPhone();
  const pathname = usePathname();

  useEffect(() => {
    if (callStatus !== 'active') return;
    maybeEmitFirstCallToday();
    playConnectChime();
  }, [callStatus]);

  void pathname;
  return null;
}
