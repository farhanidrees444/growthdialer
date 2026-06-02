'use client';

import { useMemo } from 'react';
import { getLocalTime } from '@/lib/utils/timezone';
import { cn } from '@/lib/utils';

interface TimezonePillProps {
  phone: string;
  size?: 'sm' | ', 'md';
  className?: string;
}

export default function TimezonePill({ phone, size = 'sm', className }: TimezonePillProps) {
  const info = useMemo(() => getLocalTime(phone), [phone]);

  if (!info.hasData) return null;

  const color = info.isUnsafe
    ? 'text-red-400 border-red-500/30 bg-red-500/10'
    : info.isCaution
    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-slate-500 border-white/[0.06] bg-white/[0.02]';

  const label = `${info.stateAbbr} ${info.time}`;
  const title = `${info.timezone}${info.isUnsafe ? ' — Outside TCPA safe hours (8am–9pm)' : info.isCaution ? ' — Near TCPA boundary' : ' — Safe to call'}`;

  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 font-mono tabular-nums leading-none',
        size === 'sm' ? ', 'py-0.5 text-[9px]' : ', 'py-1 text-[11px]',
        color,
        info.isUnsafe && 'animate-pulse',
        className,
      )}
    >
      {info.isUnsafe && <span className="h-1 w-1 rounded-full bg-red-400" />}
      {info.isCaution && !info.isUnsafe && <span className="h-1 w-1 rounded-full bg-amber-400" />}
      {label}
    </span>
  );
}
