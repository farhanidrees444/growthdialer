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
} from 'lucide-react';
import type { CallLogRow } from '@/lib/calls/display';
import {
  dispositionLabel,
  fmtCallDuration,
  fmtCallTime,
  getCounterparty,
  isMissedCall,
  isConnected,
} from '@/lib/calls/display';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Badge } from '@/components/ui/badge';
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

  const DirectionIcon = missed
    ? PhoneMissed
    : inbound
      ? PhoneIncoming
      : PhoneOutgoing;

  const iconColor = missed
    ? 'text-red-400'
    : inbound
      ? 'text-cyan-400'
      : 'text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <SurfaceCard
        className={cn(
          'flex items-center gap-3 p-3 sm:p-4',
          missed && 'border-red-500/20',
          connected && !missed && 'border-emerald-500/15',
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]',
            missed && 'bg-red-500/10',
            inbound && !missed && 'bg-cyan-500/10',
          )}
        >
          <DirectionIcon className={cn('h-4 w-4', iconColor)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">
              {getCounterparty(call)}
            </p>
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] uppercase tracking-wider border-white/10',
                inbound ? 'text-cyan-300' : 'text-primary',
              )}
            >
              {inbound ? 'Inbound' : 'Outbound'}
            </Badge>
            {disp && (
              <Badge variant="secondary" className="text-[9px] capitalize">
                {disp}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{fmtCallTime(call.started_at ?? call.created_at)}</span>
            <span className="tabular-nums">{fmtCallDuration(call.duration_seconds)}</span>
            {call.leads?.company && (
              <span className="flex items-center gap-1 truncate">
                <Building2 className="h-3 w-3 shrink-0" />
                {call.leads.company}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {call.recording_url && (
            <Link
              href={`/recordings?call=${call.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-white hover:border-primary/30 transition"
              title="Play recording"
            >
              <Play className="h-3.5 w-3.5" />
            </Link>
          )}
          {call.lead_id && (
            <Link
              href={`/leads/${call.lead_id}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-white hover:border-primary/30 transition"
              title="View lead"
            >
              <User className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </SurfaceCard>
    </motion.div>
  );
}
