// Shared motion language for the Live Floor homepage.
// Weighted ease-out — deliberate, never bouncy or default-linear.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

// Staggered reveal on scroll into view
export const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};

export const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
