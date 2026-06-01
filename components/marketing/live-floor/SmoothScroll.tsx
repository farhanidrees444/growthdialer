'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Buttery, weighted smooth scrolling — scoped to the marketing homepage only.
 * Mounted from the marketing layout for "/" exclusively, so app routes
 * (app.growthdialer.com, which use their own scroll containers) are never
 * affected. Renders nothing. Disabled entirely under prefers-reduced-motion.
 *
 * Lenis drives the real native scroll position, so `position: sticky` and
 * Framer Motion's useScroll (used by the "Life of one call" pin) stay in sync.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      // Weighted ease-out — deliberate, never linear
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
