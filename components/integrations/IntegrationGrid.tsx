'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { MarketplaceIntegration } from '@/lib/integrations/marketplace-catalog';
import { IntegrationCard, type CardConnectionState } from './IntegrationCard';

interface IntegrationGridProps {
  items: MarketplaceIntegration[];
  getConnectionState: (item: MarketplaceIntegration) => CardConnectionState;
  onOpen: (item: MarketplaceIntegration) => void;
  columns?: 'default' | 'dense';
}

export function IntegrationGrid({
  items,
  getConnectionState,
  onOpen,
  columns = 'default',
}: IntegrationGridProps) {
  return (
    <motion.div
      layout
      className={
        columns === 'dense'
          ? 'mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <IntegrationCard
            key={item.id}
            integration={item}
            connectionState={getConnectionState(item)}
            onOpen={() => onOpen(item)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
