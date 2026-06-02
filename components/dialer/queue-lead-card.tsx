'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/lib/dialer/avatar-color';
import { getLocalTime } from '@/lib/utils/timezone';
import type { LeadRecord } from '@/lib/dialer/state-machine';

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
}

export function QueueLeadCard({ lead, selected, lastDisposition, onClick }: QueueLeadCardProps) {
  const gradient = getAvatarGradient(lead.id);
  const tz = getLocalTime(lead.phone);

  return (
    <motion.button
      layout
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        selected
          ? 'bg-white/[0.06]'
          : 'hover:bg-white/[0.03]'
      }`}
      style={selected ? { boxShadow: 'inset 2px 0 0 0 transparent' } : {}}
      aria-selected={selected}
      aria-label={`Select ${lead.name}`}
    >
      {/* Left accent border when selected */}
      {selected && (
        <div
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: 'linear-gradient(to bottom, hsl(262,80%,50%), hsl(186,100%,42%))' }}
        />
      )}

      {/* Avatar */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
        style={{ background: gradient.css }}
      >
        {getInitials(lead.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">{lead.name}</span>
          {lead.ai_score && lead.ai_score >= 70 && (
            <span className="flex-shrink-0 text-[9px] bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 rounded px-1 py-px">HOT</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-white/50 truncate">
          {lead.company && <span>{lead.company}</span>}
          {lead.company && lead.title && <span>·</span>}
          {lead.title && <span className="truncate">{lead.title}</span>}
        </div>
      </div>

      {/* Right: TZ pill + chevron */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {tz.hasData && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
              tz.isUnsafe
                ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                : 'bg-white/[0.06] text-white/50'
            }`}
          >
            {tz.stateAbbr} {tz.time}
          </span>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>

      {/* Last disposition dot */}
      {lastDisposition && (
        <div
          className={`absolute bottom-2.5 right-2 w-1.5 h-1.5 rounded-full ${LAST_DISPOSITION_COLOR[lastDisposition] ?? 'bg-zinc-500'}`}
        />
      )}
    </motion.button>
  );
}
