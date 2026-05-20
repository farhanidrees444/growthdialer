'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Phone, SkipForward, Star, Ban, FileText, Globe } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/lib/dialer/avatar-color';
import { getLocalTime } from '@/lib/utils/timezone';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface PreviewStageProps {
  lead: LeadRecord;
  onCall: () => void;
  onSkip: () => void;
  onMarkHot: () => void;
  onDnc: () => void;
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

export function PreviewStage({ lead, onCall, onSkip, onMarkHot, onDnc, disabled }: PreviewStageProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const gradient = getAvatarGradient(lead.id);
  const tz = getLocalTime(lead.phone);
  const isHot = (lead.ai_score ?? 0) >= 70;

  const handleNoteToggle = useCallback(() => setNoteOpen((p) => !p), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="flex flex-col gap-4 h-full overflow-y-auto p-6 scrollbar-hide"
    >
      {/* Hero card */}
      <div
        className="rounded-2xl p-6 border border-white/[0.07]"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white flex-shrink-0"
            style={{ background: gradient.css }}
          >
            {getInitials(lead.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-light text-white">{lead.name}</h1>
              {isHot && (
                <span className="text-xs bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 rounded-full px-2 py-0.5">HOT</span>
              )}
            </div>
            {(lead.title || lead.company) && (
              <p className="text-sm text-white/50 mt-0.5">
                {[lead.title, lead.company].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Phone */}
            <div className="flex items-center gap-2 mt-3">
              <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
              <button
                onClick={onCall}
                disabled={disabled}
                className="text-sm text-white/80 hover:text-white font-mono tabular-nums hover:underline transition-colors"
                aria-label={`Call ${formatPhone(lead.phone)}`}
              >
                {formatPhone(lead.phone)}
              </button>
            </div>

            {/* TZ */}
            {tz.hasData && (
              <div className="flex items-center gap-2 mt-1.5">
                <Globe className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span
                  className={`text-sm ${tz.isUnsafe ? 'text-red-400' : 'text-white/60'}`}
                >
                  {tz.stateAbbr} · {tz.time}
                  {tz.isUnsafe && ' · ⚠️ Outside TCPA hours'}
                  {!tz.isUnsafe && !tz.isCaution && ' · Safe to call'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status row */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-4 text-xs text-white/40">
          <span>Last: {timeAgo(lead.last_called_at ?? undefined)}</span>
          <span>{lead.call_attempts ?? 0} attempt{(lead.call_attempts ?? 0) !== 1 ? 's' : ''}</span>
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {lead.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-white/[0.05] rounded text-white/50">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call button */}
      <motion.button
        onClick={onCall}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.01, boxShadow: '0 8px 30px rgba(22,163,74,0.35)' } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
        className="w-full h-16 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
        aria-label={`Call ${lead.name}`}
      >
        <Phone className="w-5 h-5" />
        Call {lead.name.split(' ')[0]}
        <kbd className="ml-1 text-green-200/60 text-xs font-mono font-normal">Space</kbd>
      </motion.button>

      {/* Secondary actions */}
      <div className="grid grid-cols-3 gap-3">
        <SecondaryButton icon={<SkipForward className="w-4 h-4" />} label="Skip" hotkey="S" onClick={onSkip} />
        <SecondaryButton
          icon={<Star className={`w-4 h-4 ${isHot ? 'fill-yellow-400 text-yellow-400' : ''}`} />}
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
      className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        active
          ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
          : danger
          ? 'bg-white/[0.03] border-red-500/20 text-red-400/70 hover:border-red-500/40 hover:text-red-400'
          : 'bg-white/[0.04] border-white/[0.07] text-white/60 hover:bg-white/[0.07] hover:text-white/80'
      }`}
    >
      {icon}
      {label}
      {hotkey && <kbd className="text-[10px] opacity-40 font-mono">{hotkey}</kbd>}
    </motion.button>
  );
}
