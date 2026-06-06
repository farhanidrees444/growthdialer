'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, Zap, Shield } from 'lucide-react';

interface ParallelDialConfigModalProps {
  open: boolean;
  queueCount: number;
  onClose: () => void;
  onStart: (config: { lines_count: number; amd_enabled: boolean }) => void;
}

const LINE_PRESETS = [2, 3, 4, 5, 6, 8, 10] as const;

export function ParallelDialConfigModal({
  open,
  queueCount,
  onClose,
  onStart,
}: ParallelDialConfigModalProps) {
  const [lines, setLines] = useState(4);
  const [amd, setAmd] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/[0.10] bg-zinc-900 shadow-2xl overflow-hidden"
          >
            <div className="border-b border-white/[0.06] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                  <Grid3x3 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white">Parallel Dial</h2>
                  <p className="text-sm text-zinc-500">Dial up to 10 lines — first connect wins</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-5">
              <div>
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Simultaneous lines
                </label>
                <div className="flex flex-wrap gap-2">
                  {LINE_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLines(n)}
                      className={`min-h-10 min-w-12 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                        lines === n
                          ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                          : 'border-white/[0.08] text-zinc-400 hover:border-white/[0.15] hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-600">
                  {queueCount} leads in queue · next batch uses up to {Math.min(lines, queueCount)} leads
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <input
                  type="checkbox"
                  checked={amd}
                  onChange={(e) => setAmd(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    Answering machine detection
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Telnyx AMD flags machine answers so you focus on live connects.
                  </p>
                </div>
              </label>

              <ul className="space-y-2 text-xs text-zinc-500">
                <li className="flex gap-2"><Zap className="h-3.5 w-3.5 shrink-0 text-violet-400" /> Non-winners auto-hang when someone answers</li>
                <li className="flex gap-2"><Zap className="h-3.5 w-3.5 shrink-0 text-violet-400" /> AI brief + disposition flow same as power dial</li>
                <li className="flex gap-2"><Zap className="h-3.5 w-3.5 shrink-0 text-violet-400" /> Up to 10 lines — more than PhoneBurner&apos;s typical 4</li>
              </ul>
            </div>

            <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-11 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={queueCount === 0}
                onClick={() => {
                  onStart({ lines_count: lines, amd_enabled: amd });
                  onClose();
                }}
                className="flex-[2] min-h-11 rounded-xl text-sm font-semibold text-white gradient-brand disabled:opacity-40"
              >
                Launch parallel session
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
