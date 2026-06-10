'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Phone, Trash2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadDetailHeroProps {
  name: string;
  title: string | null;
  company: string | null;
  status: string;
  initials: string;
  avatarGradient: string;
  statusBg: string;
  statusText: string;
  leadId: string;
  onBack: () => void;
  onCall: () => void;
  onDelete: () => void;
}

export function LeadDetailHero({
  name,
  title,
  company,
  status,
  initials,
  avatarGradient,
  statusBg,
  statusText,
  leadId,
  onBack,
  onCall,
  onDelete,
}: LeadDetailHeroProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative shrink-0 overflow-hidden border-b border-white/[0.06]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(52,211,153,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(34,211,238,0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative px-4 py-4 lg:px-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Leads
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <motion.div
              layoutId={`lead-avatar-${leadId}`}
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg shadow-emerald-500/10 sm:h-16 sm:w-16 sm:text-xl',
                avatarGradient,
              )}
            >
              {initials}
            </motion.div>
            <div className="min-w-0">
              <motion.h1
                layoutId={`lead-name-${leadId}`}
                className="truncate bg-gradient-to-r from-white via-zinc-100 to-emerald-200/80 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl"
              >
                {name}
              </motion.h1>
              {(title || company) && (
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {[title, company].filter(Boolean).join(' · ')}
                </p>
              )}
              {company && !title && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                  <Building2 className="h-3 w-3" />
                  {company}
                </p>
              )}
              <span
                className={cn(
                  'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize',
                  statusBg,
                  statusText,
                )}
              >
                {status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              type="button"
              onClick={onCall}
              whileHover={reduce ? undefined : { scale: 1.02, y: -1 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-shadow hover:shadow-emerald-500/35"
            >
              <Phone className="h-4 w-4" />
              Call now
            </motion.button>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-600 transition hover:border-red-500/30 hover:text-red-400"
              aria-label="Delete lead"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
