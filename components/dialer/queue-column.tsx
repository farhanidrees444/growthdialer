'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ArrowDownUp, ChevronDown, Filter,
  Flame, Clock, ArrowDownAZ, Globe,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { QueueLeadCard } from './queue-lead-card';
import { getLocalTime } from '@/lib/utils/timezone';
import type { LeadRecord } from '@/lib/dialer/state-machine';

type QueueTab = 'queue' | 'hot' | 'callbacks';
type SortKey = 'priority' | 'recent' | 'az' | 'tz_safe';

interface FilterState {
  hasPhone: boolean;
  tzSafe: boolean;
  hasNotes: boolean;
  hot: boolean;
  callbacks: boolean;
  recentlyContacted: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  hasPhone: true,
  tzSafe: false,
  hasNotes: false,
  hot: false,
  callbacks: false,
  recentlyContacted: false,
};

const SORT_LABELS: Record<SortKey, string> = {
  priority: 'Priority',
  recent: 'Recently Added',
  az: 'A → Z',
  tz_safe: 'Timezone Safe',
};

const SORT_OPTIONS: { id: SortKey; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
  { id: 'priority', label: 'Priority', Icon: Flame },
  { id: 'recent', label: 'Recently Added', Icon: Clock },
  { id: 'az', label: 'A → Z', Icon: ArrowDownAZ },
  { id: 'tz_safe', label: 'Timezone Safe', Icon: Globe },
];

const FILTER_OPTIONS: { id: keyof FilterState; label: string }[] = [
  { id: 'hasPhone', label: 'Has phone number' },
  { id: 'tzSafe', label: 'Timezone safe to call' },
  { id: 'hot', label: 'Hot leads only' },
  { id: 'callbacks', label: 'Scheduled callbacks' },
  { id: 'hasNotes', label: 'Has notes' },
  { id: 'recentlyContacted', label: 'Contacted in last 7 days' },
];

interface QueueCounts { queue: number; hot: number; callbacks: number }

interface QueueColumnProps {
  selectedLeadId?: string;
  onSelectLead: (lead: LeadRecord) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onCountsChange?: (counts: QueueCounts) => void;
  onLeadsChange?: (leads: LeadRecord[]) => void;
}

export function QueueColumn({ selectedLeadId, onSelectLead, searchRef, onCountsChange, onLeadsChange }: QueueColumnProps) {
  const [tab, setTab] = useState<QueueTab>('queue');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('priority');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({ queue: 0, hot: 0, callbacks: 0 });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onCountsRef = useRef(onCountsChange);
  onCountsRef.current = onCountsChange;
  const onLeadsRef = useRef(onLeadsChange);
  onLeadsRef.current = onLeadsChange;

  // Restore sort + filters from localStorage on mount
  useEffect(() => {
    try {
      const savedSort = localStorage.getItem('dialer-sort');
      if (savedSort && savedSort in SORT_LABELS) setSort(savedSort as SortKey);
      const savedFilters = localStorage.getItem('dialer-filters');
      if (savedFilters) setFilters({ ...DEFAULT_FILTERS, ...JSON.parse(savedFilters) });
    } catch { /* ignore parse errors */ }
  }, []);

  useEffect(() => { localStorage.setItem('dialer-sort', sort); }, [sort]);
  useEffect(() => { localStorage.setItem('dialer-filters', JSON.stringify(filters)); }, [filters]);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Number of active non-default filters (hasPhone is default, not counted)
  const activeFilterCount = Object.entries(filters)
    .filter(([key, val]) => key !== 'hasPhone' && val === true).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // tzSafe applied client-side; tz_safe sort maps to priority on server
      const serverFilters = { ...filters, tzSafe: false };
      const params = new URLSearchParams({
        tab,
        sort: sort === 'tz_safe' ? 'priority' : sort,
        search: debouncedSearch,
        filters: JSON.stringify(serverFilters),
      });
      const res = await fetch(`/api/dialer/queue?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { leads: LeadRecord[]; counts: QueueCounts };
      setLeads(data.leads);
      setCounts(data.counts);
      onCountsRef.current?.(data.counts);
      onLeadsRef.current?.(data.leads);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [tab, sort, debouncedSearch, filters]);

  useEffect(() => { load(); }, [load]);

  // Client-side tzSafe filter: hide leads in unsafe calling hours (TCPA 8am–9pm)
  const displayLeads = filters.tzSafe
    ? leads.filter((lead) => {
        const info = getLocalTime(lead.phone);
        return !info.hasData || !info.isUnsafe;
      })
    : leads;

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
                style={{ background: 'linear-gradient(90deg, hsl(262,80%,50%), hsl(186,100%,42%))'' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Sort + Filter row — now above the list */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">

        {/* Sort dropdown */}
        <Popover>
          <PopoverTrigger className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors">
            <ArrowDownUp size={12} />
            {SORT_LABELS[sort]}
            <ChevronDown size={10} />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            className="w-48 p-1 bg-zinc-900/95 border-white/10 backdrop-blur-xl"
          >
            {SORT_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  sort === id
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Filter dropdown */}
        <Popover>
          <PopoverTrigger className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors">
            <Filter size={12} />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            className="w-56 p-3 bg-zinc-900/95 border-white/10 backdrop-blur-xl"
          >
            <p className="text-[10px] tracking-widest text-white/40 mb-2 uppercase">Filters</p>
            <div className="space-y-0.5">
              {FILTER_OPTIONS.map(({ id, label }) => (
                <label
                  key={id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters[id]}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [id]: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-cyan-500"
                  />
                  <span className="text-sm text-white/80">{label}</span>
                </label>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="w-full text-xs text-white/40 hover:text-white/60 border-t border-white/[0.06] mt-2.5 pt-2 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </PopoverContent>
        </Popover>

      </div>

      {/* Lead list — flex-1 fills remaining height, no empty space at bottom */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
        {loading ? (
          <div className="space-y-2 px-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[76px] rounded-lg bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : displayLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <p className="text-sm text-white/30">
              {debouncedSearch
                ? 'No results'
                : tab === 'hot'
                ? 'No hot leads'
                : tab === 'callbacks'
                ? 'No callbacks due'
                : 'Queue is empty'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayLeads.map((lead) => (
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

    </div>
  );
}
