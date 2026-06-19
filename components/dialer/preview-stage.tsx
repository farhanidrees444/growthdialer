'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Phone, SkipForward, Star, Ban, FileText, Globe, X, Clock3, Repeat2, AlertTriangle } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/lib/dialer/avatar-color';
import { getLocalTime } from '@/lib/utils/timezone';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface PreviewStageProps {
  lead: LeadRecord;
  onCall: () => void;
  onSkip: () => void;
  onMarkHot: () => void;
  onDnc: () => void;
  onClose?: () => void;
  disabled?: boolean;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function timeAgo(iso: string | undefined): string {
  if (!iso) return 'Never called';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Called today';
  if (days === 1) return '1 day ago';
  return `${days}d ago`;
}

export function PreviewStage({ lead, onCall, onSkip, onMarkHot, onDnc, onClose, disabled }: PreviewStageProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const gradient = getAvatarGradient(lead.id);
  const tz = getLocalTime(lead.phone);
  const isHot = (lead.ai_score ?? 0) >= 70;
  const glow = isHot
    ? 'rgba(139,92,246,0.34)'
    : tz.isUnsafe
      ? 'rgba(6,182,212,0.2)'
      : 'rgba(139,92,246,0.22)';

  const handleNoteToggle = useCallback(() => setNoteOpen((p) => !p), []);

  return (
    <motion.div
      key={lead.id}
      initial={{ opacity: 0, x: 26, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -18, filter: 'blur(8px)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="flex flex-col gap-4 h-full overflow-y-auto p-6 scrollbar-hide"
    >
      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-[1.65rem] p-6 border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-[0_24px_90px_rgba(0,0,0,0.36)]"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(6,182,212,0.12),transparent_30%)]" />
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full blur-3xl" style={{ background: glow }} />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            aria-label="Close lead preview"
          >
            <X size={16} />
          </button>
        )}
        <div className="relative flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(6,182,212,0.75))', boxShadow: `0 0 42px ${glow}` }}>
            <div className="absolute inset-0 rounded-full opacity-50 blur-md" style={{ background: gradient.css }} />
            <div
              className="relative flex h-full w-full items-center justify-center rounded-full border border-white/[0.10] text-2xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
              style={{ background: gradient.css }}
            >
              {getInitials(lead.name)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-light leading-none tracking-[-0.055em] text-white">{lead.name}</h1>
              {isHot && (
                <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">Hot</span>
              )}
            </div>
            {(lead.title || lead.company) && (
              <p className="mt-1 text-sm text-white/45 tracking-tight">
                {[lead.title, lead.company].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Phone */}
            <div className="flex items-center gap-2 mt-4">
              <Phone className="w-4 h-4 text-cyan-300/55 flex-shrink-0" />
              <button
                onClick={onCall}
                disabled={disabled}
                className="text-sm text-white/75 hover:text-white font-mono tabular-nums transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded"
                aria-label={`Call ${formatPhone(lead.phone)}`}
              >
                {formatPhone(lead.phone)}
              </button>
            </div>

            {/* TZ */}
            {tz.hasData && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Globe className="w-4 h-4 text-white/25 flex-shrink-0" />
                <span
                  className="text-sm text-white/50"
                >
                  {tz.stateAbbr} · {tz.time}
                  {!tz.isUnsafe && !tz.isCaution && ' · Safe to call'}
                </span>
                {tz.isUnsafe && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
                    <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                      <AlertTriangle className="h-3 w-3" />
                    </motion.span>
                    Outside TCPA hours
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status row */}
        <div className="relative mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 text-xs text-white/40 sm:flex sm:flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-white/25" />
            <span className="uppercase tracking-[0.14em] text-[9px] text-white/25">Last</span>
            <span>{timeAgo(lead.last_called_at ?? undefined)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5">
            <Repeat2 className="h-3.5 w-3.5 text-white/25" />
            <span className="uppercase tracking-[0.14em] text-[9px] text-white/25">Attempts</span>
            <span>{lead.call_attempts ?? 0}</span>
          </span>
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {lead.tags.map((t) => (
                <span key={t} className="px-2 py-1 bg-white/[0.04] rounded-full border border-white/[0.06] text-white/45">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call button */}
      <motion.button
        onClick={onCall}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.006, boxShadow: '0 0 42px rgba(139,92,246,0.34), 0 0 36px rgba(6,182,212,0.18)' } : {}}
        whileTap={!disabled ? { scale: 0.975 } : {}}
        className="group relative w-full h-16 overflow-hidden rounded-2xl border border-white/[0.10] font-semibold text-base text-white flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 transition-all duration-200"
        style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
        aria-label={`Call ${lead.name}`}
      >
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/20 blur-sm transition-all duration-700 group-hover:left-full" />
        <motion.span
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
          animate={disabled ? undefined : { boxShadow: ['0 0 0 0 rgba(255,255,255,0.12)', '0 0 0 8px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0)'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        >
          <Phone className="w-4 h-4" />
        </motion.span>
        <span className="relative">Call {lead.name.split(' ')[0]}</span>
        <kbd className="relative ml-1 text-white/55 text-xs font-mono font-normal">Space</kbd>
      </motion.button>

      {/* Secondary actions */}
      <div className="grid grid-cols-3 gap-3">
        <SecondaryButton icon={<SkipForward className="w-4 h-4" />} label="Skip" hotkey="S" onClick={onSkip} />
        <SecondaryButton
          icon={<Star className={`w-4 h-4 ${isHot ? 'fill-violet-300 text-violet-200' : ''}`} />}
          label={isHot ? 'Hot ✓' : 'Mark Hot'}
          hotkey="H"
          onClick={onMarkHot}
          active={isHot}
        />
        <SecondaryButton icon={<Ban className="w-4 h-4" />} label="DNC" hotkey="" onClick={onDnc} danger />
      </div>

      {/* Quick note */}
      <div>
        <button
          onClick={handleNoteToggle}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <FileText className="w-4 h-4" />
          {noteOpen ? 'Hide note' : 'Quick note'}
        </button>
        <motion.div
          initial={false}
          animate={{ height: noteOpen ? 'auto' : 0, opacity: noteOpen ? 1 : 0 }}
          className="overflow-hidden"
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Draft note before the call..."
            rows={3}
            className="mt-2 w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function SecondaryButton({
  icon, label, hotkey, onClick, active, danger,
}: {
  icon: React.ReactNode;
  label: string;
  hotkey: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
        active
          ? 'bg-violet-500/10 border-violet-400/30 text-violet-200'
          : danger
          ? 'bg-white/[0.03] border-white/[0.07] text-white/45 hover:border-cyan-400/30 hover:text-cyan-200'
          : 'bg-white/[0.04] border-white/[0.07] text-white/60 hover:bg-white/[0.07] hover:text-white/80'
      }`}
    >
      {icon}
      {label}
      {hotkey && <kbd className="text-[10px] opacity-40 font-mono">{hotkey}</kbd>}
    </motion.button>
  );
}
