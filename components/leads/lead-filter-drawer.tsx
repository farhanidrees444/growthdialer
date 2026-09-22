'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

export interface LeadFilters {
  statuses: string[];
  sources: string[];
  lastContact: string;
  hasPhone: boolean | null;
  hasEmail: boolean | null;
  hasNotes: boolean | null;
  minAttempts: number;
  maxAttempts: number;
}

export const EMPTY_FILTERS: LeadFilters = {
  statuses: [],
  sources: [],
  lastContact: '',
  hasPhone: null,
  hasEmail: null,
  hasNotes: null,
  minAttempts: 0,
  maxAttempts: 999,
};

export function isFilterActive(f: LeadFilters): boolean {
  return (
    f.statuses.length > 0 ||
    f.sources.length > 0 ||
    !!f.lastContact ||
    f.hasPhone !== null ||
    f.hasEmail !== null ||
    f.hasNotes !== null ||
    f.minAttempts > 0 ||
    f.maxAttempts < 999
  );
}

const ALL_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'queued', label: 'Queued' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'connected', label: 'Connected' },
  { value: 'callback', label: 'Callback' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'do_not_call', label: 'DNC' },
];

const ALL_SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'import', label: 'CSV Import' },
  { value: 'api', label: 'API' },
];

const LAST_CONTACT_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'never', label: 'Never contacted' },
];

interface Props {
  open: boolean;
  filters: LeadFilters;
  onChange: (f: LeadFilters) => void;
  onClose: () => void;
}

