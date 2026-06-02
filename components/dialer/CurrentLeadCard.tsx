'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mail,
  Mic,
  MicOff,
  Pause,
  Disc,
  SkipForward,
  Star,
  Ban,
  Copy,
  Check,
  ChevronDown,
  Voicemail,
  FileText,
} from 'lucide-react';
import type { LeadRecord } from '@/components/dialer/LeadCard';

interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'disconnected';
  direction: 'inbound' | 'outbound' | null;
  callSid: string | null;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  leadId: string | null;
  leadName: string | null;
}

interface CurrentLeadCardProps {
  selectedLead: LeadRecord | null;
  callState: CallState;
  notes: string;
  onDial: () => void;
  onMute: () => void;
  onHold: () => void;
  onRecord: () => void;
  onEndCall: () => void;
  onSkip: () => void;
  onMarkHot: () => void;
  onMarkDNC: () => void;
  onSaveNotes: (value: string) => void;
  isReady: boolean;
  isRecording: boolean;
  error?: string | null;
  onVmDrop?: () => void;
  vmDropping?: boolean;
  hasVoicemails?: boolean;
  onToggleCallNotes?: () => void;
  showCallNotes?: boolean;
}

function scoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-teal-400';
  if (score >= 50) return 'from-amber-500 to-orange-400';
  return 'from-slate-500 to-slate-600';
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never called';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function statusLabel(status: LeadRecord['status']): string {
  const map: Record<string, string> = {
    new: 'New',
    queued: 'Queued',
    contacted: 'Attempted',
    connected: 'Connected',
    meeting_booked: 'Meeting Booked',
    not_interested: 'Not Interested',
    wrong_number: 'Wrong #',
    do_not_call: 'DNC',
    callback: 'Callback',
    no_answer: 'No Answer',
  };
  return map[status] ?? status;
}

