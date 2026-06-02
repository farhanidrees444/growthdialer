'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';
import { useMounted } from '@/hooks/use-mounted';
import animationData from './pulse.json';

// Client-only — avoids SSR entirely so static generation never touches it.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

/**
 * A subtle Lottie "pulse ring" used as an accent behind live indicators.
 * Purely decorative and guarded: if it renders nothing, the surrounding
 * Framer/Tailwind motion still carries the section.
 */
export function LottiePulse({ size = 64, className = '' }: { size?: number; className?: string }) {
  const prefersReduced = useReducedMotion();
  const mounted = useMounted();
  // Always render the wrapper on the server and the first client paint so the
  // hydrated markup matches. The Lottie itself is client-only (ssr:false), and
  // reduced-motion users simply get the empty (but identically-structured) box.
  const showAnimation = mounted && !prefersReduced;
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: size, height: size }} aria-hidden>
      {showAnimation && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Lottie animationData={animationData as any} loop autoplay style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
}
