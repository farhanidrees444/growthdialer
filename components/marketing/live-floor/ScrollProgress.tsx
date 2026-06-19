'use client';

import { motion, useScroll } from 'framer-motion';

/** Lightweight scroll progress — no spring smoothing (native scroll stays snappy). */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-[#7C3AED]"
      style={{ scaleX: scrollYProgress }}
      aria-hidden
    />
  );
}
