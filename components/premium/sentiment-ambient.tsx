'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SentimentAmbientProps {
  sentiment?: string | null;
  children: ReactNode;
  className?: string;
}

/** Subtle tint on active call UI when ai_sentiment is present on the call/lead. */
export function SentimentAmbient({ sentiment, children, className }: SentimentAmbientProps) {
  const s = sentiment?.toLowerCase();
  const glow =
    s === 'positive'
      ? 'shadow-[0_0_40px_-8px_rgba(6,182,212,0.45)] border-cyan-500/25'
      : s === 'negative'
        ? 'shadow-[0_0_40px_-8px_rgba(251,146,60,0.35)] border-orange-500/20'
        : '';

  return (
    <div className={cn(className, s && glow)}>
      {children}
    </div>
  );
}
