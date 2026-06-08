'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';
import {
  CALL_DOCK_GAP_PX,
  CALL_DOCK_RESERVE_PX,
  isActiveCallStatus,
} from '@/lib/ui/floating-edge';

/**
 * Publishes CSS variables so FAB stacks reserve space above the call bar / pop-out badge.
 * Dialer hides its own FAB column when the global call overlay owns the right edge.
 */
export function FloatingEdgeProvider({ children }: { children: ReactNode }) {
  const { callStatus } = useWebPhone();
  const { activeLead } = useCallContext();
  const pathname = usePathname();

  const callActive = isActiveCallStatus(callStatus);
  const onDialerWithLead = Boolean(pathname?.startsWith('/dialer') && activeLead);
  const reservesCallDock = callActive && !onDialerWithLead;

  useEffect(() => {
    const root = document.documentElement;
    const reserve = reservesCallDock
      ? `${CALL_DOCK_RESERVE_PX + CALL_DOCK_GAP_PX}px`
      : '0px';
    root.style.setProperty('--gd-dock-call-height', reserve);
    root.style.setProperty('--gd-dock-call-active', reservesCallDock ? '1' : '0');
    return () => {
      root.style.setProperty('--gd-dock-call-height', '0px');
      root.style.setProperty('--gd-dock-call-active', '0');
    };
  }, [reservesCallDock]);

  return children;
}