function statusColor(status: LeadRecord['status']): string {
  if (status === 'meeting_booked') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300';
  if (status === 'callback') return 'border-amber-400/40 bg-amber-500/10 text-amber-300';
  if (status === 'not_interested' || status === 'do_not_call') return 'border-red-400/40 bg-red-500/10 text-red-300';
  if (status === 'connected') return 'border-blue-400/40 bg-blue-500/10 text-blue-300';
  if (status === 'contacted') return 'border-slate-400/40 bg-slate-500/10 text-slate-400';
  return 'border-white/10 bg-white/[0.03] text-slate-400';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-500 transition hover:text-slate-300"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function CurrentLeadCard({
  selectedLead,
  callState,
  notes,
  onDial,
  onMute,
  onHold,
  onRecord,
  onEndCall,
  onSkip,
  onMarkHot,
  onMarkDNC,
  onSaveNotes,
  isReady,
  isRecording,
  error,
  onVmDrop,
  vmDropping = false,
  hasVoicemails = false,
  onToggleCallNotes,
  showCallNotes = false,
}: CurrentLeadCardProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [notesExpanded, setNotesExpanded] = useState(false);

  useEffect(() => { setLocalNotes(notes); }, [notes]);

  const isIdle = callState.status === 'idle';
  const isActive = ['connecting', 'ringing', 'connected'].includes(callState.status);
  const isRinging = callState.status === 'connecting' || callState.status === 'ringing';
  const isConnected = callState.status === 'connected';
  const isDisconnected = callState.status === 'disconnected';
  const isHot = (selectedLead?.tags ?? []).includes('hot');

  if (!selectedLead) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        >
          <Phone className="h-10 w-10 text-slate-600" />
        </motion.div>
        <p className="text-base font-semibold text-slate-400">Pick a lead to start</p>
        <p className="mt-1 text-sm text-slate-600">← Select from the queue</p>
      </div>
    );
  }

  const grad = scoreGradient(selectedLead.ai_score);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedLead.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4"
      >
        {/* ── Main lead card ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border bg-[oklch(0.10_0.006_285)] p-6 shadow-xl"
          style={{
            borderColor: isConnected ? 'oklch(0.55 0.18 153 / 40%)' : 'oklch(1 0 0 / 6%)',
            boxShadow: isConnected ? '0 0 40px oklch(0.55 0.18 153 / 12%)' : undefined,
          }}
        >
          {/* Subtle gradient background */}
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${grad} opacity-[0.03]`}
          />

          <div className="relative">
            {/* Avatar + name row */}
            <div className="flex items-start gap-5">
              <div
                className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-2xl font-bold text-white shadow-lg`}
              >
                {getInitials(selectedLead.name)}
                {isConnected && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[oklch(0.10_0.006_285)]" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-bold leading-tight text-white">{selectedLead.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {[selectedLead.title, selectedLead.company].filter(Boolean).join(' at ')}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 rounded-xl bg-gradient-to-br ${grad} px-3 py-2 text-center shadow-sm`}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">AI</p>
                    <p className="text-xl font-bold text-white leading-none">{selectedLead.ai_score}</p>
                  </div>
                </div>

                {/* Status + last call */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(selectedLead.status)}`}
                  >
                    {statusLabel(selectedLead.status)}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {timeAgo(selectedLead.last_called_at)}
                    {(selectedLead.call_attempts ?? 0) > 0
                      ? ` · ${selectedLead.call_attempts} attempt${selectedLead.call_attempts !== 1 ? 's' : ''}`
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="font-mono text-sm font-semibold text-emerald-300">
                  {formatPhone(selectedLead.phone)}
                </span>
                <CopyButton text={selectedLead.phone} />
              </div>
              {selectedLead.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="truncate text-sm text-slate-300">{selectedLead.email}</span>
                  <CopyButton text={selectedLead.email} />
                </div>
              )}
            </div>

            {/* Tags */}
            {(selectedLead.tags ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(selectedLead.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                      tag === 'hot'
                        ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                        : 'border-white/[0.06] bg-white/[0.03] text-slate-400'
                    }`}
                  >
                    {tag === 'hot' ? '⭐ Hot' : tag}
                  </span>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setNotesExpanded((v) => !v)}
                className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
              >
                Notes
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${notesExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {notesExpanded ? (
                  <motion.textarea
                    key="expanded"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={() => { if (localNotes !== notes) onSaveNotes(localNotes); }}
                    rows={3}
                    placeholder="Add notes about this lead…"
                    className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30"
                  />
                ) : (
                  <motion.p
                    key="collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setNotesExpanded(true)}
                    className="cursor-pointer truncate rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-sm text-slate-500 hover:text-slate-300 transition"
                  >
                    {localNotes || 'Click to add notes…'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Call state UI ──────────────────────────────────────────────── */}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3">
            <p className="text-sm font-semibold text-rose-300">Call failed</p>
            <p className="mt-0.5 text-xs text-rose-300/70">{error}</p>
          </div>
        )}

        {/* IDLE — big call button */}
        {isIdle && (
          <div className="space-y-2">
            <motion.button
              type="button"
              onClick={onDial}
              disabled={!isReady}
              whileHover={{ scale: isReady ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full overflow-hidden rounded-2xl py-5 text-base font-bold text-black shadow-xl shadow-emerald-500/25 transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}
            >
              {/* Shimmer */}
              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
              />
              <span className="relative flex items-center justify-center gap-2.5">
                <Phone className="h-5 w-5" />
                Call {selectedLead.name.split(' ')[0]}
              </span>
            </motion.button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-200"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>
              <button
                type="button"
                onClick={onMarkHot}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                  isHot
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-amber-500/20 hover:text-amber-300'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isHot ? 'fill-amber-400' : ''}`} />
                {isHot ? 'Hot!' : 'Mark Hot'}
              </button>
              <button
                type="button"
                onClick={onMarkDNC}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/[0.03] py-2.5 text-xs font-semibold text-red-400 transition hover:border-red-500/30 hover:bg-red-500/[0.08]"
              >
                <Ban className="h-3.5 w-3.5" />
                DNC
              </button>
            </div>
          </div>
        )}

        {/* RINGING */}
        {isRinging && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                </span>
                <span className="text-sm font-bold text-amber-300">
                  {callState.status === 'connecting' ? 'Connecting…' : 'Ringing…'}
                </span>
                <span className="font-mono text-sm text-amber-300/60">{formatTimer(callState.duration)}</span>
              </div>
              <button
                type="button"
                onClick={onEndCall}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500/25"
              >
                <PhoneOff className="h-4 w-4" />
                Hang Up
              </button>
            </div>
          </div>
        )}

        {/* CONNECTED */}
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <span className="text-sm font-bold text-emerald-300">Connected</span>
                <span className="font-mono text-xl font-bold text-white">{formatTimer(callState.duration)}</span>
              </div>
              <button
                type="button"
                onClick={onEndCall}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400"
              >
                <PhoneOff className="h-4 w-4" />
                Hang Up
              </button>
            </div>

            {/* In-call controls */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={onMute}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition ${
                  callState.isMuted
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/20'
                }`}
              >
                {callState.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {callState.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={onHold}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition ${
                  callState.isOnHold
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/20'
                }`}
              >
                <Pause className="h-3.5 w-3.5" />
                {callState.isOnHold ? 'Resume' : 'Hold'}
              </button>
              <button
                type="button"
                onClick={onRecord}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition ${
                  isRecording
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/20'
                }`}
              >
                <Disc className="h-3.5 w-3.5" />
                {isRecording ? 'Recording' : 'Record'}
              </button>
              <button
                type="button"
                onClick={onVmDrop}
                disabled={vmDropping || !hasVoicemails || !onVmDrop}
                title={!hasVoicemails ? 'No voicemails saved — add one in Settings → Voicemails' : 'Drop voicemail & hang up'}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/[0.07] py-3 text-xs font-semibold text-violet-300 transition hover:border-violet-500/40 hover:bg-violet-500/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Voicemail className="h-3.5 w-3.5" />
                {vmDropping ? 'Dropping…' : 'VM Drop'}
              </button>
            </div>

            {/* Notes toggle */}
            {onToggleCallNotes && (
              <button
                type="button"
                onClick={onToggleCallNotes}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition ${
                  showCallNotes
                    ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {showCallNotes ? 'Hide Call Notes' : 'Call Notes'}
              </button>
            )}
          </div>
        )}

        {/* DISCONNECTED */}
        {isDisconnected && (
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <p className="text-sm text-slate-400">
              Call ended · <span className="font-mono">{formatTimer(callState.duration)}</span>
            </p>
          </div>
        )}

        {/* Active — in-call is shown above, no duplicate needed */}
      </motion.div>
    </AnimatePresence>
  );
}