export function LeadFilterDrawer({ open, filters, onChange, onClose }: Props) {
  const [draft, setDraft] = useState<LeadFilters>(filters);
  const { isDark } = useSiteTheme();

  const toggleStatus = (v: string) => {
    setDraft((p) => ({
      ...p,
      statuses: p.statuses.includes(v)
        ? p.statuses.filter((s) => s !== v)
        : [...p.statuses, v],
    }));
  };

  const toggleSource = (v: string) => {
    setDraft((p) => ({
      ...p,
      sources: p.sources.includes(v)
        ? p.sources.filter((s) => s !== v)
        : [...p.sources, v],
    }));
  };

  const apply = () => {
    onChange(draft);
    onClose();
  };

  const reset = () => {
    const fresh = { ...EMPTY_FILTERS };
    setDraft(fresh);
    onChange(fresh);
    onClose();
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(filters);
  const filterActive = isFilterActive(draft);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l shadow-2xl',
              isDark
                ? 'border-white/[0.08] bg-[oklch(0.085_0.006_285)]'
                : 'border-zinc-950/[0.08] bg-white shadow-[0_24px_70px_rgba(76,29,149,0.10)]',
            )}
          >
            {/* Header */}
            <div className={cn(
              'flex shrink-0 items-center justify-between px-5 py-4 border-b',
              isDark ? 'border-white/[0.06]' : 'border-zinc-950/[0.06]',
            )}>
              <div className="flex items-center gap-2">
                <Filter className={cn('h-4 w-4', isDark ? 'text-slate-500' : 'text-zinc-400')} />
                <h2 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-zinc-950')}>Filter Leads</h2>
                {filterActive && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                    {[draft.statuses.length > 0, draft.sources.length > 0, !!draft.lastContact, draft.hasPhone !== null, draft.hasEmail !== null, draft.hasNotes !== null].filter(Boolean).length}
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border transition',
                  isDark
                    ? 'border-white/[0.07] text-slate-500 hover:text-white'
                    : 'border-zinc-950/10 bg-white text-zinc-400 shadow-sm hover:text-zinc-700',
                )}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Status */}
              <FilterSection title="Status">
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleStatus(value)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                        draft.statuses.includes(value)
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-500/12 text-emerald-700 border border-emerald-600/30'
                          : isDark
                            ? 'border border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-white/10'
                            : 'border border-zinc-950/10 text-zinc-500 hover:text-zinc-800 hover:border-zinc-950/20',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Source */}
              <FilterSection title="Source">
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SOURCES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleSource(value)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                        draft.sources.includes(value)
                          ? isDark
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-blue-500/12 text-blue-700 border border-blue-600/30'
                          : isDark
                            ? 'border border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-white/10'
                            : 'border border-zinc-950/10 text-zinc-500 hover:text-zinc-800 hover:border-zinc-950/20',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Last contacted */}
              <FilterSection title="Last Contacted">
                <div className="grid grid-cols-2 gap-1.5">
                  {LAST_CONTACT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, lastContact: value }))}
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-semibold text-left transition',
                        draft.lastContact === value
                          ? isDark
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-violet-500/12 text-violet-700 border border-violet-600/30'
                          : isDark
                            ? 'border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10'
                            : 'border border-zinc-950/10 text-zinc-500 hover:text-zinc-800 hover:border-zinc-950/20',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Attributes */}
              <FilterSection title="Attributes">
                <div className="space-y-2">
                  {[
                    { label: 'Has email', field: 'hasEmail' as const },
                    { label: 'Has notes', field: 'hasNotes' as const },
                  ].map(({ label, field }) => (
                    <div key={field} className="flex items-center justify-between">
                      <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-zinc-600')}>{label}</span>
                      <div className="flex gap-1.5">
                        {(['Any', 'Yes', 'No'] as const).map((opt) => {
                          const val = opt === 'Any' ? null : opt === 'Yes';
                          const active = draft[field] === val;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setDraft((p) => ({ ...p, [field]: val }))}
                              className={cn(
                                'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                                active
                                  ? isDark
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-emerald-500/12 text-emerald-700 border border-emerald-600/30'
                                  : isDark
                                    ? 'border border-white/[0.06] text-slate-600 hover:text-slate-300'
                                    : 'border border-zinc-950/10 text-zinc-500 hover:text-zinc-800',
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </FilterSection>

              {/* Call attempts */}
              <FilterSection title="Call Attempts">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] text-slate-600">Min</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={draft.minAttempts}
                      onChange={(e) => setDraft((p) => ({ ...p, minAttempts: Number(e.target.value) }))}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-[14px] transition-all duration-150',
                        isDark
                          ? 'dash-input'
                          : 'border-zinc-950/10 bg-white text-zinc-900 shadow-sm focus:border-violet-500/50 focus:outline-none focus:ring-[0_0_0_3px_rgba(139,92,246,0.15)]',
                      )}
                    />
                  </div>
                  <span className="mt-4 text-slate-600">–</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] text-slate-600">Max</label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={draft.maxAttempts === 999 ? '' : draft.maxAttempts}
                      placeholder="Any"
                      onChange={(e) => setDraft((p) => ({ ...p, maxAttempts: e.target.value ? Number(e.target.value) : 999 }))}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-[14px] transition-all duration-150 placeholder:text-zinc-400',
                        isDark
                          ? 'dash-input'
                          : 'border-zinc-950/10 bg-white text-zinc-900 shadow-sm focus:border-violet-500/50 focus:outline-none focus:ring-[0_0_0_3px_rgba(139,92,246,0.15)]',
                      )}
                    />
                  </div>
                </div>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className={cn(
              'shrink-0 flex gap-2 border-t px-5 py-4',
              isDark ? 'border-white/[0.06]' : 'border-zinc-950/[0.06]',
            )}>
              <button
                type="button"
                onClick={reset}
                className={cn(
                  'px-4',
                  isDark
                    ? 'dash-btn-ghost'
                    : 'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-950/10 bg-white py-2 text-[14px] font-medium text-zinc-700 shadow-[0_1px_2px_rgba(9,9,11,0.05)] transition-all duration-150 select-none hover:border-violet-500/30 hover:bg-violet-50/60 hover:text-zinc-900',
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={!hasChanges}
                className={cn(
                  'flex-1',
                  isDark
                    ? 'dash-btn-primary'
                    : 'inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-[14px] font-medium text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-all duration-150 select-none hover:bg-violet-500 disabled:opacity-50',
                )}
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      {children}
    </div>
  );
}
