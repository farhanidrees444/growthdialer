'use client';

import { LottieHero } from '@/components/ui/lottie-hero';

/** Subtle loading animation during integration handshake */
export function IntegrationConnectLottie({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <LottieHero
      className={className}
      src="/lottie/dial-pulse.json"
      fallback={
        <div className="h-full w-full animate-pulse rounded-full bg-zinc-800" />
      }
    />
  );
}
