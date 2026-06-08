'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { MilestoneKind } from '@/lib/ui/milestone-events';
import { SPRING } from '@/lib/ui/premium-motion';

const LABELS: Record<MilestoneKind, { title: string; emoji: string }> = {
  meeting_booked: { title: 'Meeting booked', emoji: '🎯' },
  first_call_today: { title: 'First call of the day', emoji: '☀️' },
  connect_streak: { title: 'Connect streak', emoji: '🔥' },
};

function ConfettiBurst({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  if (reduce || !active) return null;

  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 280,
    y: -40 - Math.random() * 80,
    rot: Math.random() * 360,
    color: i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#06B6D4' : '#a78bfa',
    delay: Math.random() * 0.15,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, rotate: p.rot }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 h-1.5 w-1 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

export function MilestoneCelebration() {
  const [active, setActive] = useState<{ kind: MilestoneKind; id: number } | null>(null);
  const reduce = useReducedMotion();

  const dismiss = useCallback(() => setActive(null), []);

  useEffect(() => {
    const handler = (e: Event) => {
      const kind = (e as CustomEvent<{ kind: MilestoneKind }>).detail?.kind;
      if (!kind) return;
      setActive({ kind, id: Date.now() });
      const t = setTimeout(dismiss, reduce ? 1200 : 2600);
      return () => clearTimeout(t);
    };
    window.addEventListener('gd:milestone', handler);
    return () => window.removeEventListener('gd:milestone', handler);
  }, [dismiss, reduce]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(dismiss, reduce ? 1200 : 2600);
    return () => clearTimeout(t);
  }, [active, dismiss, reduce]);

  const meta = active ? LABELS[active.kind] : null;

  return (
    <AnimatePresence>
      {active && meta && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={SPRING}
          className="fixed bottom-24 left-1/2 z-[var(--z-milestone)] -translate-x-1/2 sm:bottom-[calc(2rem+var(--gd-dock-call-height,0px))]"
          role="status"
          aria-live="polite"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[oklch(0.09_0.006_285)]/95 px-5 py-3.5 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
            <ConfettiBurst active />
            <div className="relative flex items-center gap-3">
              <motion.span
                animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5 }}
                className="text-lg"
                aria-hidden
              >
                {meta.emoji}
              </motion.span>
              <div>
                <p className="text-sm font-semibold text-white">{meta.title}</p>
                <p className="text-[11px] text-slate-500">Nice work — keep the momentum.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
