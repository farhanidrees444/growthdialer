'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw } from 'lucide-react';

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
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l border-white/[0.08] bg-[oklch(0.085_0.02_282)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-white">Filter Leads</h2>
                {filterActive && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                    {[draft.statuses.length > 0, draft.sources.length > 0, !!draft.lastContact, draft.hasPhone !== null, draft.hasEmail !== null, draft.hasNotes !== null].filter(Boolean).length}
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] text-slate-500 hover:text-white transition">
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
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                        draft.statuses.includes(value)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'border border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-white/10',
                      ].join(' ')}
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
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                        draft.sources.includes(value)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'border border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-white/10',
                      ].join(' ')}
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
                      className={[
                        'rounded-xl px-3 py-2 text-xs font-semibold text-left transition',
                        draft.lastContact === value
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10',
                      ].join(' ')}
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
                      <span className="text-sm text-slate-400">{label}</span>
                      <div className="flex gap-1.5">
                        {(['Any', 'Yes', 'No'] as const).map((opt) => {
                          const val = opt === 'Any' ? null : opt === 'Yes';
                          const active = draft[field] === val;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setDraft((p) => ({ ...p, [field]: val }))}
                              className={[
                                'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                                active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'border border-white/[0.06] text-slate-600 hover:text-slate-300',
                              ].join(' ')}
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
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/25"
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
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25"
                    />
                  </div>
                </div>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex gap-2 border-t border-white/[0.06] px-5 py-4">
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={!hasChanges}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition"
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
