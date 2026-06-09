'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { WorkflowScene } from '@/lib/ui/workflow-scenes';

const EASE = [0.22, 1, 0.36, 1] as const;

function WaveBars({ colors }: { colors: string[] }) {
  const reduce = useReducedMotion();
  const heights = [0.35, 0.65, 0.95, 0.55, 0.8, 0.45, 0.7];
  const barH = 52;
  return (
    <div className="flex h-full w-full items-end justify-center gap-[5px] px-3 pb-4 pt-3">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[6px] rounded-full"
          style={{
            height: barH,
            background: colors[i % colors.length],
            transformOrigin: 'bottom center',
          }}
          initial={{ scaleY: h }}
          animate={
            reduce
              ? { scaleY: h }
              : { scaleY: [h, Math.min(1, h + 0.35), h * 0.6, h] }
          }
          transition={{
            duration: 1.1 + i * 0.08,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.07,
          }}
        />
      ))}
    </div>
  );
}

function PulseRings({ stroke }: { stroke: string }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <circle cx="60" cy="60" r="28" fill="none" stroke={stroke} strokeWidth="2" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="60"
          cy="60"
          r="22"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: [0.6, 1.35], opacity: [0.7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.75, ease: 'easeOut' }}
          style={{ transformOrigin: '60px 60px' }}
        />
      ))}
      <circle cx="60" cy="60" r="14" fill={stroke} opacity="0.25" />
      <circle cx="60" cy="60" r="8" fill={stroke} opacity="0.85" />
    </svg>
  );
}

function AudienceOrbs() {
  const reduce = useReducedMotion();
  const orbs = [
    { x: 28, y: 58, r: 14, color: '#8B5CF6', delay: 0 },
    { x: 60, y: 42, r: 18, color: '#6366F1', delay: 0.2 },
    { x: 92, y: 58, r: 14, color: '#22D3EE', delay: 0.4 },
  ];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <motion.path
        d="M28 58 Q60 30 92 58"
        fill="none"
        stroke="url(#audience-line)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={reduce ? {} : { pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
      />
      <defs>
        <linearGradient id="audience-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      {orbs.map((o) => (
        <motion.g key={o.x} style={{ transformOrigin: `${o.x}px ${o.y}px` }}>
          <motion.circle
            cx={o.x}
            cy={o.y}
            r={o.r}
            fill={o.color}
            fillOpacity={0.2}
            stroke={o.color}
            strokeWidth="1.5"
            animate={reduce ? {} : { scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: o.delay, ease: EASE }}
          />
        </motion.g>
      ))}
    </svg>
  );
}

function FlowNodes() {
  const reduce = useReducedMotion();
  const nodes = [
    { cx: 24, color: '#22D3EE' },
    { cx: 60, color: '#8B5CF6' },
    { cx: 96, color: '#34D399' },
  ];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <line x1="24" y1="60" x2="96" y2="60" stroke="#8B5CF6" strokeOpacity="0.25" strokeWidth="2" />
      {nodes.map((n, i) => (
        <motion.g key={n.cx}>
          <motion.circle
            cx={n.cx}
            cy="60"
            r="10"
            fill={n.color}
            fillOpacity={0.25}
            stroke={n.color}
            strokeWidth="2"
            animate={reduce ? {} : { scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: EASE }}
            style={{ transformOrigin: `${n.cx}px 60px` }}
          />
        </motion.g>
      ))}
      {!reduce && (
        <motion.circle
          r="5"
          fill="#A78BFA"
          initial={{ cx: 24, cy: 60 }}
          animate={{ cx: [24, 60, 96, 60, 24] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </svg>
  );
}

function LeaderboardBars() {
  const reduce = useReducedMotion();
  const bars = [
    { h: 36, x: 22, color: '#F59E0B' },
    { h: 52, x: 48, color: '#FBBF24' },
    { h: 28, x: 74, color: '#D97706' },
  ];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      {bars.map((b, i) => (
        <motion.rect
          key={b.x}
          x={b.x}
          width="18"
          rx="4"
          fill={b.color}
          fillOpacity={0.75}
          initial={{ y: 90, height: 0 }}
          animate={
            reduce
              ? { y: 90 - b.h, height: b.h }
              : { y: [90 - b.h * 0.6, 90 - b.h, 90 - b.h * 0.75, 90 - b.h], height: [b.h * 0.6, b.h, b.h * 0.75, b.h] }
          }
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: EASE }}
        />
      ))}
    </svg>
  );
}

function AnalyticsLine() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M12 88 L36 72 L54 78 L72 48 L96 56 L108 32 L108 100 L12 100 Z" fill="url(#chart-fill)" />
      <motion.path
        d="M12 88 L36 72 L54 78 L72 48 L96 56 L108 32"
        fill="none"
        stroke="#A78BFA"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={reduce ? { pathLength: 1 } : { pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: EASE }}
      />
      <motion.circle
        r="4"
        fill="#C4B5FD"
        initial={{ cx: 12, cy: 88 }}
        animate={
          reduce
            ? { cx: 108, cy: 32 }
            : { cx: [12, 36, 54, 72, 96, 108], cy: [88, 72, 78, 48, 56, 32] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

function GlobeGrid() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="globe-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="58" r="38" fill="url(#globe-glow)" />
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '60px 58px' }}
      >
        <ellipse cx="60" cy="58" rx="34" ry="34" fill="none" stroke="#8B5CF6" strokeOpacity="0.35" strokeWidth="1.5" />
        <ellipse cx="60" cy="58" rx="34" ry="14" fill="none" stroke="#22D3EE" strokeOpacity="0.3" strokeWidth="1" />
        <ellipse cx="60" cy="58" rx="14" ry="34" fill="none" stroke="#22D3EE" strokeOpacity="0.3" strokeWidth="1" />
      </motion.g>
      <circle cx="60" cy="58" r="6" fill="#8B5CF6" fillOpacity="0.9" />
    </svg>
  );
}

const SCENE_RENDER: Record<WorkflowScene, () => ReactNode> = {
  leads: AudienceOrbs,
  sequences: FlowNodes,
  numbers: GlobeGrid,
  recordings: () => (
    <WaveBars colors={['#34D399', '#6EE7B7', '#10B981', '#6EE7B7', '#34D399', '#6EE7B7', '#10B981']} />
  ),
  calls: () => <PulseRings stroke="#22D3EE" />,
  analytics: AnalyticsLine,
  leaderboard: LeaderboardBars,
  dialer: () => <PulseRings stroke="#8B5CF6" />,
  integrations: FlowNodes,
  generic: () => <PulseRings stroke="#A1A1AA" />,
};

interface WorkflowSceneMotionProps {
  scene: WorkflowScene;
}

export function WorkflowSceneMotion({ scene }: WorkflowSceneMotionProps) {
  const Render = SCENE_RENDER[scene] ?? SCENE_RENDER.generic;
  return <Render />;
}
