'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useCallAudio } from '@/hooks/use-call-audio';

interface CallerWaveformProps {
  active: boolean;
}

export function CallerWaveform({ active }: CallerWaveformProps) {
  const { bars } = useCallAudio(active);
  const reduce = useReducedMotion();

  return (
    <div
      className="relative flex w-full items-end justify-center gap-[3px] rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3"
      style={{ height: 88 }}
      aria-label="Audio waveform"
    >
      {active && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-violet-500/10 to-transparent"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="relative flex-1 rounded-full"
          animate={{
            height: Math.max(4, height),
            opacity: active ? 0.9 : 0.25,
          }}
          transition={reduce ? { duration: 0 } : { duration: 0.08, ease: 'easeOut' }}
          style={{
            minWidth: 3,
            transformOrigin: 'bottom center',
            background: active
              ? 'linear-gradient(to top, #7C3AED, #06B6D4)'
              : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}
