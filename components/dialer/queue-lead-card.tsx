'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/lib/dialer/avatar-color';
import { getLocalTime } from '@/lib/utils/timezone';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { cn } from '@/lib/utils';

const LAST_DISPOSITION_COLOR: Record<string, string> = {
  interested: 'bg-green-400',
  meeting_booked: 'bg-green-500',
  callback: 'bg-cyan-400',
  voicemail: 'bg-yellow-400',
  not_interested: 'bg-red-500',
  dnc: 'bg-red-600',
  no_answer: 'bg-zinc-500',
};

interface QueueLeadCardProps {
  lead: LeadRecord;
  selected?: boolean;
  lastDisposition?: string | null;
  onClick: () => void;
  index?: number;
}

export function QueueLeadCard({ lead, selected, lastDisposition, onClick, index = 0 }: QueueLeadCardProps) {
  const reduce = useReducedMotion();
  const gradient = getAvatarGradient(lead.id);
  const tz = getLocalTime(lead.phone);

  return (
    <motion.button
      layout
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { x: 2 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'relative mb-1 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
        selected
          ? 'bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
          : 'hover:bg-white/[0.04]',
      )}
      aria-selected={selected}
      aria-label={`Select ${lead.name}`}
    >
      {selected && (
        <motion.div
          layoutId="queue-lead-accent"
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: 'linear-gradient(to bottom, #7C3AED, #06B6D4)' }}
        />
      )}

      <motion.div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ background: gradient.css }}
        whileHover={reduce ? undefined : { scale: 1.05 }}
      >
        {getInitials(lead.name)}
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-white">{lead.name}</span>
          {(lead.ai_score ?? 0) >= 70 && (
            <span className="shrink-0 rounded border border-yellow-400/20 bg-yellow-400/15 px-1 py-px text-[9px] text-yellow-400">
              HOT
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 truncate text-xs text-white/50">
          {lead.company && <span>{lead.company}</span>}
          {lead.company && lead.title && <span>·</span>}
          {lead.title && <span className="truncate">{lead.title}</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {tz.hasData && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums',
              tz.isUnsafe
                ? 'border border-red-500/20 bg-red-500/20 text-red-400'
                : 'bg-white/[0.06] text-white/50',
            )}
          >
            {tz.stateAbbr} {tz.time}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-white/20 transition-colors group-hover:text-white/50" />
      </div>

      {lastDisposition && (
        <div
          className={cn(
            'absolute bottom-2.5 right-2 h-1.5 w-1.5 rounded-full',
            LAST_DISPOSITION_COLOR[lastDisposition] ?? 'bg-zinc-500',
          )}
        />
      )}
    </motion.button>
  );
}
