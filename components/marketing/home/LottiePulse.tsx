'use client';

import dynamic from 'next/dynamic';
import { useMarketingMotionReduced } from '@/components/marketing/live-floor/motion';
import animationData from './pulse.json';

// Client-only — avoids SSR entirely so static generation never touches it.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

/**
 * A subtle Lottie "pulse ring" used as an accent behind live indicators.
 * Purely decorative and guarded: if it renders nothing, the surrounding
 * Framer/Tailwind motion still carries the section.
 */
export function LottiePulse({ size = 64, className = '' }: { size?: number; className?: string }) {
  const reduce = useMarketingMotionReduced();
  if (reduce) return null;
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: size, height: size }} aria-hidden>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Lottie animationData={animationData as any} loop autoplay style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
