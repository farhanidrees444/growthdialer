'use client';

import dynamic from 'next/dynamic';
import { useMarketingMotionReduced } from './motion';

const HeroWebGLScene = dynamic(() => import('./HeroWebGLScene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Subtle 3D waveform bars behind the homepage hero.
 * Lazy-loaded; skipped when the user prefers reduced motion.
 */
export function HeroWebGL() {
  const reduce = useMarketingMotionReduced();
  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(92vh,920px)] overflow-hidden opacity-80"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08080A]/20 to-[#08080A]" />
      <HeroWebGLScene />
    </div>
  );
}
