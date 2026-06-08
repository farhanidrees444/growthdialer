'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  User,
  Building2,
  ChevronRight,
  Mic,
} from 'lucide-react';
import type { CallLogRow } from '@/lib/calls/display';
import {
  dispositionLabel,
  DISP_COLORS,
  fmtCallDuration,
  fmtCallTime,
  fmtPhone,
  getCounterparty,
  getCallDetailHref,
  getCallStatusPill,
  isMissedCall,
  isConnected,
} from '@/lib/calls/display';
import { cn } from '@/lib/utils';

interface CallLogRowCardProps {
  call: CallLogRow;
  index?: number;
}

export function CallLogRowCard({ call, index = 0 }: CallLogRowCardProps) {
  const missed = isMissedCall(call);
  const connected = isConnected(call);
  const inbound = call.direction === 'inbound';
  const disp = dispositionLabel(call.disposition);
  const statusPill = getCallStatusPill(call);
  const detailHref = getCallDetailHref(call);
  const counterparty = getCounterparty(call);
  const rawNumber = inbound ? call.from_number : call.to_number;

  const DirectionIcon = missed
    ? PhoneMissed
    : inbound
      ? PhoneIncoming
      : PhoneOutgoing;

  const iconWrap = missed
    ? 'bg-red-500/10 border-red-500/20'
    : inbound
      ? 'bg-cyan-500/10 border-cyan-500/20'
      : 'bg-violet-500/10 border-violet-500/20';

  const iconColor = missed
    ? 'text-red-400'
    : inbound
      ? 'text-cyan-400'
      : 'text-violet-400';

  const cardInner = (
    <>
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
          iconWrap,
        )}
      >
        <DirectionIcon className={cn('h-4 w-4', iconColor)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">{counterparty}</p>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
              statusPill.className,
            )}
          >
            {statusPill.label}
          </span>
          {disp && call.disposition && (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize',
                DISP_COLORS[call.disposition] ?? 'bg-white/[0.05] text-slate-400 border-white/[0.08]',
              )}
            >
              {disp}
            </span>
          )}
          {(call.was_recorded || call.recording_url) && (
            <span className="flex items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
              <Mic className="h-2.5 w-2.5" />
              Rec
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          <span>{fmtCallTime(call.started_at ?? call.created_at)}</span>
          <span className="tabular-nums font-medium text-slate-400">
            {fmtCallDuration(call.duration_seconds)}
          </span>
          {rawNumber && counterparty !== fmtPhone(rawNumber) && (
            <span className="tabular-nums">{fmtPhone(rawNumber)}</span>
          )}
          {call.leads?.company && (
            <span className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-none">
              <Building2 className="h-3 w-3 shrink-0" />
              {call.leads.company}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {call.recording_url && (
          <Link
            href={`/recordings/${call.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 text-violet-300 transition hover:border-violet-500/40 hover:from-violet-500/20"
            title="Play recording"
            aria-label="Play recording"
          >
            <Play className="h-3.5 w-3.5 translate-x-0.5" />
          </Link>
        )}
        {call.lead_id && (
          <Link
            href={`/leads/${call.lead_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/20 hover:text-white"
            title="View lead"
            aria-label="View lead"
          >
            <User className="h-3.5 w-3.5" />
          </Link>
        )}
        {detailHref && (
          <ChevronRight className="hidden h-4 w-4 text-slate-600 sm:block" />
        )}
      </div>
    </>
  );

  const cardClass = cn(
    'group flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200',
    'border-white/[0.07] bg-[oklch(0.09_0.006_285)]',
    'hover:border-white/[0.14] hover:bg-white/[0.02]',
    missed && 'hover:border-red-500/25',
    connected && !missed && 'hover:border-emerald-500/20',
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.35), duration: 0.2 }}
    >
      {detailHref ? (
        <Link href={detailHref} className={cardClass}>
          {cardInner}
        </Link>
      ) : (
        <div className={cardClass}>{cardInner}</div>
      )}
    </motion.div>
  );
}
