'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Clock, Phone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteTheme } from '@/components/theme/site-theme';

interface RecordingDetailHeroProps {
  leadName: string;
  company: string | null;
  phone: string | null;
  duration: string;
  date: string;
  disposition: string | null;
  hasAi: boolean;
  onBack: () => void;
}

const DISP_COLORS: Record<string, string> = {
  interested: 'bg-emerald-500/15 text-emerald-400',
  callback: 'bg-amber-500/15 text-amber-400',
  meeting_booked: 'bg-violet-500/15 text-violet-400',
  not_interested: 'bg-slate-500/15 text-slate-400',
  voicemail: 'bg-blue-500/15 text-blue-400',
  no_answer: 'bg-slate-500/10 text-slate-600',
  wrong_number: 'bg-red-500/15 text-red-400',
  dnc: 'bg-red-600/15 text-red-500',
};

const DISP_COLORS_LIGHT: Record<string, string> = {
  interested: 'bg-emerald-500/10 text-emerald-700',
  callback: 'bg-amber-500/10 text-amber-700',
  meeting_booked: 'bg-violet-500/10 text-violet-700',
  not_interested: 'bg-zinc-500/10 text-zinc-600',
  voicemail: 'bg-blue-500/10 text-blue-700',
  no_answer: 'bg-zinc-500/[0.08] text-zinc-500',
  wrong_number: 'bg-red-500/10 text-red-700',
  dnc: 'bg-red-600/10 text-red-700',
};

export function RecordingDetailHero({
  leadName,
  company,
  phone,
  duration,
  date,
  disposition,
  hasAi,
  onBack,
}: RecordingDetailHeroProps) {
  const reduce = useReducedMotion();
  const { isDark } = useSiteTheme();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        isDark
          ? 'border-white/[0.07] bg-zinc-900/40'
          : 'border-zinc-950/[0.08] bg-[linear-gradient(135deg,#ffffff_0%,#fbfbff_60%,#f2fdf7_100%)] shadow-[0_16px_50px_rgba(16,185,129,0.10),0_2px_6px_rgba(9,9,11,0.05)]',
      )}
    >
      <div
        className={cn(
        'pointer-events-none absolute inset-0',
        isDark
          ? 'bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(52,211,153,0.12),transparent_55%)]'
          : 'bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(16,185,129,0.08),transparent_55%)]',
      )}
        aria-hidden
      />
      <div
        className={cn(
        'pointer-events-none absolute inset-0',
        isDark
          ? 'bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(16,185,129,0.06),transparent_50%)]'
          : 'bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(6,182,212,0.06),transparent_50%)]',
      )}
        aria-hidden
      />

      <div className="relative p-4 sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition',
            isDark ? 'hover:text-emerald-300' : 'hover:text-emerald-700',
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Recordings
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1
              className={cn(
                'truncate bg-clip-text text-xl font-semibold text-transparent sm:text-2xl',
                isDark
                  ? 'bg-gradient-to-r from-white via-zinc-100 to-emerald-200/80'
                  : 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-emerald-600',
              )}
            >
              {leadName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              {company && <span>{company}</span>}
              {phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
              <span>{date}</span>
            </div>
            {disposition && (
              <span
                className={cn(
                  'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize',
                  isDark
                    ? (DISP_COLORS[disposition] ?? 'bg-white/[0.05] text-slate-500')
                    : (DISP_COLORS_LIGHT[disposition] ?? 'bg-zinc-950/[0.04] text-zinc-500'),
                )}
              >
                {disposition.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {hasAi && (
            <span className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold',
              isDark
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)]'
                : 'border-emerald-600/25 bg-emerald-500/[0.08] text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.12)]',
            )}>
              <Sparkles className="h-3 w-3" />
              AI analyzed
            </span>
          )}
        </div>

        {!reduce && (
          <motion.div
            aria-hidden
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 h-px max-w-[120px] bg-gradient-to-r from-emerald-500/50 via-teal-500/25 to-transparent"
            style={{ transformOrigin: 'left' }}
          />
        )}
      </div>
    </div>
  );
}
