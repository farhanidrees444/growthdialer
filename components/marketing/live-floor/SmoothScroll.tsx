'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Buttery smooth scroll for all marketing routes.
 * Drives native scroll position so sticky + Framer useScroll stay in sync.
 * Dispatches scroll events so useInView / IntersectionObserver update during
 * Lenis wheel smoothing on desktop (touch scroll on mobile is already native).
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on('scroll', () => {
      window.dispatchEvent(new Event('scroll'));
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
