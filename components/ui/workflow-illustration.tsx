'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  resolveSceneConfig,
  type WorkflowScene,
  type SceneAccent,
} from '@/lib/ui/workflow-scenes';
import { WorkflowSceneMotion } from '@/components/ui/workflow-scene-motion';

interface WorkflowIllustrationProps {
  scene?: WorkflowScene;
  accent?: SceneAccent;
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

  const boxSize = compact ? 'h-[80px] w-[80px]' : 'h-[128px] w-[128px]';
  const innerSize = compact ? 'h-[64px] w-[64px]' : 'h-[104px] w-[104px]';

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className={cn(
              'pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl',
              config.halo,
              compact ? 'h-24 w-24' : 'h-44 w-44',
            )}
            animate={{ scale: [0.88, 1.1, 0.88], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className={cn(
              'pointer-events-none absolute rounded-full opacity-40 blur-2xl',
              compact ? 'h-16 w-16' : 'h-28 w-28',
            )}
            style={{
              background: 'conic-gradient(from 180deg, #8B5CF6, #22D3EE, #8B5CF6)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      <motion.div
        className={cn('relative', boxSize)}
        initial={reduce ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-[1px] rounded-[18px] opacity-70"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(34,211,238,0.2), rgba(139,92,246,0.1))',
            }}
            animate={{ opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-[17px]',
            'border border-white/[0.1] bg-gradient-to-b from-zinc-800/80 to-zinc-950',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.4)]',
            boxSize,
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)]"
            aria-hidden
          />

          {scene ? (
            <div className={cn('relative', innerSize)}>
              <WorkflowSceneMotion scene={scene} />
            </div>
          ) : Icon ? (
            <Icon className={cn('text-zinc-400', compact ? 'h-7 w-7' : 'h-10 w-10')} />
          ) : (
            <div
              className={cn(
                'rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/30',
                compact ? 'h-10 w-10' : 'h-14 w-14',
                !reduce && 'animate-pulse',
              )}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
