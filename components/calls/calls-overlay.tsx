'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Hash, Loader2, Clock, User, Minimize2, X,
} from 'lucide-react';
import { useCalls } from '@/contexts/calls-context';
import { PersistentCallBar } from '@/components/premium/persistent-call-bar';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

function fmtTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
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

const DTMF_ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['*', '0', '#']];

function DtmfPad({ onDigit, onClose }: { onDigit: (d: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      className="mb-3 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Keypad</span>
        <button type="button" onClick={onClose} className="text-slate-600 transition hover:text-slate-400">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="mx-auto grid w-fit grid-cols-3 gap-1.5">
        {DTMF_ROWS.flat().map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-bold text-white transition hover:bg-white/[0.08] active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function WaveBars({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-end justify-center gap-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400"
          animate={active ? { height: ['14px', '36px', '18px', '40px', '14px'] } : { height: '12px' }}
          transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/**
 * The single inbound call surface. One persistent shell morphs across
 * incoming → connecting → active without ever unmounting, so accepting never
 * flashes the modal. The connected state is minimizable to the call bar and the
 * call keeps running while minimized.
 */
export default function CallsOverlay() {
  const {
    phase,
    fromNumber,
    toNumber,
    durationSec,
    ringElapsedSec,
    isMuted,
    isOnHold,
    minimized,
    accept,
    decline,
    hangup,
    toggleMute,
    toggleHold,
    sendDigit,
    setMinimized,
  } = useCalls();

  const [showDTMF, setShowDTMF] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (phase === 'idle') return null;

  const isIncoming = phase === 'incoming';
  const isConnecting = phase === 'connecting';
  const isActive = phase === 'active';
  const isEnded = phase === 'ended';

  const displayName = fromNumber ? formatInboundCallerDisplay(fromNumber) : 'Unknown / Blocked';

  // ── Minimized (connected) → call bar; call keeps running ─────────────────────
  if (isActive && minimized) {
    return (
      <PersistentCallBar
        name={displayName}
        elapsed={durationSec}
        callStatus={isOnHold ? 'held' : 'active'}
        isMuted={isMuted}
        isMobile={isMobile}
        layoutId="gd-call-pill"
        onExpand={() => setMinimized(false)}
        onHangup={hangup}
        onToggleMute={toggleMute}
      />
    );
  }

  const headerLabel = isActive
    ? (isOnHold ? 'On hold' : 'Connected')
    : isConnecting
      ? 'Connecting'
      : isEnded
        ? 'Call ended'
        : 'Incoming call';

  return (
    <motion.div
      layoutId="gd-call-session-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Live call session"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <motion.div
        layout
        className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.08] shadow-[0_0_120px_rgba(6,182,212,0.25)]"
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
                animate={{ opacity: isConnecting ? 1 : isActive ? 1 : [1, 0.35, 1] }}
                transition={{ duration: 1.2, repeat: isConnecting || isActive ? 0 : Infinity }}
                className={`inline-block h-2 w-2 rounded-full ${isActive && !isOnHold ? 'bg-emerald-400' : isOnHold ? 'bg-amber-400' : 'bg-cyan-400'}`}
              />
              {headerLabel}
            </p>
            {isActive ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tabular-nums text-white">{fmtTime(durationSec)}</span>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 transition hover:border-white/[0.16] hover:text-slate-200"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
                <Clock className="h-3 w-3" />
                {fmtTime(ringElapsedSec)}
              </span>
            )}
          </div>

          <div className="mb-8 flex flex-col items-center text-center">
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
            <p className="mt-3 font-mono text-base text-white/50">{formatInboundCallerDisplay(fromNumber)}</p>
            <p className="mt-1 text-xs text-white/30">To your line {fmtLine(toNumber)}</p>

            {isConnecting && (
              <div className="mt-6 w-full">
                <WaveBars active />
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-cyan-200/75">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Securing voice link…
                </p>
              </div>
            )}
            {isActive && (
              <div className="mt-6 w-full">
                <WaveBars active={!isOnHold} />
              </div>
            )}
          </div>

          {isActive ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: isMuted ? MicOff : Mic, label: isMuted ? 'Unmute' : 'Mute', onClick: toggleMute, active: isMuted },
                  { icon: isOnHold ? Play : Pause, label: isOnHold ? 'Resume' : 'Hold', onClick: toggleHold, active: isOnHold },
                  { icon: Hash, label: 'Keypad', onClick: () => setShowDTMF((v) => !v), active: showDTMF },
                ].map(({ icon: Icon, label, onClick, active }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-[10px] font-semibold transition ${
                      active
                        ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
                        : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {showDTMF && <DtmfPad onDigit={sendDigit} onClose={() => setShowDTMF(false)} />}
              </AnimatePresence>
              <button
                type="button"
                onClick={hangup}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-4 text-sm font-semibold text-white shadow-lg shadow-red-900/25 transition hover:brightness-110 active:scale-[0.98]"
              >
                <PhoneOff className="h-5 w-5" />
                End Call
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => decline()}
                disabled={isConnecting || isEnded}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/12 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/22 active:scale-[0.98] disabled:opacity-40"
              >
                <PhoneOff className="h-5 w-5" />
                Decline
              </button>
              <button
                type="button"
                onClick={() => void accept()}
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
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
