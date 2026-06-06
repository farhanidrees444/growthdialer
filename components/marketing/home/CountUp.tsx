'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { MARKETING_IN_VIEW, useMarketingMotionReduced } from '@/components/marketing/live-floor/motion';

interface CountUpProps {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

/** Counts up to `to` when scrolled into view. Reduced-motion shows the final value instantly. */
export function CountUp({ to, prefix = '', suffix = '', duration = 1.4 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, MARKETING_IN_VIEW);
  const reduce = useMarketingMotionReduced();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setN(to); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{n}{suffix}
    </span>
  );
}
