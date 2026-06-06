'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Centralizes Framer Motion config for the homepage.
 *
 * IMPORTANT: reducedMotion is "never" (not "user") on purpose. Using "user"
 * globally auto-reduced EVERY animation — including one-shot entrance and
 * scroll-reveal animations — to instant on any device whose OS reports
 * `prefers-reduced-motion: reduce` (common on desktop/laptop). That made the
 * hero and below-fold sections appear frozen on desktop while mobile (no such
 * OS setting) animated. Entrance/reveal animations now run on every viewport.
 *
 * Accessibility is preserved where it matters: the continuous / infinite-loop
 * animations (waveform, marquee, pulses, tickers, cursor spotlight) each call
 * `useMarketingMotionReduced()` directly and disable themselves for users who request
 * reduced motion — independent of this prop.
 */
export function MotionShell({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
