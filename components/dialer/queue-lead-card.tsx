'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/lib/dialer/avatar-color';
import { getLocalTime } from '@/lib/utils/timezone';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { cn } from '@/lib/utils';

const LAST_DISPOSITION_COLOR: Record<string, string> = {
  interested: 'bg-cyan-400',
  meeting_booked: 'bg-violet-400',
  callback: 'bg-cyan-400',
  voicemail: 'bg-white/35',
  not_interested: 'bg-white/25',
  dnc: 'bg-violet-300',
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
      whileHover={reduce ? undefined : { y: -1 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'relative mb-1 w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-0',
        selected
          ? 'border-white/[0.10] bg-white/[0.065] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl'
          : 'border-transparent hover:border-white/[0.07] hover:bg-white/[0.035] hover:shadow-[0_10px_30px_rgba(0,0,0,0.22)]',
      )}
      aria-selected={selected}
      aria-label={`Select ${lead.name}`}
    >
      {selected && (
        <motion.div
          layoutId="queue-lead-accent"
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full shadow-[0_0_18px_rgba(139,92,246,0.5)]"
          style={{ background: 'linear-gradient(to bottom, #8B5CF6, #06B6D4)' }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      )}

      <motion.div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-[1.5px] text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(6,182,212,0.68))' }}
        whileHover={reduce ? undefined : { scale: 1.05 }}
      >
        <span className="absolute inset-0 rounded-full opacity-40 blur-md" style={{ background: gradient.css }} />
        <span className="relative flex h-full w-full items-center justify-center rounded-full border border-white/[0.08]" style={{ background: gradient.css }}>
          {getInitials(lead.name)}
        </span>
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-white">{lead.name}</span>
          {(lead.ai_score ?? 0) >= 70 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-400/20 bg-white/[0.035] px-1.5 py-0.5 text-[9px] font-semibold text-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
              PR
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
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px] tabular-nums',
              tz.isUnsafe
                ? 'border-cyan-400/20 bg-white/[0.035] text-cyan-200'
                : 'border-white/[0.06] bg-white/[0.035] text-white/50',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', tz.isUnsafe ? 'bg-cyan-300' : 'bg-white/25')} />
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
