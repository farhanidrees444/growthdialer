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

// WebAudio ringtone — no external file needed
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

  const { answerIncomingCall, hangup } = useWebPhone();
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
          console.log('[POPUP] Inbound INSERT received:', row.id, '| direction:', row.direction, '| status:', row.status);
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
          if (['missed', 'completed', 'rejected'].includes(row.status as string)) {
            setCall(null);
            stopRingtone();
          }
        },
      )
      .subscribe((status) => {
        console.log('[POPUP] Realtime status:', status, '| userId:', userId);
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
  const displayName = leadName || call.from_number;
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

    // Answer via Telnyx REST (updates DB + signals Telnyx to bridge audio)
    void fetch(`/api/calls/${callId}/answer`, { method: 'POST' }).catch(
      (err) => console.error('[POPUP] REST answer failed:', err),
    );

    // Also answer via WebRTC SDK so browser audio connects
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
        initial={{ opacity: 0, y: -32, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -32, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed left-1/2 top-5 z-[60] w-[360px] max-w-[92vw] -translate-x-1/2 overflow-hidden
                   rounded-3xl border border-white/[0.12] bg-black/95 backdrop-blur-2xl
                   shadow-2xl shadow-black/60"
      >
        {/* Animated ring indicator */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/[0.07] to-transparent" />
          <motion.div
            animate={{ scaleX: [1, 1.02, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="h-0.5 w-full bg-gradient-to-r from-green-500/40 via-green-400 to-green-500/40"
          />
        </div>

        <div className="px-6 py-5">
          {/* Status label */}
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-green-400">
            <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-green-400 align-middle" />
            Incoming Call
          </p>

          {/* Avatar + caller info */}
          <div className="mb-5 flex flex-col items-center gap-2">
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
            >
              {initials ?? <User className="h-8 w-8" />}
              <motion.span
                animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl border-2 border-green-400"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{displayName}</h3>
              {call.lead?.company && (
                <p className="text-sm text-white/50">{call.lead.company}</p>
              )}
              {leadName && (
                <p className="mt-0.5 font-mono text-xs text-white/35">{call.from_number}</p>
              )}
              {!call.lead && (
                <p className="mt-0.5 text-xs text-amber-400/70">Unknown caller</p>
              )}
            </div>
          </div>

          {/* Accept / Decline */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleDecline()}
              disabled={declining}
              aria-label="Decline call"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <PhoneOff className="h-4 w-4" /> Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              aria-label="Accept call"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition hover:from-green-500 hover:to-green-400"
            >
              <Phone className="h-4 w-4" /> Accept
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
