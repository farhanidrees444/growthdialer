'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

function parseNumeric(value: string): { num: number; suffix: string; prefix: string; decimals: number } | null {
  const match = value.trim().match(/^([^0-9.-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const prefix = match[1] ?? '';
  const raw = match[2].replace(/,/g, '');
  const suffix = match[3] ?? '';
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return null;
  const decimals = raw.includes('.') ? raw.split('.')[1]?.length ?? 0 : 0;
  return { num, suffix, prefix, decimals };
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
  duration = 0.9,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => String(value));
  const prevRef = useRef(value);

  useEffect(() => {
    const to = value;
    const from = prevRef.current;
    prevRef.current = value;

    if (reduce || from === to) {
      setDisplay(`${prefix}${to.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setDisplay(
        `${prefix}${current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, decimals, suffix, prefix, duration, reduce]);

  return <span className={className ?? 'tabular-nums'}>{display}</span>;
}

/** Count-up for string KPI values (e.g. "1,234" or "42.5%") */
export function AnimatedKpiValue({ value, className }: { value: string; className?: string }) {
  const parsed = parseNumeric(value);
  if (!parsed) {
    return <span className={className ?? 'tabular-nums'}>{value}</span>;
  }
  return (
    <AnimatedNumber
      value={parsed.num}
      decimals={parsed.decimals}
      prefix={parsed.prefix}
      suffix={parsed.suffix}
      className={className}
    />
  );
}
