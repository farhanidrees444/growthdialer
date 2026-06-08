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

/**
 * Shows the final value on first paint (SSR + before scroll) so stats never read as "0".
 * Count-up animation runs once when scrolled into view — enhancement only.
 */
export function CountUp({ to, prefix = '', suffix = '', duration = 1.4 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, MARKETING_IN_VIEW);
  const reduce = useMarketingMotionReduced();
  const [n, setN] = useState(to);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!inView || animatedRef.current) return;
    animatedRef.current = true;

    if (reduce) {
      setN(to);
      return;
    }

    let raf = 0;
    const start = performance.now();
    setN(0);

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(to);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {prefix}{n}{suffix}
    </span>
  );
}
