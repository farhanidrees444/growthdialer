'use client';

import { motion } from 'framer-motion';
import { Phone, Sparkles, Users } from 'lucide-react';
import { useWebPhone } from '@/contexts/webphone-context';
import { isActiveCallStatus } from '@/lib/ui/floating-edge';
import { cn } from '@/lib/utils';

interface DialerFloatingActionsProps {
  mode: string;
  selectedLead: { id: string } | null;
  queueCount: number;
  onOpenDialpad: () => void;
  onOpenQueue: () => void;
  onOpenAiBrief: () => void;
  onOpenLiveInsights: () => void;
}

export function DialerFloatingActions({
  mode,
  selectedLead,
  queueCount,
  onOpenDialpad,
  onOpenQueue,
  onOpenAiBrief,
  onOpenLiveInsights,
}: DialerFloatingActionsProps) {
  const { callStatus } = useWebPhone();
  const callOverlayOwnsEdge = isActiveCallStatus(callStatus) && !selectedLead;

  if (callOverlayOwnsEdge) return null;

  const showManualDial = mode !== 'live';
  const showAiBrief = mode === 'preview' && Boolean(selectedLead);
  const showLiveInsights = mode === 'live' && Boolean(selectedLead);

  return (
    <>
      {/* Desktop — single stack host (lg+) */}
      {showManualDial && (
        <div className="gd-floating-edge gd-floating-edge--desktop hidden lg:flex">
          <motion.button
            key="manual-dial-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenDialpad}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.07] shadow-xl backdrop-blur-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Open manual dialer (D)"
          >
            <Phone className="h-5 w-5 text-white" />
          </motion.button>
        </div>
      )}

      {/* Mobile / tablet — same host, aligned with desktop breakpoint */}
      <motion.div
        key="mobile-fab-stack"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn('gd-floating-edge gd-floating-edge--mobile-dialer lg:hidden')}
      >
        {showLiveInsights && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenLiveInsights}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl gradient-brand"
            aria-label="Open live insights"
          >
            <Sparkles className="h-5 w-5" />
          </motion.button>
        )}
        {showAiBrief && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenAiBrief}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl gradient-brand"
            aria-label="Open AI Brief"
          >
            <Sparkles className="h-5 w-5" />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenQueue}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.08] text-white shadow-xl backdrop-blur-xl"
          aria-label="Open Queue"
        >
          <Users className="h-5 w-5" />
          {queueCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {queueCount > 99 ? '99+' : queueCount}
            </span>
          )}
        </motion.button>
      </motion.div>
    </>
  );
}
