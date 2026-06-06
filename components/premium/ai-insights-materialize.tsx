'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { SPRING } from '@/lib/ui/premium-motion';
import { cn } from '@/lib/utils';

interface AiInsightField {
  id: string;
  label: string;
  value: string;
  icon?: ReactNode;
  variant?: 'violet' | 'cyan' | 'neutral';
}

interface AiInsightsMaterializeProps {
  fields: AiInsightField[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? text : '');

  useEffect(() => {
    if (reduce) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length && interval) clearInterval(interval);
      }, 14);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, delay, reduce]);

  return <span>{shown}</span>;
}

export function AiInsightsMaterialize({
  fields,
  loading = false,
  emptyMessage = 'Analysis in progress — insights will appear when AI processing completes.',
  className,
}: AiInsightsMaterializeProps) {
  const reduce = useReducedMotion();

  if (loading || fields.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className={cn(
          'rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm',
          className,
        )}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8B5CF6]" /> : <Brain className="h-3.5 w-3.5" />}
          AI insights
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{emptyMessage}</p>
        {loading && !reduce && (
          <div className="mt-3 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-[#8B5CF6]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {fields.map((field, index) => (
        <motion.div
          key={field.id}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ ...SPRING, delay: reduce ? 0 : index * 0.12 }}
          className={cn(
            'rounded-xl border p-3 backdrop-blur-sm',
            field.variant === 'cyan'
              ? 'border-cyan-500/20 bg-cyan-500/[0.06]'
              : field.variant === 'violet'
                ? 'border-violet-500/20 bg-violet-500/[0.06]'
                : 'border-white/[0.08] bg-white/[0.02]',
          )}
        >
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {field.icon ?? <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />}
            {field.label}
          </div>
          <p className="text-xs leading-relaxed text-white/80">
            <TypewriterText text={field.value} delay={reduce ? 0 : index * 180} />
          </p>
        </motion.div>
      ))}
    </div>
  );
}
