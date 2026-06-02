'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DISPOSITION_LABELS, type DispositionType } from '@/lib/dialer/state-machine';
import type { LeadRecord } from '@/lib/dialer/state-machine';

interface DispositionModalProps {
  open: boolean;
  lead: LeadRecord | null;
  callDuration: number;
  onSave: (disposition: DispositionType, notes?: string, callbackAt?: string, meetingAt?: string) => void;
  onClose: () => void;
}

const ORDERED: DispositionType[] = [
  'interested'meeting_booked'callback',
  'voicemail'gatekeeper'not_interested',
  'wrong_number'dnc',
];

const COLOR_CLASS: Record<string, string> = {
  positive: 'border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10',
  neutral:  'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]',
  negative: 'border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10',
};

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(20');
  const s = (seconds % 60).toString().padStart(20');
  return `${m}:${s}`;
}

function getLastNoteLines(notes: string | undefined, maxLines = 3): string | null {
  if (!notes?.trim()) return null;
  const lines = notes.trim().split('\n').filter(Boolean);
  return lines.slice(-maxLines).join('\n');
}

export function DispositionModal({ open, lead, callDuration, onSave, onClose }: DispositionModalProps) {
  const [selected, setSelected] = useState<DispositionType | null>(null);
  const [notes, setNotes] = useState('');
  const [showCallback, setShowCallback] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [callbackAt, setCallbackAt] = useState('');
  const [meetingAt, setMeetingAt] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setNotes('');
      setShowCallback(false);
      setShowMeeting(false);
      setCallbackAt('');
      setMeetingAt('');
    }
  }, [open]);

  const handleSelect = useCallback((disp: DispositionType) => {
    setSelected(disp);
    setShowCallback(disp === 'callback');
    setShowMeeting(disp === 'meeting_booked');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSave(selected, notes || undefined, callbackAt || undefined, meetingAt || undefined);
  }, [selected, notes, callbackAt, meetingAt, onSave]);

  // Hotkey: 1-8 + Enter
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === ', 'TEXTAREA') return;
      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= 8) {
        e.preventDefault();
        handleSelect(ORDERED[digit - 1]);
      }
      if (e.key === 'Enter' && selected) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selected, handleSelect, handleSubmit]);

  const recentNote = getLastNoteLines(lead?.notes ?? undefined);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[480px] bg-zinc-900/95 border-white/10 text-white p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-medium">How did the call go?</h2>
            {lead && (
              <p className="text-xs text-white/40 mt-0.5">
                {lead.name} · {fmt(callDuration)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disposition grid */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ORDERED.map((disp) => {
            const info = DISPOSITION_LABELS[disp];
            const isSelected = selected === disp;
            return (
              <motion.button
                key={disp}
                onClick={() => handleSelect(disp)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[64px] ${
                  isSelected
                    ? 'border-cyan-500/60 bg-cyan-500/10'
                    : COLOR_CLASS[info.color]
                }`}
                aria-pressed={isSelected}
                aria-label={info.label}
              >
                <span className="text-xl leading-none">{info.icon}</span>
                <span className="text-[11px] text-white/80 leading-tight">{info.label}</span>
                <kbd className="absolute top-1 right-1 text-[9px] text-white/30 font-mono hidden sm:block">{info.hotkey}</kbd>
              </motion.button>
            );
          })}
        </div>

        {/* Callback date picker */}
        <AnimatePresence>
          {showCallback && (
            <motion.div
              key="callback"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 overflow-hidden"
            >
              <div className="pb-4 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white/80">Schedule callback</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { label: 'In 1 hour', value: () => new Date(Date.now() + 3600000).toISOString() },
                    { label: 'Tomorrow 10am', value: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d.toISOString(); } },
                    { label: 'Next Monday', value: () => { const d = new Date(); const day = d.getDay(); const diff = (8 - day) % 7 || 7; d.setDate(d.getDate() + diff); d.setHours(10, 0, 0, 0); return d.toISOString(); } },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setCallbackAt(opt.value())}
                      className="flex h-9 items-center px-3 text-xs rounded-lg bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] text-white/70 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={callbackAt ? new Date(callbackAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setCallbackAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meeting date picker */}
        <AnimatePresence>
          {showMeeting && (
            <motion.div
              key="meeting"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 overflow-hidden"
            >
              <div className="pb-4 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/80">Meeting date &amp; time</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { label: 'Tomorrow 10am', value: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d.toISOString(); } },
                    { label: 'Tomorrow 2pm', value: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); return d.toISOString(); } },
                    { label: 'Next Monday', value: () => { const d = new Date(); const day = d.getDay(); const diff = (8 - day) % 7 || 7; d.setDate(d.getDate() + diff); d.setHours(10, 0, 0, 0); return d.toISOString(); } },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setMeetingAt(opt.value())}
                      className={`flex h-9 items-center px-3 text-xs rounded-lg border transition-colors ${
                        meetingAt && new Date(meetingAt).toISOString().slice(0,16) === new Date(opt.value()).toISOString().slice(0,16)
                          ? 'bg-green-500/20 border-green-500/40 text-green-400'
                          : 'bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.10] text-white/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={meetingAt ? new Date(meetingAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setMeetingAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes + recent context */}
        <div className="px-5 pb-4">
          {recentNote && (
            <div className="mb-2 flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <FileText className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-white/40 leading-relaxed whitespace-pre-line line-clamp-3">{recentNote}</p>
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Submit */}
        <div className="px-5 pb-5">
          <motion.button
            onClick={handleSubmit}
            disabled={!selected}
            whileHover={selected ? { scale: 1.01 } : {}}
            whileTap={selected ? { scale: 0.99 } : {}}
            className="w-full h-11 rounded-lg font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
            style={selected ? { background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(186,100%,42%))'' } : { background: 'rgba(255,255,255,0.05)' }}
          >
            {selected ? `Save · ${DISPOSITION_LABELS[selected].label}` : 'Select a disposition'}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
