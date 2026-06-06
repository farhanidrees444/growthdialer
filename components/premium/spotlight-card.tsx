'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article';
  onClick?: () => void;
  disabled?: boolean;
}

export function SpotlightCard({ children, className, as = 'div', onClick, disabled }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [spot, setSpot] = useState({ x: 50, y: 50, opacity: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const Comp = motion.div;

  function onMove(e: MouseEvent) {
    if (reduce || disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -4;
    setSpot({ x, y, opacity: 1 });
    setTilt({ rx, ry });
  }

  function onLeave() {
    setSpot((s) => ({ ...s, opacity: 0 }));
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <Comp
      ref={ref}
      role={as === 'article' ? undefined : undefined}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={
        reduce
          ? undefined
          : {
              transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: 'transform 0.2s ease-out',
            }
      }
      className={cn('relative overflow-hidden', className)}
    >
      {!reduce && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: spot.opacity,
            background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, rgba(139,92,246,0.14), transparent 55%)`,
          }}
          aria-hidden
        />
      )}
      <div className="relative z-10">{children}</div>
    </Comp>
  );
}
