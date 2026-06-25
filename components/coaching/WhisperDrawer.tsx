'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import type { LiveCall } from './types';

const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

export function WhisperDrawer({
  call,
  onClose,
}: {
  call: LiveCall | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!call) return null;

  async function send() {
    const agentId = call?.agent_id ?? call?.user_id;
    const callId = call?.call_id ?? call?.id;
    if (!agentId || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/coaching/whisper', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, call_id: callId, message }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Whisper failed');
        return;
      }
      setMessage('');
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={SPRING}
      className="fixed bottom-4 right-4 top-20 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Whisper to {call.agent_name ?? 'agent'}</p>
          <p className="text-xs text-slate-500">Only the agent receives this coaching note.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={8}
        maxLength={1200}
        placeholder="Try: Slow down after the opener and ask one discovery question before pitching."
        className="min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#8B5CF6]/60"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !message.trim()}
          className="ml-auto flex items-center gap-2 rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </div>
    </motion.aside>
  );
}
