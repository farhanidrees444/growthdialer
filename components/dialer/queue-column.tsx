'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SortAsc, Filter, X } from 'lucide-react';
import { QueueLeadCard } from './queue-lead-card';
import type { LeadRecord } from '@/lib/dialer/state-machine';

type QueueTab = 'queue' | 'hot' | 'callbacks';
type SortKey = 'priority' | 'recent' | 'az';

interface QueueCounts { queue: number; hot: number; callbacks: number }

interface QueueColumnProps {
  selectedLeadId?: string;
  onSelectLead: (lead: LeadRecord) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onCountsChange?: (counts: QueueCounts) => void;
}

export function QueueColumn({ selectedLeadId, onSelectLead, searchRef, onCountsChange }: QueueColumnProps) {
  const [tab, setTab] = useState<QueueTab>('queue');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('priority');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({ queue: 0, hot: 0, callbacks: 0 });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onCountsRef = useRef(onCountsChange);
  onCountsRef.current = onCountsChange;

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, sort, search: debouncedSearch });
      const res = await fetch(`/api/dialer/queue?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { leads: LeadRecord[]; counts: QueueCounts };
      setLeads(data.leads);
      setCounts(data.counts);
      onCountsRef.current?.(data.counts);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [tab, sort, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const tabDefs: { key: QueueTab; label: string; count: number }[] = [
    { key: 'queue', label: 'Queue', count: counts.queue },
    { key: 'hot', label: 'Hot', count: counts.hot },
    { key: 'callbacks', label: 'Callbacks', count: counts.callbacks },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
            aria-label="Search queue"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-0 px-3 pb-2 border-b border-white/[0.06]">
        {tabDefs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors ${
              tab === key ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`text-[10px] tabular-nums ${tab === key ? 'text-white/60' : 'text-white/25'}`}>
                {count}
              </span>
            )}
            {tab === key && (
              <motion.div
                layoutId="queue-tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
        {loading ? (
          <div className="space-y-2 px-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[76px] rounded-lg bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <p className="text-sm text-white/30">
              {debouncedSearch ? 'No results' : tab === 'hot' ? 'No hot leads' : tab === 'callbacks' ? 'No callbacks due' : 'Queue is empty'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {leads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <QueueLeadCard
                  lead={lead}
                  selected={lead.id === selectedLeadId}
                  onClick={() => onSelectLead(lead)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Sort / Filter bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 flex-1">
          <SortAsc className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent text-xs text-white/50 focus:outline-none cursor-pointer"
            aria-label="Sort queue"
          >
            <option value="priority">Priority</option>
            <option value="recent">Recent</option>
            <option value="az">A–Z</option>
          </select>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label="Filter queue"
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>
    </div>
  );
}
