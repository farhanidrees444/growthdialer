'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useCallAudio } from '@/hooks/use-call-audio';
import { cn } from '@/lib/utils';

interface CallWaveformProps {
  active: boolean;
  barCount?: number;
  className?: string;
  barClassName?: string;
}

/** Real remote-audio amplitude via Web Audio API, with smooth synthetic fallback. */
export function CallWaveform({ active, barCount = 20, className, barClassName }: CallWaveformProps) {
  const reduce = useReducedMotion();
  const { bars } = useCallAudio(active && !reduce);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !active) return;
    const el = containerRef.current;
    if (!el) return;
    const children = el.querySelectorAll<HTMLElement>('[data-bar]');
    children.forEach((bar, i) => {
      const h = bars[i] ?? bars[i % bars.length] ?? 4;
      const scale = Math.max(0.12, Math.min(1, h / 60));
      bar.style.transform = `scaleY(${scale.toFixed(3)})`;
    });
  }, [bars, active, reduce]);

  return (
    <div
      ref={containerRef}
      className={cn('flex items-end gap-[2px] h-5', className)}
      aria-hidden
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          data-bar
          className={cn(
            'w-[3px] origin-bottom rounded-full bg-gradient-to-t from-[#8B5CF6] to-[#06B6D4] transition-transform duration-75',
            barClassName,
          )}
          style={{ height: '100%', transform: reduce ? 'scaleY(0.25)' : 'scaleY(0.12)' }}
        />
      ))}
    </div>
  );
}
