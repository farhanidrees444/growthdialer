'use client';

import { motion } from 'framer-motion';
import { Settings2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketplaceIntegration } from '@/lib/integrations/marketplace-catalog';

export type CardConnectionState = 'connected' | 'configured' | 'idle' | 'requested';

interface IntegrationCardProps {
  integration: MarketplaceIntegration;
  connectionState: CardConnectionState;
  onOpen: () => void;
}

function StatusBadge({
  integration,
  connectionState,
}: {
  integration: MarketplaceIntegration;
  connectionState: CardConnectionState;
}) {
  if (connectionState === 'connected' || connectionState === 'configured') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Connected
      </span>
    );
  }

  if (integration.enterprise && integration.configureMode === 'vote') {
    return (
      <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        Enterprise Only
      </span>
    );
  }

  if (integration.configureMode === 'vote') {
    return (
      <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        Request Early Access
      </span>
    );
  }

  if (integration.live) {
    return (
      <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300">
        Available
      </span>
    );
  }

  return null;
}

export function IntegrationCard({ integration, connectionState, onOpen }: IntegrationCardProps) {
  const isActive = connectionState === 'connected' || connectionState === 'configured';
  const isVote = integration.configureMode === 'vote';
  const ctaLabel = isActive
    ? 'Connected'
    : isVote
      ? connectionState === 'requested'
        ? 'Requested'
        : 'Request Access'
      : integration.configureMode === 'oauth'
        ? 'Connect'
        : 'Configure';

  return (
    <motion.article
      layout
      layoutId={`integration-${integration.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col rounded-xl border bg-zinc-900/40 p-5 backdrop-blur-md transition-colors',
        'border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-900/55',
        isActive && 'border-zinc-700/70',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-950/80">
          {integration.logo}
        </div>
        <StatusBadge integration={integration} connectionState={connectionState} />
      </div>

      <div className="flex-1">
        <h3 className="text-[15px] font-medium tracking-tight text-zinc-50">{integration.name}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{integration.description}</p>
      </div>

      <div className="mt-5">
        <span
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors',
            isActive
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
              : connectionState === 'requested'
                ? 'border-zinc-800 bg-zinc-950/80 text-zinc-500'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 group-hover:border-zinc-700 group-hover:bg-zinc-900',
          )}
        >
          {isActive ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            !isVote && <Settings2 className="h-3.5 w-3.5" />
          )}
          {ctaLabel}
        </span>
      </div>
    </motion.article>
  );
}
