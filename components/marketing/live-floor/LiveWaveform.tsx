'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface LiveWaveformProps {
  bars?: number;
  className?: string;
  /** Height of the tallest bar in px */
  height?: number;
  /** Bar color — defaults to the live cyan */
  color?: string;
  barWidth?: number;
  gap?: number;
  /** Slows/quickens the overall motion */
  speed?: number;
}

/**
 * The signature "call in progress" waveform — pulsing voice-frequency bars.
 * Pure Tailwind + Framer Motion, no images/video. This is the visual
 * language of the product and reappears across the page.
 *
 * Cyan carries meaning here: it only renders on live/active surfaces.
 */
export function LiveWaveform({
  bars = 48,
  className = '',
  height = 64,
  color = 'hsl(186, 100%, 42%)',
  barWidth = 3,
  gap = 3,
  speed = 1,
}: LiveWaveformProps) {
  const reduce = useReducedMotion();

  // Deterministic per-bar variation so it reads like real voice frequency,
  // not a uniform equalizer. A center-weighted envelope keeps it organic.
  const items = Array.from({ length: bars }, (_, i) => {
    const center = (bars - 1) / 2;
    const dist = Math.abs(i - center) / center; // 0 at center → 1 at edges
    const envelope = 1 - dist * 0.55;
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const rand = seed - Math.floor(seed);
    const min = Math.max(0.12, 0.18 * envelope);
    const max = Math.max(min + 0.1, (0.55 + rand * 0.45) * envelope);
    const dur = (0.7 + rand * 0.8) / speed;
    return { min, max, dur, delay: rand * 0.6 };
  });

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ gap, height }}
      aria-hidden
    >
      {items.map((b, i) => {
        const mid = ((b.min + b.max) / 2) * 100;
        return (
          <motion.span
            key={i}
            className="rounded-full"
            style={{
              width: barWidth,
              // Static mid-height when the user prefers reduced motion
              height: reduce ? `${mid}%` : undefined,
              background: `linear-gradient(to top, ${color}40, ${color})`,
              boxShadow: `0 0 ${barWidth * 2}px ${color}55`,
            }}
            initial={reduce ? false : { height: `${b.min * 100}%` }}
            animate={reduce ? undefined : { height: [`${b.min * 100}%`, `${b.max * 100}%`, `${b.min * 100}%`] }}
            transition={reduce ? undefined : {
              duration: b.dur,
              delay: b.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

/** A single mini-waveform glyph for inline/label use. */
export function MiniWave({ color = 'hsl(186, 100%, 42%)', className = '' }: { color?: string; className?: string }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Static heights for SSR and reduced motion
  const heights = [0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.35];
  
  return (
    <div className={`flex items-center gap-[2px] ${className}`} aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full"
          style={{ background: color, height: 14 }}
          initial={false}
          animate={{ scaleY: mounted && !reduce ? [h * 0.4, h, h * 0.4] : h }}
          transition={mounted && !reduce ? { duration: 0.8 + i * 0.07, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
        />
      ))}
    </div>
  );
}
