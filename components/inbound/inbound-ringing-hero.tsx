'use client';

import { motion } from 'framer-motion';
import { Loader2, Phone, PhoneOff, User } from 'lucide-react';
import type { InboundRingingCall } from '@/hooks/use-inbound-ringing';
import { formatInboundCallerDisplay } from '@/lib/inbound/phone';

interface Props {
  call: InboundRingingCall;
  onAccept: () => void;
  onDecline: () => void;
  accepting?: boolean;
}

function WaveformBars() {
  return (
    <div className="flex h-8 items-end justify-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400"
          animate={{ height: ['12px', '28px', '16px', '32px', '12px'] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function InboundRingingHero({ call, onAccept, onDecline, accepting = false }: Props) {
  const leadName = call.lead
    ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ')
    : null;
  const displayName = leadName ?? 'Unknown Caller';
  const initials = leadName
    ? leadName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-[rgba(6,10,18,0.85)] p-6 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <motion.div
        animate={{ opacity: accepting ? 0.6 : [0.35, 1, 0.35] }}
        transition={{ duration: accepting ? 0.3 : 1.6, repeat: accepting ? 0 : Infinity }}
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"
      />

      {!accepting && (
        <>
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15"
          />
        </>
      )}

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            {!accepting && (
              <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute inset-[-14px] rounded-3xl bg-cyan-400/25"
              />
            )}
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg shadow-cyan-500/20"
              style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)' }}
            >
              {initials ?? <User className="h-10 w-10" />}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/90">
              {accepting ? 'Connecting your call' : 'Incoming call now'}
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {displayName}
            </h2>
            {call.lead?.company && (
              <p className="mt-0.5 text-sm text-white/55">{call.lead.company}</p>
            )}
            <p className="mt-2 font-mono text-sm text-white/40">{formatInboundCallerDisplay(call.from_number)}</p>
            {accepting && (
              <div className="mt-4">
                <WaveformBars />
                <p className="mt-2 text-xs text-cyan-200/70">Establishing secure voice link…</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full gap-3 sm:w-auto sm:min-w-[300px]">
          <button
            type="button"
            onClick={() => void onDecline()}
            disabled={accepting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/12 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/22 active:scale-[0.98] disabled:opacity-40"
          >
            <PhoneOff className="h-5 w-5" />
            Decline
          </button>
          <button
            type="button"
            onClick={() => void onAccept()}
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
      </div>
    </motion.div>
  );
}
