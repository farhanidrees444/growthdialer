// Shared motion language for the Live Floor homepage.
// Weighted ease-out — deliberate, never bouncy or default-linear.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

/** Reliable in-view detection with Lenis smooth scroll (desktop wheel). */
export const MARKETING_IN_VIEW = {
  once: true,
  amount: 0.12,
  margin: '0px 0px -40px 0px',
} as const;

/**
 * Marketing pages always run entrance/scroll motion so desktop matches mobile.
 * OS `prefers-reduced-motion` is ignored on `.marketing-site` (see globals.css).
 * Use Framer's `useReducedMotion` only for optional dashboard/ambient loops.
 */
export function useMarketingMotionReduced() {
  return false;
}

// Staggered reveal on scroll into view
export const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};

export const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
