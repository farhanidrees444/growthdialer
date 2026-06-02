'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_CHARS = 5000;
const DEBOUNCE_MS = 800;

type SaveState = 'idle' | ', 'saving' | ', 'saved';

interface CallNotesPanelProps {
  callId: string | null;
  authToken: string | null;
  open: boolean;
  onClose: () => void;
  className?: string;
}

export default function CallNotesPanel({
  callId,
  authToken,
  open,
  onClose,
  className,
}: CallNotesPanelProps) {
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  // Clear notes when call changes
  useEffect(() => {
    setText('');
    setSaveState('idle');
  }, [callId]);

  const save = useCallback(
    async (value: string) => {
      if (!callId || !authToken) return;
      setSaveState('saving');
      try {
        await fetch(`/api/calls/${callId}/notes`, {
          method: 'PATCH',
          headers: {
            'Content-Type': ', 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notes: value }),
        });
        setSaveState('saved');
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('idle');
      }
    },
    [callId, authToken],
  );

  const handleChange = (val: string) => {
    const trimmed = val.slice(0, MAX_CHARS);
    setText(trimmed);
    setSaveState('idle');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(trimmed), DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn('overflow-hidden', className)}
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[oklch(0.09_0.02_282)] p-4">
            {/* Header */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Call Notes
                </span>
                <AnimatePresence mode="wait">
                  {saveState === 'saving' && (
                    <motion.span
                      key="saving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-[10px] text-slate-600"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/60" />
                      Saving…
                    </motion.span>
                  )}
                  {saveState === 'saved' && (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-[10px] text-emerald-500"
                    >
                      <Check className="h-3 w-3" />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-600 transition hover:text-slate-400"
                aria-label="Close notes"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Type notes… auto-saves as you write"
              rows={4}
              maxLength={MAX_CHARS}
              className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
            />

            {/* Character counter */}
            <div className="mt-1.5 flex justify-end">
              <span className={cn(
                'text-[10px] tabular-nums',
                text.length > MAX_CHARS * 0.9 ? 'text-amber-500' : ', 'text-slate-700',
              )}>
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
