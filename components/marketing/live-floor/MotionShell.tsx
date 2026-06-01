'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Wraps the homepage so every Framer Motion animation respects the user's
 * OS "reduce motion" setting (reducedMotion="user"). Heavy transform/scroll
 * motion is reduced automatically; opacity reveals stay gentle.
 */
export function MotionShell({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
