'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMounted } from '@/hooks/use-mounted';

interface SpotlightProps {
  /** Glow color — violet by default, cyan on live/active cards */
  color?: string;
  /** Diameter of the soft radial highlight in px */
  size?: number;
  /** Override the border radius to match the host card */
  radiusClass?: string;
}

/**
 * Cursor-aware spotlight glow. Drop as the first child of any `relative`
 * glass card; it attaches to its parent, tracks the cursor and paints a
 * subtle radial highlight clipped to the card's rounded shape.
 * pointer-events-none and reduced-motion safe.
 */
export function Spotlight({ color = '#8B5CF6', size = 380, radiusClass = 'rounded-2xl' }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const mounted = useMounted();
  const reduce = mounted && prefersReduced;
  const [p, setP] = useState({ x: 0, y: 0, on: false });

  useEffect(() => {
    if (reduce) return;
    const el = ref.current?.parentElement;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setP({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
    };
    const leave = () => setP((s) => ({ ...s, on: false }));
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${radiusClass} transition-opacity duration-500`}
      style={{
        // Sits above the card surface but below content (cards establish a
        // stacking context via backdrop-blur). The element's own border-radius
        // clips the gradient, so no parent overflow-hidden is required.
        zIndex: -1,
        opacity: p.on ? 1 : 0,
        // ~8% center alpha, fading to transparent — subtle, refined, not bright
        background: `radial-gradient(${size}px circle at ${p.x}px ${p.y}px, ${color}14, transparent 65%)`,
      }}
    />
  );
}
