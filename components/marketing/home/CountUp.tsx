'use client';

import { useEffect, useRef, useState } from 'react';
import { useMarketingMotionReduced } from '@/components/marketing/live-floor/motion';

interface CountUpProps {
  to: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

/**
 * Shows the final value on first paint (SSR + before scroll) so stats never read as "0".
 * Count-up animation runs once when scrolled into view — enhancement only.
 */
export function CountUp({ to, from = 0, prefix = '', suffix = '', duration = 1.4 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useMarketingMotionReduced();
  const displayTo = Math.max(0, to);
  const displayFrom = Math.max(0, from);
  const [n, setN] = useState(displayTo);
  const animatedRef = useRef(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4, rootMargin: '-10%' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setN(displayTo);
  }, [displayTo]);

  useEffect(() => {
    if (!inView || animatedRef.current) return;
    animatedRef.current = true;

    if (reduce) {
      setN(displayTo);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const animationMs = Math.max(1, duration * 1000);
    setN(displayFrom);

    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / animationMs));
      const eased = Math.min(1, Math.max(0, 1 - Math.pow(1 - p, 3)));
      const next = displayFrom + (displayTo - displayFrom) * eased;
      setN(Math.max(0, Math.round(next)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(displayTo);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, displayTo, displayFrom, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {prefix}{n}{suffix}
    </span>
  );
}
