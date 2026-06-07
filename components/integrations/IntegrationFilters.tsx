'use client';

import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategory,
} from '@/lib/integrations/marketplace-catalog';

interface IntegrationFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  category: MarketplaceCategory;
  onCategoryChange: (category: MarketplaceCategory) => void;
  resultCount: number;
}

export function IntegrationFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  resultCount,
}: IntegrationFiltersProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-zinc-800/60 bg-zinc-950/90 px-4 py-4 backdrop-blur-md lg:-mx-6 lg:px-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search integrations..."
            className="w-full rounded-lg border border-zinc-800/60 bg-zinc-900/40 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none backdrop-blur-md transition-colors focus:border-zinc-700 focus:bg-zinc-900/60"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative inline-flex flex-wrap gap-1 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-1 backdrop-blur-md">
            {MARKETPLACE_CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    'relative z-10 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="integration-category-pill"
                      className="absolute inset-0 rounded-md border border-zinc-700/80 bg-zinc-800/80"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{cat.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs tabular-nums text-zinc-600">
            {resultCount} integration{resultCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </div>
  );
}
