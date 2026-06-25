'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock3, FileText, Sparkles, X, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { useWorkspaceDispositions } from '@/hooks/use-workspace-dispositions';
import type { WorkspaceDispositionDef } from '@/lib/dispositions/defaults';
import { emitMilestoneFromDisposition } from '@/lib/ui/milestone-events';
import { playDispositionClick } from '@/lib/ui/sound-preferences';
import { cn } from '@/lib/utils';

interface DispositionModalProps {
  open: boolean;
  lead: LeadRecord | null;
  callDuration: number;
  onSave: (disposition: string, notes?: string, callbackAt?: string, meetingAt?: string) => void;
  onClose: () => void;
}

const COLOR_CLASS: Record<string, string> = {
  positive: 'border-emerald-400/25 bg-emerald-400/[0.055] text-emerald-100 hover:border-emerald-300/55 hover:bg-emerald-400/[0.11]',
  neutral:  'border-cyan-300/20 bg-cyan-300/[0.045] text-cyan-100 hover:border-cyan-300/45 hover:bg-cyan-300/[0.09]',
  negative: 'border-rose-400/20 bg-rose-400/[0.045] text-rose-100 hover:border-rose-300/45 hover:bg-rose-400/[0.09]',
};

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getLastNoteLines(notes: string | undefined, maxLines = 3): string | null {
  if (!notes?.trim()) return null;
  const lines = notes.trim().split('\n').filter(Boolean);
  return lines.slice(-maxLines).join('\n');
}

export function DispositionModal({ open, lead, callDuration, onSave, onClose }: DispositionModalProps) {
  const { dispositions } = useWorkspaceDispositions();
  const [selected, setSelected] = useState<string | null>(null);
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

  const handleSelect = useCallback((disp: WorkspaceDispositionDef) => {
    setSelected(disp.key);
    setShowCallback(disp.triggers_callback);
    setShowMeeting(disp.triggers_meeting);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    emitMilestoneFromDisposition(selected);
    playDispositionClick();
    onSave(selected, notes || undefined, callbackAt || undefined, meetingAt || undefined);
  }, [selected, notes, callbackAt, meetingAt, onSave]);

  // Hotkey: 1-8 + Enter
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const digit = parseInt(e.key, 10);
      const byHotkey = dispositions.find((d) => d.hotkey === digit);
      if (byHotkey) {
        e.preventDefault();
        handleSelect(byHotkey);
      }
      if (e.key === 'Enter' && selected) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selected, handleSelect, handleSubmit, dispositions]);

  const recentNote = getLastNoteLines(lead?.notes ?? undefined);
  const selectedDisposition = dispositions.find((d) => d.key === selected);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100svh-1.5rem)] w-[calc(100vw-1rem)] max-w-[540px] overflow-hidden rounded-[30px] border border-white/[0.12] bg-slate-950/90 p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.78)] backdrop-blur-2xl sm:w-[calc(100vw-2rem)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)_42%,rgba(16,185,129,0.05))]" />
        <div className="pointer-events-none absolute inset-px rounded-[29px] border border-white/[0.06]" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-violet-100/80">
              <Sparkles className="h-3 w-3 text-cyan-200" />
              Call wrap-up
            </div>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-[28px]">How did the call go?</h2>
            {lead && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-300/80">
                <span className="truncate font-medium text-white/90">{lead.name}</span>
                <span className="hidden h-1 w-1 rounded-full bg-cyan-300/60 sm:inline-block" />
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-200/80" />
                  {fmt(callDuration)}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/55 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disposition grid */}
        <div className="relative grid grid-cols-2 gap-2.5 px-5 pb-4 sm:grid-cols-4 sm:px-6">
          {dispositions.map((disp) => {
            const isSelected = selected === disp.key;
            return (
              <motion.button
                key={disp.key}
                onClick={() => handleSelect(disp)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'group relative flex min-h-[82px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                  COLOR_CLASS[disp.category],
                  isSelected && 'border-cyan-200/70 bg-gradient-to-br from-violet-500/24 via-cyan-400/16 to-emerald-400/14 text-white ring-2 ring-cyan-200/40 shadow-[0_14px_38px_rgba(34,211,238,0.16)]',
                )}
                aria-pressed={isSelected}
                aria-label={disp.label}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_55%)]" />
                {isSelected && <CheckCircle2 className="absolute right-2 top-2 h-3.5 w-3.5 text-cyan-100" />}
                <span className="relative text-2xl leading-none drop-shadow">{disp.emoji}</span>
                <span className="relative text-[11px] font-semibold leading-tight text-current">{disp.label}</span>
                {disp.hotkey && (
                  <kbd className="absolute left-2 top-2 hidden rounded-md border border-white/[0.08] bg-black/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/35 sm:block">{disp.hotkey}</kbd>
                )}
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
              className="relative overflow-hidden px-5 sm:px-6"
            >
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-cyan-200" />
                  <span className="text-sm font-semibold text-cyan-50">Schedule callback</span>
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
                      className="flex h-9 items-center rounded-xl border border-white/[0.10] bg-white/[0.07] px-3 text-xs font-semibold text-white/75 transition hover:border-cyan-200/30 hover:bg-white/[0.12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={callbackAt ? new Date(callbackAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setCallbackAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full rounded-xl border border-white/[0.10] bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
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
              className="relative overflow-hidden px-5 sm:px-6"
            >
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-emerald-200" />
                  <span className="text-sm font-semibold text-emerald-50">Meeting date &amp; time</span>
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
                      className={`flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 ${
                        meetingAt && new Date(meetingAt).toISOString().slice(0,16) === new Date(opt.value()).toISOString().slice(0,16)
                          ? 'border-emerald-300/45 bg-emerald-400/20 text-emerald-100'
                          : 'border-white/[0.10] bg-white/[0.07] text-white/75 hover:border-emerald-200/30 hover:bg-white/[0.12] hover:text-white'
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
                  className="w-full rounded-xl border border-white/[0.10] bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes + recent context */}
        <div className="relative px-5 pb-4 pt-1 sm:px-6">
          {recentNote && (
            <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3">
              <FileText className="w-3.5 h-3.5 text-cyan-200/70 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-3 whitespace-pre-line text-[11px] leading-relaxed text-slate-300/65">{recentNote}</p>
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add the recap, objections, next steps, or context for the next touch..."
            rows={2}
            className="w-full resize-none rounded-2xl border border-white/[0.10] bg-black/25 px-4 py-3 text-sm leading-relaxed text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20"
          />
        </div>

        {/* Submit */}
        <div className="relative border-t border-white/[0.07] bg-black/15 px-5 py-4 sm:px-6">
          <motion.button
            onClick={handleSubmit}
            disabled={!selected}
            whileHover={selected ? { scale: 1.01 } : {}}
            whileTap={selected ? { scale: 0.99 } : {}}
            className="h-12 w-full rounded-2xl text-sm font-bold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/75 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
            style={selected ? { background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 48%, #34D399 100%)', boxShadow: '0 18px 42px rgba(34,211,238,0.22)' } : { background: 'rgba(255,255,255,0.065)' }}
          >
            {selected ? `Save wrap-up · ${selectedDisposition?.label ?? selected}` : 'Select an outcome to save'}
          </motion.button>
          <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Press 1-8 to select · Enter to save
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
