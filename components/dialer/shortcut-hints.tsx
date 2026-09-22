'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Keyboard } from 'lucide-react';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

interface ShortcutHintsProps {
  /** True while a call is live/ringing/connecting. */
  isLive: boolean;
  /** True while a power-dial session is running. */
  powerActive?: boolean;
  onOpenShortcuts: () => void;
}

const IDLE_HINTS = [
  { key: 'Space', label: 'Call' },
  { key: 'D', label: 'Dialpad' },
  { key: '/', label: 'Search' },
  { key: 'P', label: 'Power dial' },
];

const LIVE_HINTS = [
  { key: 'M', label: 'Mute' },
  { key: 'O', label: 'Hold' },
  { key: 'V', label: 'Voicemail' },
  { key: 'K', label: 'Keypad' },
  { key: 'Space', label: 'End' },
];

/**
 * Mission-control shortcut rail — contextual hints that follow the exact
 * shortcuts wired in useDialerHotkeys. Passive display only; no behavior.
 */
export function ShortcutHints({ isLive, powerActive = false, onOpenShortcuts }: ShortcutHintsProps) {
  const reduce = useReducedMotion();
  const { isDark } = useSiteTheme();
  const hints = isLive ? LIVE_HINTS : IDLE_HINTS;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isLive ? 'live' : 'idle'}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: 6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-center pb-3 lg:flex"
      >
        <div className={cn('pointer-events-auto flex items-center gap-3 rounded-full border py-1.5 pl-3 pr-1.5 backdrop-blur-xl', isDark ? 'border-white/[0.07] bg-zinc-950/70 shadow-[0_10px_36px_rgba(0,0,0,0.45)]' : 'border-zinc-950/[0.08] bg-white/90 shadow-[0_10px_36px_rgba(9,9,11,0.12)]')} role="note" aria-label="Keyboard shortcut hints">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500" aria-hidden>
            <Keyboard className="h-3 w-3" />
            Keys
          </span>
          <span className={cn('h-3 w-px', isDark ? 'bg-white/[0.08]' : 'bg-zinc-950/[0.10]')} aria-hidden />
          <div className="flex items-center gap-2.5" aria-hidden>
            {hints.map((h) => (
              <span key={`${h.key}-${h.label}`} className="flex items-center gap-1.5">
                <kbd className="dash-kbd">{h.key}</kbd>
                <span className={cn('text-[11px]', isDark ? 'text-zinc-400' : 'text-zinc-500')}>{h.label}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenShortcuts}
            className={cn('dash-press rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-violet-500/40', isDark ? 'border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white' : 'border-zinc-950/[0.08] bg-white text-zinc-600 hover:text-zinc-950 shadow-sm')}
            aria-label="Open all keyboard shortcuts"
            title="All shortcuts (?)"
          >
            ?
          </button>
          {powerActive && (
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
              <span className="dash-live-dot" />
              Power session
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
