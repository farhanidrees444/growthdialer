'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

const DEFAULT_SRC = '/lottie/dial-pulse.json';

interface LottieHeroProps {
  className?: string;
  /** Public URL or path to Lottie JSON */
  src?: string;
  fallback?: React.ReactNode;
}

export function LottieHero({ className, src, fallback }: LottieHeroProps) {
  const [data, setData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = src ?? DEFAULT_SRC;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [src]);

  if (failed || !data) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        {fallback ?? (
          <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/10 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <Lottie
      animationData={data}
      loop
      className={cn('pointer-events-none', className)}
    />
  );
}
