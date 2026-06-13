'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Clock, Loader2, Phone, PhoneOff, User } from 'lucide-react';
import { useInboundRinging } from '@/contexts/inbound-ringing-context';
import { useWebPhone } from '@/contexts/webphone-context';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

function formatPhone(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}

function WaveformBars() {
  return (
    <div className="flex h-10 items-end justify-center gap-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400"
          animate={{ height: ['14px', '36px', '18px', '40px', '14px'] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function InboundCallOverlay() {
  const { call, accept, decline, accepting, isRinging, ringElapsedSec } = useInboundRinging();
  const { phoneStatus } = useWebPhone();

  useEffect(() => {
    if (!isRinging || accepting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void accept();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        void decline();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRinging, accepting, accept, decline]);

  const leadName = call?.lead
    ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ')
    : null;
  const callerBlocked = !call?.from_number;
  const displayName = callerBlocked
    ? 'Unknown / Blocked'
    : (leadName ?? 'Unknown Caller');
  const initials = leadName
    ? leadName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          key="inbound-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Incoming call"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.08] shadow-[0_0_120px_rgba(6,182,212,0.25)]"
            style={{ background: 'linear-gradient(165deg, rgba(10,14,24,0.98) 0%, rgba(6,10,18,0.99) 100%)' }}
          >
            {!accepting && (
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
                    animate={{ opacity: accepting ? 1 : [1, 0.35, 1] }}
                    transition={{ duration: 1.2, repeat: accepting ? 0 : Infinity }}
                    className="inline-block h-2 w-2 rounded-full bg-cyan-400"
                  />
                  {accepting ? 'Connecting' : 'Incoming call'}
                </p>
                {!accepting && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
                    <Clock className="h-3 w-3" />
                    {ringElapsedSec}s
                  </span>
                )}
              </div>

              <div className="mb-8 flex flex-col items-center text-center">
                <div className="relative mb-5">
                  {!accepting && (
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
                    {initials ?? <User className="h-12 w-12" />}
                  </div>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {displayName}
                </h2>

                {call.lead?.company && (
                  <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-white/55">
                    <Building2 className="h-3.5 w-3.5" />
                    {call.lead.company}
                  </p>
                )}

                <p className="mt-3 font-mono text-base text-white/50">
                  {formatInboundCallerDisplay(call.from_number)}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  To your line {formatPhone(call.to_number)}
                </p>

                {accepting ? (
                  <div className="mt-6 w-full">
                    <WaveformBars />
                    <p className="mt-3 text-sm text-cyan-200/75">Securing voice link…</p>
                  </div>
                ) : phoneStatus !== 'ready' ? (
                  <p className="mt-4 text-xs text-amber-400/85">Voice connection warming up…</p>
                ) : null}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void decline()}
                  disabled={accepting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/12 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/22 active:scale-[0.98] disabled:opacity-40"
                >
                  <PhoneOff className="h-5 w-5" />
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => void accept()}
                  disabled={accepting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                >
                  {accepting ? (
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

              {!accepting && (
                <p className="mt-4 text-center text-[10px] text-white/25">
                  <kbd className="rounded border border-white/10 px-1 font-mono">Enter</kbd> accept
                  {' · '}
                  <kbd className="rounded border border-white/10 px-1 font-mono">Esc</kbd> decline
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
