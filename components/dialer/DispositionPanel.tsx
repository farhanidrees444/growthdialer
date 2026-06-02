'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, PhoneMissed, XCircle, VoicemailIcon } from 'lucide-react';

interface DispositionPanelProps {
  notes: string;
  onSaveNotes: (value: string) => void;
  onDisposition: (disp: string, localNotes: string, callbackAt?: string) => Promise<void>;
}

export default function DispositionPanel({ notes, onSaveNotes, onDisposition }: DispositionPanelProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [showCallback, setShowCallback] = useState(false);
  const [callbackAt, setCallbackAt] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleDisp = async (disp: string, cbAt?: string) => {
    if (submitting) return;
    if (disp === 'Meeting Booked') setCelebrated(true);
    setSubmitting(disp);
    try {
      await onDisposition(disp, localNotes, cbAt);
    } finally {
      setSubmitting(null);
      setCelebrated(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Call Outcome</p>
        <span className="text-[10px] text-slate-500">Select disposition to advance →</span>
      </div>

      {/* Notes */}
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        onBlur={() => { if (localNotes !== notes) onSaveNotes(localNotes); }}
        rows={3}
        placeholder="Add call notes, objections, next steps…"
        className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30"
      />

      {/* Disposition buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {/* Not Interested */}
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleDisp('Not Interested')}
          className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4 shrink-0" />
          Not Interested
        </button>

        {/* Callback */}
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => setShowCallback((v) => !v)}
          className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
            showCallback
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
              : 'border-amber-500/30 bg-amber-500/[0.08] text-amber-300 hover:bg-amber-500/15'
          }`}
        >
          <CalendarClock className="h-4 w-4 shrink-0" />
          Callback
        </button>

        {/* Meeting Booked — most prominent */}
        <motion.button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleDisp('Meeting Booked')}
          animate={celebrated ? { scale: [1, 1.07, 0.97, 1.03, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 sm:col-span-1"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {submitting === 'Meeting Booked' ? ', 'Saving…' : ', 'Meeting Booked'}
        </motion.button>

        {/* Wrong Number */}
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleDisp('Wrong Number')}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-200 disabled:opacity-50"
        >
          <PhoneMissed className="h-4 w-4 shrink-0" />
          Wrong Number
        </button>

        {/* Voicemail */}
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleDisp('Voicemail')}
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/[0.08] px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15 disabled:opacity-50"
        >
          <VoicemailIcon className="h-4 w-4 shrink-0" />
          Voicemail
        </button>
      </div>

      {/* Callback datetime picker */}
      {showCallback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3"
        >
          <CalendarClock className="h-4 w-4 shrink-0 text-amber-400" />
          <input
            type="datetime-local"
            value={callbackAt}
            onChange={(e) => setCallbackAt(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none"
          />
          <button
            type="button"
            onClick={() => { if (callbackAt) handleDisp('Callback', callbackAt); }}
            disabled={!callbackAt || submitting !== null}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting === 'Callback' ? '…' : ', 'Set'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
