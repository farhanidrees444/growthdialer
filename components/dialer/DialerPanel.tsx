'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Disc,
  SkipForward,
  Mail,
  Clock,
  Hash,
  PhoneCall,
  Voicemail,
} from 'lucide-react';
import ManualDialer from '@/components/dialer/ManualDialer';
import DialModeSegmented from '@/components/dialer/DialModeSegmented';
import { LeadRecord } from '@/components/dialer/LeadCard';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(20');
  const s = (seconds % 60).toString().padStart(20');
  return `${m}:${s}`;
}

function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 wk ago' : `${weeks}wks ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

interface CallState {
  status: string;
  callSid: string | null;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  leadId: string | null;
  leadName: string | null;
}

interface DialerPanelProps {
  selectedLead: LeadRecord | null;
  phoneNumber: string;
  countryCode: string;
  callState: CallState;
  notes: string;
  onCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDial: () => void;
  onMute: () => void;
  onHold: () => void;
  onRecord: () => void;
  onNextLead: () => void;
  onEndCall: () => void;
  onSaveNotes: (value: string) => void;
  onMarkDNC: () => void;
  isReady: boolean;
  isRecording: boolean;
  error?: string | null;
  dialMode: 'manual' | 'power';
  onStartPowerDial: () => void;
  onVmDrop?: () => void;
  vmDropping?: boolean;
  hasVoicemails?: boolean;
}

export default function DialerPanel({
  selectedLead,
  phoneNumber,
  countryCode,
  callState,
  notes,
  onCountryChange,
  onPhoneChange,
  onDigit,
  onBackspace,
  onDial,
  onMute,
  onHold,
  onRecord,
  onNextLead,
  onEndCall,
  onSaveNotes,
  onMarkDNC,
  isReady,
  isRecording,
  error,
  dialMode,
  onStartPowerDial,
  onVmDrop,
  vmDropping = false,
  hasVoicemails = false,
}: DialerPanelProps) {
  const [localNotes, setLocalNotes] = useState(notes);

  // Sync when parent notes change (lead selection changed)
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const isIdle = callState.status === 'idle';
  const isActive = ['connecting'r, 'inging'connected'].includes(callState.status);
  const isRinging = callState.status === 'ringing' || callState.status === 'connecting';
  const isConnected = callState.status === 'connected';
  const isDisconnected = callState.status === 'disconnected';

  const scoreGradient = useMemo(() => {
    if (!selectedLead) return 'from-slate-500 to-slate-700';
    if (selectedLead.ai_score >= 80) return 'from-emerald-500 to-teal-400';
    if (selectedLead.ai_score >= 50) return 'from-amber-500 to-orange-400';
    return 'from-slate-500 to-slate-600';
  }, [selectedLead]);

  const tags = selectedLead?.tags ?? [];
  const initials = selectedLead ? getInitials(selectedLead.name) : '';

  return (
    <section className="flex flex-col gap-5">
      {/* ── Now Dialing card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">

        {/* Lead info OR empty state */}
        {selectedLead ? (
          <>
            {/* Header: avatar + name + score */}
            <div className="flex items-start gap-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreGradient} text-lg font-bold text-white shadow-lg`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Now Dialing</p>
                <h2 className="mt-1 truncate text-2xl font-bold leading-tight text-white">
                  {selectedLead.name}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-400">
                  {[selectedLead.title, selectedLead.company].filter(Boolean).join(' at ')}
                </p>
              </div>
              <div
                className={`shrink-0 rounded-xl bg-gradient-to-br ${scoreGradient} px-3 py-1.5 text-center shadow-sm`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">AI</p>
                <p className="text-lg font-bold text-white">{selectedLead.ai_score}</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="font-mono text-sm text-emerald-400">
                  {selectedLead.phone || '—'}
                </span>
              </div>
              {selectedLead.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="truncate text-sm text-slate-300">{selectedLead.email}</span>
                </div>
              )}
            </div>

            {/* Call history row */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>Last Call</span>
                </div>
                <p className="mt-1 font-semibold text-white">
                  {timeAgo(selectedLead.last_called_at)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Hash className="h-3 w-3" />
                  <span>Attempts</span>
                </div>
                <p className="mt-1 font-semibold text-white">{selectedLead.call_attempts ?? 0}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <PhoneCall className="h-3 w-3" />
                  <span>Status</span>
                </div>
                <p className="mt-1 truncate font-semibold capitalize text-white">
                  {selectedLead.status.replace(/_/g ')}
                </p>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="mt-4">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Notes</p>
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={() => onSaveNotes(localNotes)}
                placeholder="Quick notes about this lead…"
                rows={2}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.05]"
              />
            </div>
          </>
        ) : isIdle ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]"
            >
              <Phone className="h-8 w-8 text-slate-600" />
            </motion.div>
            <p className="text-sm font-semibold text-slate-400">Select a lead to begin</p>
            <p className="mt-1 text-xs text-slate-600">← Pick from the lead queue</p>
          </div>
        ) : null}

        {/* Error banner */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3">
            <p className="text-sm font-semibold text-rose-300">Call failed</p>
            <p className="mt-0.5 text-xs text-rose-300/70">{error}</p>
          </div>
        )}

        {/* CALL NOW button + quick actions (idle + lead selected) */}
        {isIdle && selectedLead && (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={onDial}
              disabled={!phoneNumber}
              className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-4 font-mono text-sm font-bold uppercase tracking-wider text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                Call {selectedLead.name.split(' ')[0]}
              </span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onNextLead}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-300"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>
              <button
                type="button"
                onClick={onMarkDNC}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] py-2.5 text-xs font-semibold text-red-400 transition hover:border-red-500/35 hover:bg-red-500/[0.08]"
              >
                Mark DNC
              </button>
            </div>
          </div>
        )}

        {/* Ringing bar */}
        {isRinging && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
              </span>
              <span className="text-sm font-semibold text-amber-300">
                {callState.status === 'connecting' ? 'Connecting…' : 'Ringing…'}
              </span>
              <span className="text-xs text-amber-300/60">{formatTimer(callState.duration)}</span>
            </div>
            <button
              type="button"
              onClick={onEndCall}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/25"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              Hang Up
            </button>
          </div>
        )}

        {/* Connected bar */}
        {isConnected && (
          <div className="mt-4 space-y-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <span className="text-sm font-bold text-emerald-300">
                  Connected · {formatTimer(callState.duration)}
                </span>
              </div>
              <button
                type="button"
                onClick={onEndCall}
                className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                Hang Up
              </button>
            </div>
            {onVmDrop && (
              <button
                type="button"
                onClick={onVmDrop}
                disabled={vmDropping || !hasVoicemails}
                title={!hasVoicemails ? 'No voicemails saved — add one in Settings → Voicemails' : 'Drop voicemail & hang up'}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/[0.08] px-4 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/[0.15] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Voicemail className="h-3.5 w-3.5" />
                {vmDropping ? 'Dropping voicemail…' : 'Drop Voicemail'}
              </button>
            )}
          </div>
        )}

        {/* Disconnected bar */}
        {isDisconnected && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-slate-400">Call ended · {formatTimer(callState.duration)}</p>
          </div>
        )}
      </div>

      {/* ── In-call controls (mute / hold / record) ──────────────────────── */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <button
            type="button"
            onClick={onMute}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition ${
              callState.isMuted
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/20'
            }`}
          >
            {callState.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {callState.isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={onHold}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition ${
              callState.isOnHold
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/20'
            }`}
          >
            <Pause className="h-4 w-4" />
            {callState.isOnHold ? 'Resume' : 'Hold'}
          </button>
          <button
            type="button"
            onClick={onRecord}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition ${
              isRecording
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/20'
            }`}
          >
            <Disc className="h-4 w-4" />
            {isRecording ? 'Recording' : 'Record'}
          </button>
        </motion.div>
      )}

      {/* ── Manual dialer + dial mode panel ──────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <ManualDialer
          countryCode={countryCode}
          phoneNumber={phoneNumber}
          onCountryChange={onCountryChange}
          onPhoneChange={onPhoneChange}
          onDial={onDial}
          onDigit={onDigit}
          onBackspace={onBackspace}
          isReady={isReady}
        />

        {/* Dial mode + lead intel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-500">Dial Mode</p>
            <DialModeSegmented
              mode={dialMode === 'power' ? 'power' : 'manual'}
              onStartPowerDial={onStartPowerDial}
              disabled={!isReady || callState.status !== 'idle'}
              className="w-full"
            />
          </div>

          {/* Lead intel */}
          {selectedLead && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-500">Lead Intel</p>
              <div className="space-y-2 text-xs">
                {selectedLead.industry && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Industry</span>
                    <span className="font-medium text-white">{selectedLead.industry}</span>
                  </div>
                )}
                {selectedLead.company_size && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Size</span>
                    <span className="font-medium text-white">{selectedLead.company_size}</span>
                  </div>
                )}
                {selectedLead.revenue && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Revenue</span>
                    <span className="font-medium text-white">{selectedLead.revenue}</span>
                  </div>
                )}
                {selectedLead.activity_summary && (
                  <p className="mt-2 leading-relaxed text-slate-400">
                    {selectedLead.activity_summary}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
