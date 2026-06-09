'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface KpiGhostSparklineProps {
  color: string;
  className?: string;
}

/** Animated placeholder wave when KPI has no real data yet */
export function KpiGhostSparkline({ color, className }: KpiGhostSparklineProps) {
  const reduce = useReducedMotion();
  const points = 12;
  const gradId = `ghost-${color.replace('#', '')}`;

  return (
    <div className={className} style={{ height: 32 }} aria-hidden>
      <svg viewBox="0 0 120 32" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {!reduce && (
          <motion.path
            d="M0 24 Q15 18 30 22 T60 20 T90 24 T120 18 L120 32 L0 32 Z"
            fill={`url(#${gradId})`}
            animate={{
              d: [
                'M0 24 Q15 18 30 22 T60 20 T90 24 T120 18 L120 32 L0 32 Z',
                'M0 22 Q15 26 30 20 T60 24 T90 18 T120 22 L120 32 L0 32 Z',
                'M0 24 Q15 18 30 22 T60 20 T90 24 T120 18 L120 32 L0 32 Z',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={Array.from({ length: points }, (_, i) => {
            const x = (i / (points - 1)) * 120;
            const y = 20 + Math.sin(i * 0.9) * 4;
            return `${x},${y}`;
          }).join(' ')}
          animate={
            reduce
              ? {}
              : {
                  opacity: [0.35, 0.7, 0.35],
                }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}
