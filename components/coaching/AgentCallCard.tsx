'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, PhoneCall, Shield, UserRound } from 'lucide-react';
import type { LiveCall } from './types';

const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

function elapsed(anchor: string | null | undefined): string {
  if (!anchor) return '00:00';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(anchor).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function sentimentClass(score: number | null | undefined): string {
  if (score == null) return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  if (score >= 70) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
  if (score >= 45) return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
  return 'text-red-300 bg-red-500/10 border-red-500/20';
}

export function AgentCallCard({
  call,
  onWhisper,
  onBarge,
}: {
  call: LiveCall;
  onWhisper: (call: LiveCall) => void;
  onBarge: (call: LiveCall) => void;
}) {
  const [time, setTime] = useState('00:00');
  const anchor = call.answered_at ?? call.started_at ?? call.created_at;
  const agentName = call.agent_name ?? 'Agent';
  const prospectName = useMemo(() => {
    const fromLead = [call.lead_first_name, call.lead_last_name].filter(Boolean).join(' ');
    return call.prospect_name || fromLead || call.to_number || 'Prospect';
  }, [call.lead_first_name, call.lead_last_name, call.prospect_name, call.to_number]);
  const sentiment = call.ai_sentiment_score == null ? null : Math.round(Number(call.ai_sentiment_score));
  const talkRatio = Math.max(0, Math.min(100, Number(call.talk_listen_ratio ?? 52)));

  useEffect(() => {
    queueMicrotask(() => setTime(elapsed(anchor)));
    const id = setInterval(() => setTime(elapsed(anchor)), 1000);
    return () => clearInterval(id);
  }, [anchor]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6]">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{agentName}</p>
            <p className="text-xs text-slate-400">{prospectName}{call.prospect_company ? ` · ${call.prospect_company}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
          <Clock className="h-3 w-3 text-[#06B6D4]" />
          <span className="tabular-nums">{time}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className={`rounded-xl border px-3 py-2 ${sentimentClass(sentiment)}`}>
          <p className="text-[10px] uppercase tracking-widest opacity-70">AI sentiment</p>
          <p className="text-lg font-bold tabular-nums">{sentiment ?? '--'}{sentiment != null ? '/100' : ''}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Talk / listen</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#06B6D4]" style={{ width: `${talkRatio}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">{Math.round(talkRatio)}% talk</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onWhisper(call)}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-[#8B5CF6]/20"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Whisper
        </button>
        <button
          type="button"
          onClick={() => onBarge(call)}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#06B6D4]/25 bg-[#06B6D4]/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-[#06B6D4]/20"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Barge
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
        <Shield className="h-3 w-3" />
        Manager actions are authorized server-side.
      </div>
    </motion.div>
  );
}
