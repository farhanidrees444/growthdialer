'use client';

import { useId, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashSparklineProps {
  /** Raw values; rendered as an area sparkline. */
  data: number[];
  /** Stroke / gradient color. */
  color?: string;
  className?: string;
  /** Stroke width in px. */
  strokeWidth?: number;
  /** Accessible label for screen readers. */
  label?: string;
}

/**
 * Tiny inline SVG area sparkline — zero chart deps.
 * Draw-in animation respects prefers-reduced-motion.
 */
export function DashSparkline({
  data,
  color = '#8b5cf6',
  className,
  strokeWidth = 1.5,
  label,
}: DashSparklineProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduce = useReducedMotion();

  const { line, area } = useMemo(() => {
    const w = 120;
    const h = 36;
    const pad = 2;
    if (data.length === 0) return { line: '', area: '' };
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const span = Math.max(max - min, 1e-6);
    const pts = data.map((v, i) => {
      const x = data.length === 1 ? w / 2 : pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${(w - pad).toFixed(1)},${h} L${pad.toFixed(1)},${h} Z`;
    return { line, area };
  }, [data]);

  if (data.length === 0) {
    return <div className={cn('h-9 w-full', className)} aria-hidden />;
  }

  return (
    <svg
      viewBox="0 0 120 36"
      preserveAspectRatio="none"
      className={cn('h-9 w-full overflow-visible', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`ds-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#ds-${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(!reduce && 'dash-spark-draw')}
        style={
          !reduce
            ? {
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: 'dash-spark-draw 1.1s cubic-bezier(0.16,1,0.3,1) 0.15s forwards',
              }
            : undefined
        }
      />
    </svg>
  );
}
