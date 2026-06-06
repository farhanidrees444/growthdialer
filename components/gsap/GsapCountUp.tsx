'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface GsapCountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

/**
 * Counts up to `value` when the element scrolls into view.
 * Uses transform-friendly GSAP tweens and honors prefers-reduced-motion.
 */
export function GsapCountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  duration = 1,
}: GsapCountUpProps) {
  const elRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = elRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      const format = (n: number) =>
        `${prefix}${n.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`;

      mm.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const reduceMotion = Boolean(context.conditions?.reduceMotion);
          const counter = { val: reduceMotion ? value : 0 };

          el.textContent = format(counter.val);

          if (reduceMotion) return;

          gsap.to(counter, {
            val: value,
            duration,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              once: true,
            },
            onUpdate: () => {
              el.textContent = format(counter.val);
            },
          });
        },
      );

      return () => mm.revert();
    },
    { scope: elRef, dependencies: [value, decimals, prefix, suffix, duration] },
  );

  return (
    <span ref={elRef} className={className ?? 'tabular-nums'}>
      {formatValue(0, decimals, prefix, suffix)}
    </span>
  );
}

function formatValue(
  n: number,
  decimals: number,
  prefix: string,
  suffix: string,
): string {
  return `${prefix}${n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}
