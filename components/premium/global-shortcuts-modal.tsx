'use client';

import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SPRING } from '@/lib/ui/premium-motion';

interface GlobalShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const GROUPS = [
  {
    label: 'Global',
    keys: [
      { keys: ['⌘', 'K'], desc: 'Command palette' },
      { keys: ['?'], desc: 'Keyboard shortcuts (this panel)' },
      { keys: ['Esc'], desc: 'Close modal / overlay' },
    ],
  },
  {
    label: 'Lists (leads, logs, recordings)',
    keys: [
      { keys: ['J'], desc: 'Next item' },
      { keys: ['K'], desc: 'Previous item' },
      { keys: ['Enter'], desc: 'Open selected' },
      { keys: ['C'], desc: 'Call selected lead' },
    ],
  },
  {
    label: 'Dialer — browse',
    keys: [
      { keys: ['↑', '↓'], desc: 'Navigate queue' },
      { keys: ['Enter'], desc: 'Select lead' },
      { keys: ['P'], desc: 'Start power dial' },
      { keys: ['/'], desc: 'Focus search' },
      { keys: ['D'], desc: 'Manual dial' },
    ],
  },
  {
    label: 'Dialer — live call',
    keys: [
      { keys: ['Space'], desc: 'End call' },
      { keys: ['M'], desc: 'Mute / unmute' },
      { keys: ['O'], desc: 'Hold / resume' },
      { keys: ['N'], desc: 'Notes' },
      { keys: ['V'], desc: 'Voicemail drop' },
      { keys: ['1–8'], desc: 'Disposition shortcut' },
    ],
  },
  {
    label: 'Active call overlay',
    keys: [
      { keys: ['M'], desc: 'Mute' },
      { keys: ['H'], desc: 'Hold' },
      { keys: ['N'], desc: 'Notes' },
      { keys: ['V'], desc: 'VM drop' },
    ],
  },
];

export function GlobalShortcutsModal({ open, onClose }: GlobalShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border border-white/[0.10] bg-[oklch(0.09_0.006_285)]/98 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mt-2 max-h-[min(70vh,480px)] space-y-5 overflow-y-auto pr-1 scrollbar-hide"
        >
          {GROUPS.map((group, gi) => (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: gi * 0.05 }}
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.keys.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/70">{item.desc}</span>
                    <div className="flex shrink-0 gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded-md border border-white/[0.12] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-white/85"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
