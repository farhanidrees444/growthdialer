'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function defaultCallbackTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  // datetime-local needs local ISO-ish string
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function gatekeeperRetryTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DispOption {
  key: string;
  label: string;
  emoji: string;
  shortcut: string;
  color: string;
  ring: string;
}

const DISPOSITIONS: DispOption[] = [
  { key: 'interested',     label: 'Interested',     emoji: '😊', shortcut: '1', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20', ring: 'ring-emerald-400/60' },
  { key: 'callback',       label: 'Callback',       emoji: '📅', shortcut: '2', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20', ring: 'ring-amber-400/60' },
  { key: 'meeting_booked', label: 'Meeting Booked', emoji: '🤝', shortcut: '3', color: 'border-emerald-400/60 bg-emerald-500/[0.18] text-emerald-200 hover:bg-emerald-500/25', ring: 'ring-emerald-300/70' },
  { key: 'voicemail',      label: 'Voicemail',      emoji: '🔇', shortcut: '4', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20', ring: 'ring-blue-400/60' },
  { key: 'not_interested', label: 'Not Interested', emoji: '❌', shortcut: '5', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20', ring: 'ring-rose-400/60' },
  { key: 'wrong_number',   label: 'Wrong Number',   emoji: '📞', shortcut: '6', color: 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]', ring: 'ring-white/30' },
  { key: 'gatekeeper',     label: 'Gatekeeper',     emoji: '🔁', shortcut: '7', color: 'border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20', ring: 'ring-violet-400/60' },
  { key: 'dnc',            label: 'Do Not Call',    emoji: '🚫', shortcut: '8', color: 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20', ring: 'ring-red-400/60' },
];

export interface DispositionModalProps {
  open: boolean;
  leadName: string | null;
  callDuration: number;
  notes: string;
  onSave: (disp: string, notes: string, callbackAt?: string) => Promise<void>;
  onSkip: () => void;
}

export default function DispositionModal({
  open,
  leadName,
  callDuration,
  notes: initialNotes,
  onSave,
  onSkip,
}: DispositionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState(initialNotes);
  const [showCallbackPicker, setShowCallbackPicker] = useState(false);
  const [callbackAt, setCallbackAt] = useState(defaultCallbackTime);
  const [showDNCConfirm, setShowDNCConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setLocalNotes(initialNotes);
      setShowCallbackPicker(false);
      setCallbackAt(defaultCallbackTime());
      setShowDNCConfirm(false);
      setSaving(false);
    }
  }, [open, initialNotes]);

  const handleSelect = useCallback((key: string) => {
    setSelected(key);
    setShowCallbackPicker(key === 'callback');
    setShowDNCConfirm(key === 'dnc');
  }, []);

  const handleSave = useCallback(async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      let cbAt: string | undefined;
      if (selected === 'callback' && callbackAt) cbAt = new Date(callbackAt).toISOString();
      if (selected === 'gatekeeper') cbAt = new Date(gatekeeperRetryTime()).toISOString();
      await onSave(selected, localNotes, cbAt);
    } finally {
      setSaving(false);
    }
  }, [selected, saving, callbackAt, localNotes, onSave]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < DISPOSITIONS.length) {
        e.preventDefault();
        handleSelect(DISPOSITIONS[idx].key);
      }
      if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleSelect, handleSave, onSkip]);

  const selectedDisp = DISPOSITIONS.find((d) => d.key === selected);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[oklch(0.10_0.025_282)] shadow-2xl shadow-black/70"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
                  Call Outcome
                </p>
                <h2 className="mt-1 text-lg font-bold leading-tight text-white">
                  {leadName ?? 'Unknown Lead'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Duration: {formatDuration(callDuration)}
                </p>
              </div>
              <button
                type="button"
                onClick={onSkip}
                className="mt-0.5 shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 text-slate-500 transition hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {/* 4×2 disposition grid */}
              <div className="grid grid-cols-4 gap-2">
                {DISPOSITIONS.map((d) => (
                  <motion.button
                    key={d.key}
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSelect(d.key)}
                    className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-center transition-all ${d.color} ${selected === d.key ? `ring-2 ${d.ring} scale-[1.04] shadow-lg` : ''}`}
                    aria-pressed={selected === d.key}
                  >
                    <span className="text-xl leading-none">{d.emoji}</span>
                    <span className="text-[10px] font-semibold leading-tight">{d.label}</span>
                    <span className="absolute right-1.5 top-1 font-mono text-[8px] text-white/20">{d.shortcut}</span>
                  </motion.button>
                ))}
              </div>

              {/* Callback picker */}
              <AnimatePresence>
                {showCallbackPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3">
                      <CalendarClock className="h-4 w-4 shrink-0 text-amber-400" />
                      <input
                        type="datetime-local"
                        value={callbackAt}
                        onChange={(e) => setCallbackAt(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DNC confirmation */}
              <AnimatePresence>
                {showDNCConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3">
                      <p className="text-sm font-semibold text-red-300">Add to Do Not Call list?</p>
                      <p className="mt-0.5 text-xs text-red-300/60">
                        This flags the lead and prevents future auto-dials.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                rows={2}
                placeholder="Add call notes, objections, next steps…"
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30"
              />

              {/* Action buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onSkip}
                  className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
                >
                  Skip <span className="text-slate-600">(Esc)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!selected || saving}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? 'Saving…'
                    : selected
                    ? `Save · ${selectedDisp?.label}`
                    : 'Select outcome'}
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-700">
                Press 1–8 to select · Enter to save · Esc to skip
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
