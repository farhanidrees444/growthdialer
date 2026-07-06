'use client';

import { motion } from 'framer-motion';
import {
  Phone, PhoneOff, Loader2, Clock, User, Building2, History,
} from 'lucide-react';
import { useCalls, useCallerDisplayName } from '@/contexts/calls-context';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtLine(e164: string | null | undefined): string {
  if (!e164) return 'Unknown line';
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}

function WaveBars() {
  return (
    <div className="flex h-10 items-end justify-center gap-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400"
          animate={{ height: ['14px', '36px', '18px', '40px', '14px'] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/**
 * Pre-accept inbound surface only. Connected calls use ActiveCallOverlay (shared with outbound).
 */
export default function CallsOverlay() {
  const {
    phase,
    fromNumber,
    toNumber,
    callId,
    ringElapsedSec,
    connectError,
    callerContext,
    accept,
    decline,
  } = useCalls();

  const displayName = useCallerDisplayName(fromNumber, callerContext);

  if (phase === 'idle') return null;

  const isIncoming = phase === 'incoming';
  const isConnecting = phase === 'connecting';
  const isEnded = phase === 'ended';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Incoming call"
    >
      {/* Backdrop is purely visual — it must never intercept clicks meant for the card. */}
      <div className="pointer-events-none absolute inset-0 bg-black/75 backdrop-blur-md" />
      <motion.div
        className="pointer-events-auto relative isolate w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.08] shadow-[0_0_120px_rgba(6,182,212,0.25)]"
        style={{ background: 'linear-gradient(165deg, rgba(10,14,24,0.98) 0%, rgba(6,10,18,0.99) 100%)' }}
      >
        {isIncoming && (
          <>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20"
            />
            <motion.div
              animate={{ scale: [1, 1.55, 1], opacity: [0.12, 0, 0.12] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.35 }}
              className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15"
            />
          </>
        )}

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="mb-6 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              <motion.span
                animate={{ opacity: isConnecting ? 1 : [1, 0.35, 1] }}
                transition={{ duration: 1.2, repeat: isConnecting ? 0 : Infinity }}
                className="inline-block h-2 w-2 rounded-full bg-cyan-400"
              />
              {isConnecting ? 'Connecting' : isEnded ? 'Call ended' : 'Incoming call'}
            </p>
            <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
              <Clock className="h-3 w-3" />
              {fmtTime(ringElapsedSec)}
            </span>
          </div>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="relative mb-5">
              {isIncoming && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="absolute inset-[-12px] rounded-3xl bg-cyan-400/20"
                />
              )}
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-3xl text-3xl font-bold text-white shadow-xl shadow-cyan-500/25"
                style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)' }}
              >
                <User className="h-12 w-12" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{displayName}</h2>
            {fromNumber && (
              <p className="mt-3 font-mono text-base text-white/50">{formatInboundCallerDisplay(fromNumber)}</p>
            )}
            <p className="mt-1 text-xs text-white/30">To your line {fmtLine(toNumber)}</p>

            {isConnecting && (
              <div className="mt-6 w-full">
                <WaveBars />
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-cyan-200/75">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Securing voice link…
                </p>
              </div>
            )}
            {connectError && (
              <p className="mt-4 text-center text-xs text-red-300/90">{connectError}</p>
            )}
          </div>

          {(callerContext.company || callerContext.pastCallCount > 0 || callerContext.lastDisposition || callerContext.carrier) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left"
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-400/90">Caller context</p>
              <div className="space-y-1.5 text-sm text-white/70">
                {callerContext.company && (
                  <p className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-cyan-400/80" />
                    {callerContext.company}
                  </p>
                )}
                {callerContext.carrier && (
                  <p className="text-xs text-white/40">{callerContext.carrier}</p>
                )}
                {callerContext.pastCallCount > 0 && (
                  <p className="flex items-center gap-2 text-xs">
                    <History className="h-3.5 w-3.5 text-violet-400/80" />
                    {callerContext.pastCallCount} prior call{callerContext.pastCallCount === 1 ? '' : 's'}
                    {callerContext.lastDisposition ? ` · last: ${callerContext.lastDisposition}` : ''}
                  </p>
                )}
              </div>
              {callerContext.loading && (
                <p className="mt-2 text-[10px] text-white/30">Loading enrichment…</p>
              )}
            </motion.div>
          )}

          <div className="relative z-10 flex gap-3">
            <button
              type="button"
              onClick={() => {
                console.log('[Inbound] DECLINE CLICKED', { phase, callId });
                decline();
              }}
              disabled={isEnded}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/12 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/22 active:scale-[0.98] disabled:opacity-40"
            >
              <PhoneOff className="h-5 w-5" />
              {isConnecting ? 'Cancel' : 'Decline'}
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('[Inbound] ACCEPT CLICKED', { phase, callId });
                void accept();
              }}
              disabled={isConnecting || isEnded}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5" />
                  Accept
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
