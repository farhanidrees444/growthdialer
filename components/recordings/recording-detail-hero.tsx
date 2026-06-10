'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Clock, Phone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/40">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(52,211,153,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(16,185,129,0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative p-4 sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Recordings
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate bg-gradient-to-r from-white via-zinc-100 to-emerald-200/80 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
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
                  DISP_COLORS[disposition] ?? 'bg-white/[0.05] text-slate-500',
                )}
              >
                {disposition.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {hasAi && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
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
