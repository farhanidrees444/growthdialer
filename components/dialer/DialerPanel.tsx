'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Pause, Disc, SkipForward } from 'lucide-react';
import ManualDialer from '@/components/dialer/ManualDialer';
import DispositionPanel from '@/components/dialer/DispositionPanel';
import { LeadRecord } from '@/components/dialer/LeadCard';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
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
  onDisposition: (disp: string, localNotes: string, callbackAt?: string) => Promise<void>;
  isReady: boolean;
  isRecording: boolean;
  error?: string | null;
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
  onDisposition,
  isReady,
  isRecording,
  error,
}: DialerPanelProps) {
  const isIdle = callState.status === 'idle';
  const isActive = ['connecting', 'ringing', 'connected'].includes(callState.status);
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

  return (
    <section className="flex flex-col gap-5">
      {/* ── Lead info card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Now Dialing</p>
            <h2 className="mt-1.5 truncate text-2xl font-bold text-white">
              {selectedLead?.name ?? 'No lead selected'}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-400">
              {selectedLead
                ? `${selectedLead.title} · ${selectedLead.company}`
                : 'Pick a lead from the queue'}
            </p>
          </div>
          {selectedLead && (
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreGradient} shadow-lg`}
            >
              <span className="text-lg font-bold text-white">{selectedLead.ai_score}</span>
            </div>
          )}
        </div>

        {/* Lead details row */}
        {selectedLead && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <p className="text-slate-500">Phone</p>
              <p className="mt-1 font-semibold text-white">{selectedLead.phone || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <p className="text-slate-500">Company</p>
              <p className="mt-1 truncate font-semibold text-white">{selectedLead.company || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <p className="text-slate-500">Attempts</p>
              <p className="mt-1 font-semibold text-white">{selectedLead.call_attempts ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <p className="text-slate-500">Status</p>
              <p className="mt-1 truncate font-semibold capitalize text-white">
                {selectedLead.status.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

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

        {/* Error banner */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3">
            <p className="text-sm font-semibold text-rose-300">Call failed</p>
            <p className="mt-0.5 text-xs text-rose-300/70">{error}</p>
          </div>
        )}

        {/* ── Call status bar ──────────────────────────────────────────────── */}
        {isIdle && selectedLead && (
          <button
            type="button"
            onClick={onDial}
            disabled={!phoneNumber}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              Call {selectedLead.name.split(' ')[0]}
            </span>
          </button>
        )}

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

        {isConnected && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
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
        )}

        {isDisconnected && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-slate-400">
              Call ended · {formatTimer(callState.duration)}
            </p>
            <button
              type="button"
              onClick={onNextLead}
              className="flex items-center gap-1.5 text-xs text-emerald-400 transition hover:text-emerald-300"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip lead
            </button>
          </div>
        )}
      </div>

      {/* ── In-call controls (mute/hold/record) ─────────────────────────── */}
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

      {/* ── Disposition panel — shown post-call ─────────────────────────── */}
      {isDisconnected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <DispositionPanel
            notes={notes}
            onSaveNotes={onSaveNotes}
            onDisposition={onDisposition}
          />
        </motion.div>
      )}

      {/* ── Manual dialer + mode indicator ──────────────────────────────── */}
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

        {/* Dial mode + quick stats */}
        <div className="space-y-4">
          {/* Mode selector — manual only, others coming soon */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-500">Dial Mode</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5">
                <span className="text-xs font-semibold text-emerald-300">Manual</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 opacity-40">
                <span className="text-xs text-slate-500">Power Dialing</span>
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-500">
                  Soon
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 opacity-40">
                <span className="text-xs text-slate-500">Parallel Lines</span>
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-500">
                  Soon
                </span>
              </div>
            </div>
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
                {selectedLead.last_called_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last called</span>
                    <span className="font-medium text-white">
                      {new Date(selectedLead.last_called_at).toLocaleDateString()}
                    </span>
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
