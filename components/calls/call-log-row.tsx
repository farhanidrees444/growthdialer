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
  getInboundCallerNumber,
  isMissedCall,
  isConnected,
  isVoicemailCall,
} from '@/lib/calls/display';
import { cn } from '@/lib/utils';
import { useSiteTheme } from '@/components/theme/site-theme';

interface CallLogRowCardProps {
  call: CallLogRow;
  index?: number;
}

const LIGHT_DISP_COLORS: Record<string, string> = {
  interested: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  callback: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
  meeting_booked: 'bg-violet-500/10 text-violet-700 border-violet-500/25',
  voicemail: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
  not_interested: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  wrong_number: 'bg-red-500/10 text-red-700 border-red-500/25',
  gatekeeper: 'bg-purple-500/10 text-purple-700 border-purple-500/25',
  dnc: 'bg-red-600/10 text-red-700 border-red-600/25',
  missed: 'bg-red-500/10 text-red-700 border-red-500/20',
  no_answer: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
};

const LIGHT_STATUS_PILL: Record<string, string> = {
  Voicemail: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
  Missed: 'bg-red-500/10 text-red-700 border-red-500/25',
  Connected: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  'No answer': 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
};

const LIGHT_ICON_COLOR: Record<string, string> = {
  'text-red-400': 'text-red-600',
  'text-blue-400': 'text-blue-600',
  'text-sky-400': 'text-sky-600',
  'text-cyan-400': 'text-cyan-600',
};

export function CallLogRowCard({ call, index = 0 }: CallLogRowCardProps) {
  const { isDark } = useSiteTheme();
  const missed = isMissedCall(call);
  const connected = isConnected(call);
  const voicemail = isVoicemailCall(call);
  const inbound = call.direction === 'inbound';
  const disp = dispositionLabel(call.disposition);
  const statusPill = getCallStatusPill(call);
  const detailHref = getCallDetailHref(call);
  const counterparty = getCounterparty(call);
  const inboundCaller = getInboundCallerNumber(call);
  const rawNumber = inbound ? call.from_number : call.to_number;
  const yourLine = inbound ? call.to_number : call.from_number;

  const DirectionIcon = missed
    ? PhoneMissed
    : inbound
      ? PhoneIncoming
      : PhoneOutgoing;

  const iconWrap = missed
    ? 'bg-red-500/10 border-red-500/20'
    : voicemail
      ? 'bg-blue-500/10 border-blue-500/20'
      : inbound
        ? 'bg-sky-500/10 border-sky-500/20'
        : 'bg-cyan-500/10 border-cyan-500/20';

  const iconColor = missed
    ? 'text-red-400'
    : voicemail
      ? 'text-blue-400'
      : inbound
        ? 'text-sky-400'
        : 'text-cyan-400';

  const cardInner = (
    <>
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
          iconWrap,
        )}
      >
        <DirectionIcon className={cn('h-4 w-4', isDark ? iconColor : (LIGHT_ICON_COLOR[iconColor] ?? iconColor))} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{counterparty}</p>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
              isDark ? statusPill.className : (LIGHT_STATUS_PILL[statusPill.label] ?? statusPill.className),
            )}
          >
            {statusPill.label}
          </span>
          {disp && call.disposition && (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize',
                isDark
                  ? (DISP_COLORS[call.disposition] ?? 'bg-white/[0.05] text-slate-400 border-white/[0.08]')
                  : (LIGHT_DISP_COLORS[call.disposition] ??
                    'bg-zinc-950/[0.04] text-zinc-500 border-zinc-950/[0.08]'),
              )}
            >
              {disp}
            </span>
          )}
          {(call.was_recorded || call.recording_url) && (
            <span className={cn(
              'flex items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold',
              isDark ? 'text-emerald-400' : 'text-emerald-600',
            )}>
              <Mic className="h-2.5 w-2.5" />
              Rec
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          <span>{fmtCallTime(call.started_at ?? call.created_at)}</span>
          <span className="font-medium tabular-nums text-slate-400">
            {fmtCallDuration(call.duration_seconds)}
          </span>
          {inbound && inboundCaller && (
            <span className="tabular-nums text-slate-400">{inboundCaller}</span>
          )}
          {inbound && yourLine && (
            <span className="tabular-nums text-slate-600">→ {fmtPhone(yourLine)}</span>
          )}
          {!inbound && rawNumber && counterparty !== fmtPhone(rawNumber) && (
            <span className="tabular-nums">{fmtPhone(rawNumber)}</span>
          )}
          {call.leads?.company && (
            <span className="flex max-w-[140px] items-center gap-1 truncate sm:max-w-none">
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-300 transition hover:border-emerald-500/40 hover:from-emerald-500/20 hover:shadow-[0_0_12px_rgba(52,211,153,0.12)]"
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
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border transition',
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-white'
                : 'border-zinc-950/10 bg-white text-zinc-500 shadow-sm hover:border-zinc-950/20 hover:text-zinc-900',
            )}
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
    'group relative flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] sm:p-4',
    isDark
      ? 'border-white/[0.07] bg-[oklch(0.09_0.006_285)]'
      : 'border-zinc-950/[0.07] bg-white shadow-[0_1px_2px_rgba(9,9,11,0.05)]',
    missed && 'hover:border-red-500/25 hover:shadow-[0_8px_24px_rgba(239,68,68,0.08)]',
    connected && !missed && 'hover:border-emerald-500/20 hover:shadow-[0_8px_24px_rgba(52,211,153,0.08)]',
    !missed && !connected && inbound && 'hover:border-sky-500/20 hover:shadow-[0_8px_24px_rgba(56,189,248,0.08)]',
    !missed && !connected && !inbound && 'hover:border-cyan-500/20 hover:shadow-[0_8px_24px_rgba(34,211,238,0.08)]',
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.35), duration: 0.2 }}
    >
      {detailHref ? (
        <Link href={detailHref} className={cardClass}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          {cardInner}
        </Link>
      ) : (
        <div className={cardClass}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          {cardInner}
        </div>
      )}
    </motion.div>
  );
}
