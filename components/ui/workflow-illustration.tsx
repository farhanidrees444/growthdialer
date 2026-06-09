'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  resolveSceneConfig,
  type WorkflowScene,
  type SceneAccent,
} from '@/lib/ui/workflow-scenes';

interface WorkflowIllustrationProps {
  scene?: WorkflowScene;
  accent?: SceneAccent;
  /** Fallback when no scene or Lottie fails */
  icon?: LucideIcon;
  compact?: boolean;
  className?: string;
}

export function WorkflowIllustration({
  scene,
  accent,
  icon: Icon,
  compact = false,
  className,
}: WorkflowIllustrationProps) {
  const reduce = useReducedMotion();
  const config = resolveSceneConfig(scene, accent);
  const [data, setData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scene) return;
    let cancelled = false;
    fetch(config.lottie)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [scene, config.lottie]);

  const size = compact ? 'h-[72px] w-[72px]' : 'h-[108px] w-[108px]';
  const lottieSize = compact ? 'h-14 w-14' : 'h-[88px] w-[88px]';

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {!reduce && (
        <motion.div
          aria-hidden
          className={cn(
            'pointer-events-none absolute rounded-full bg-gradient-to-br blur-2xl',
            config.halo,
            compact ? 'h-20 w-20' : 'h-36 w-36',
          )}
          animate={{ scale: [0.92, 1.06, 0.92], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl border border-white/[0.08]',
          'bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
          size,
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-2xl opacity-60',
            'bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_65%)]',
          )}
          aria-hidden
        />

        {scene && data && !failed ? (
          <Lottie
            animationData={data}
            loop
            className={cn('pointer-events-none', lottieSize)}
          />
        ) : Icon ? (
          <Icon className={cn('text-zinc-400', compact ? 'h-6 w-6' : 'h-9 w-9')} />
        ) : (
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/20',
              compact ? 'h-8 w-8' : 'h-12 w-12',
              !reduce && 'animate-pulse',
            )}
          />
        )}
      </div>
    </div>
  );
}
