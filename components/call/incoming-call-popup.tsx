'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWebPhone } from '@/contexts/webphone-context';
import { useCallContext } from '@/lib/call-context';

interface InboundLead {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface InboundCall {
  id: string;
  from_number: string;
  to_number: string;
  lead_id: string | null;
  status: string;
  lead?: InboundLead | null;
}

// ── Phone formatting helpers ────────────────────────────────────────────────

function getCountryFlag(e164: string): string {
  const d = e164.replace(/\D/g, '');
  if (d.startsWith('1'))   return '🇺🇸';
  if (d.startsWith('44'))  return '🇬🇧';
  if (d.startsWith('91'))  return '🇮🇳';
  if (d.startsWith('61'))  return '🇦🇺';
  if (d.startsWith('49'))  return '🇩🇪';
  if (d.startsWith('33'))  return '🇫🇷';
  if (d.startsWith('34'))  return '🇪🇸';
  if (d.startsWith('39'))  return '🇮🇹';
  if (d.startsWith('55'))  return '🇧🇷';
  if (d.startsWith('52'))  return '🇲🇽';
  if (d.startsWith('86'))  return '🇨🇳';
  if (d.startsWith('81'))  return '🇯🇵';
  if (d.startsWith('82'))  return '🇰🇷';
  if (d.startsWith('7'))   return '🇷🇺';
  if (d.startsWith('31'))  return '🇳🇱';
  if (d.startsWith('353')) return '🇮🇪';
  if (d.startsWith('64'))  return '🇳🇿';
  if (d.startsWith('27'))  return '🇿🇦';
  if (d.startsWith('92'))  return '🇵🇰';
  if (d.startsWith('971')) return '🇦🇪';
  if (d.startsWith('966')) return '🇸🇦';
  if (d.startsWith('90'))  return '🇹🇷';
  if (d.startsWith('46'))  return '🇸🇪';
  if (d.startsWith('47'))  return '🇳🇴';
  if (d.startsWith('45'))  return '🇩🇰';
  if (d.startsWith('358')) return '🇫🇮';
  if (d.startsWith('41'))  return '🇨🇭';
  if (d.startsWith('43'))  return '🇦🇹';
  if (d.startsWith('32'))  return '🇧🇪';
  if (d.startsWith('48'))  return '🇵🇱';
  if (d.startsWith('60'))  return '🇲🇾';
  if (d.startsWith('65'))  return '🇸🇬';
  if (d.startsWith('66'))  return '🇹🇭';
  if (d.startsWith('63'))  return '🇵🇭';
  if (d.startsWith('62'))  return '🇮🇩';
  if (d.startsWith('84'))  return '🇻🇳';
  if (d.startsWith('20'))  return '🇪🇬';
  if (d.startsWith('234')) return '🇳🇬';
  if (d.startsWith('254')) return '🇰🇪';
  if (d.startsWith('212')) return '🇲🇦';
  if (d.startsWith('213')) return '🇩🇿';
  if (d.startsWith('216')) return '🇹🇳';
  if (d.startsWith('54'))  return '🇦🇷';
  if (d.startsWith('56'))  return '🇨🇱';
  if (d.startsWith('57'))  return '🇨🇴';
  if (d.startsWith('58'))  return '🇻🇪';
  if (d.startsWith('51'))  return '🇵🇪';
  return '🌐';
}

function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g');
  // North America: +1 NXX NXX XXXX
  if (d.startsWith('1') && d.length === 11) {
    return `+1 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  // UK: +44 XXXX XXXXXX
  if (d.startsWith('44') && d.length >= 11) {
    return `+44 ${d.slice(2, 6)} ${d.slice(6)}`;
  }
  // India: +91 XXXXX XXXXX
  if (d.startsWith('91') && d.length === 12) {
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  }
  // Australia: +61 X XXXX XXXX
  if (d.startsWith('61') && d.length === 11) {
    return `+61 ${d.slice(2, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
  }
  // Generic: keep original E.164 with + prefix
  return e164.startsWith('+') ? e164 : `+${d}`;
}

// ── WebAudio ringtone — no external file needed ─────────────────────────────

let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;

function playRingtone() {
  try {
    if (typeof AudioContext === 'undefined' && typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = AudioContext ?? (window as any).webkitAudioContext;
    audioCtx = new Ctx();
    ringInterval = setInterval(() => {
      if (!audioCtx) return;
      [480, 620].forEach((freq, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        const start = audioCtx!.currentTime + i * 0.1;
        osc.start(start);
        osc.stop(start + 0.35);
      });
    }, 1400);
  } catch { /* AudioContext not available */ }
}

function stopRingtone() {
  if (ringInterval) { clearInterval(ringInterval); ringInterval = null; }
  if (audioCtx) { void audioCtx.close().catch(() => {}); audioCtx = null; }
}

interface Props {
  userId: string;
}

export function IncomingCallPopup({ userId }: Props) {
  const [call, setCall] = useState<InboundCall | null>(null);
  const [declining, setDeclining] = useState(false);
  const callIdRef = useRef<string | null>(null);

  const { answerIncomingCall } = useWebPhone();
  const { registerCallMeta } = useCallContext();

  // Keyboard: Enter = answer, Esc = decline (Space reserved for outbound dial)
  useEffect(() => {
    if (!call) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleAccept(); }
      if (e.key === 'Escape') { e.preventDefault(); void handleDecline(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`inbound-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          console.log('[POPUP] Inbound INSERT received:', row.id| direction:', row.direction| status:', row.status);
          if (row.direction !== 'inbound' || row.status !== 'ringing') return;
          callIdRef.current = row.id as string;

          let lead: InboundLead | null = null;
          if (row.lead_id) {
            const { data } = await supabase
              .from('leads')
              .select('first_name, last_name, company')
              .eq('id', row.lead_id as string)
              .maybeSingle();
            lead = data ?? null;
          }

          setCall({
            id: row.id as string,
            from_number: row.from_number as string,
            to_number: row.to_number as string,
            lead_id: row.lead_id as string | null,
            status: row.status as string,
            lead,
          });
          playRingtone();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.id !== callIdRef.current) return;
          if (['missed'c, 'ompleted'rejected'].includes(row.status as string)) {
            setCall(null);
            stopRingtone();
          }
        },
      )
      .subscribe((status) => {
        console.log('[POPUP] Realtime status:', status| userId:', userId);
      });

    return () => {
      supabase.removeChannel(channel);
      stopRingtone();
    };
  }, [userId]);

  if (!call) return null;

  const leadName = call.lead
    ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ')
    : null;
  const displayName = leadName ?? 'Unknown Caller';
  const flag = getCountryFlag(call.from_number ?? '');
  const formattedFrom = formatPhone(call.from_number ?? '');
  const formattedTo = formatPhone(call.to_number ?? '');
  const initials = leadName
    ? leadName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  const handleAccept = () => {
    stopRingtone();
    const callId = call.id;
    setCall(null);

    // Register with CallContext so ActiveCallOverlay shows caller info
    registerCallMeta(
      call.lead
        ? {
            id: call.lead_id ?? '',
            name: displayName,
            company: call.lead.company ?? '',
            phone: call.from_number,
          } as Parameters<typeof registerCallMeta>[0]
        : null,
      call.from_number,
    );

    // Update DB + signal Telnyx (non-fatal if REST answer fails for WebRTC calls)
    void fetch(`/api/calls/${callId}/answer`, { method: 'POST' }).catch(
      (err) => console.error('[POPUP] REST answer failed:', err),
    );

    // Answer via WebRTC SDK so browser audio connects
    answerIncomingCall();
  };

  const handleDecline = async () => {
    if (declining) return;
    setDeclining(true);
    stopRingtone();
    try {
      await fetch(`/api/calls/${call.id}/end`, { method: 'POST' });
    } catch { /* non-fatal */ }
    setCall(null);
    setDeclining(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="inbound-popup"
        initial={{ opacity: 0, y: -32, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -32, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed left-1/2 top-5 z-[60] w-[360px] max-w-[92vw] -translate-x-1/2 overflow-hidden
                   rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl
                   shadow-2xl shadow-black/60"
        style={{ background: 'rgba(8, 8, 14, 0.96)' }}
      >
        {/* Animated ring indicator */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(258,90%,66%)']/[0.08] to-transparent" />
          <motion.div
            animate={{ scaleX: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="h-0.5 w-full bg-gradient-to-r from-[hsl(258,90%,66%)]/40 via-[hsl(186,100%,42%)] to-[hsl(258,90%,66%)']/40"
          />
        </div>

        <div className="px-5 py-5 sm:px-6">
          {/* Status label */}
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-widest text-[hsl(186,100%,42%)']">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(186,100%,42%)'] align-middle"
            />
            Incoming Call
          </p>

          {/* Avatar + caller info */}
          <div className="mb-5 flex flex-col items-center gap-3">
            {/* Pulsing avatar */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-8px] rounded-[28px]"
                style={{ background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(186,100%,42%))'' }}
              />
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(186,100%,42%))'' }}
              >
                {initials ?? <User className="h-8 w-8" />}
              </div>
            </div>

            {/* Name + number */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">
                <span className="mr-1.5">{flag}</span>
                {displayName}
              </h3>
              {call.lead?.company && (
                <p className="text-sm text-white/50">{call.lead.company}</p>
              )}
              {/* Always show formatted from_number */}
              <p className="mt-0.5 font-mono text-xs tabular-nums text-white/35">
                {formattedFrom}
              </p>
              {/* The number that was dialled */}
              <p className="mt-1 text-[11px] text-white/25">
                → your {formattedTo}
              </p>
            </div>
          </div>

          {/* Accept / Decline */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleDecline()}
              disabled={declining}
              aria-label="Decline call"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/30
                         bg-red-500/10 py-3.5 text-sm font-medium text-red-400 transition
                         hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
            >
              <PhoneOff className="h-4 w-4" /> Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              aria-label="Accept call"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl
                         bg-gradient-to-r from-green-600 to-green-500 py-3.5 text-sm font-medium
                         text-white shadow-lg shadow-green-500/20 transition
                         hover:from-green-500 hover:to-green-400 active:scale-95"
            >
              <Phone className="h-4 w-4" /> Accept
            </button>
          </div>

          {/* Hotkey hint */}
          <p className="mt-3 text-center text-[10px] text-white/20">
            <kbd className="rounded border border-white/10 px-1 font-mono">Enter</kbd> accept
            {' · '}
            <kbd className="rounded border border-white/10 px-1 font-mono">Esc</kbd> decline
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
