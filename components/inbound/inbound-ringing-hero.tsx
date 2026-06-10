'use client';

import { motion } from 'framer-motion';
import { Phone, PhoneOff, User } from 'lucide-react';
import type { InboundRingingCall } from '@/hooks/use-inbound-ringing';

function formatPhone(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}

interface Props {
  call: InboundRingingCall;
  onAccept: () => void;
  onDecline: () => void;
}

export function InboundRingingHero({ call, onAccept, onDecline }: Props) {
  const leadName = call.lead
    ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ')
    : null;
  const displayName = leadName ?? 'Unknown Caller';
  const initials = leadName
    ? leadName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/[0.12] via-[#8B5CF6]/[0.08] to-transparent p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)]"
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
      />

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="absolute inset-[-12px] rounded-3xl bg-cyan-400/20"
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}
            >
              {initials ?? <User className="h-9 w-9" />}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Incoming call now
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{displayName}</h2>
            {call.lead?.company && (
              <p className="text-sm text-white/50">{call.lead.company}</p>
            )}
            <p className="mt-1 font-mono text-sm text-white/40">{formatPhone(call.from_number)}</p>
          </div>
        </div>

        <div className="flex w-full gap-3 sm:w-auto sm:min-w-[280px]">
          <button
            type="button"
            onClick={() => void onDecline()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/15 py-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 active:scale-95"
          >
            <PhoneOff className="h-5 w-5" />
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-500 hover:to-emerald-400 active:scale-95"
          >
            <Phone className="h-5 w-5" />
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  );
}
