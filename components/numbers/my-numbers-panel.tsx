'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Loader2, Plus, Search, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { NumberInventoryRow } from '@/components/numbers/number-inventory-row';
import { NumbersPortfolioSummary } from '@/components/numbers/numbers-portfolio-summary';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import {
  filterNumbers,
  portfolioStats,
  type NumberFilter,
  type PurchasedNumberRecord,
} from '@/lib/numbers/inventory';
import { sortNumbersByPriority } from '@/lib/numbers/health';
import { cn } from '@/lib/utils';

const FILTERS: { key: NumberFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_check', label: 'Needs check' },
  { key: 'at_risk', label: 'At risk' },
  { key: 'expiring', label: 'Expiring' },
];

export function MyNumbersPanel({
  refreshSignal,
  onBuyNew,
}: {
  refreshSignal: number;
  onBuyNew: () => void;
}) {
  const [numbers, setNumbers] = useState<PurchasedNumberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NumberFilter>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [bulkChecking, setBulkChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/numbers/list');
      const data = await res.json() as { numbers?: PurchasedNumberRecord[]; error?: string };
      if (data.error) {
        toast.error(data.error);
        setNumbers([]);
      } else {
        setNumbers(data.numbers ?? []);
      }
    } catch {
      setNumbers([]);
      toast.error('Failed to load numbers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    if (numbers.length > 0 && numbers.length <= 2) setView('grid');
    else if (numbers.length >= 3) setView('list');
  }, [numbers.length]);

  const active = useMemo(
    () => numbers.filter((n) => n.status !== 'released'),
    [numbers],
  );

  const stats = useMemo(() => portfolioStats(active), [active]);
  const monthlyCost = useMemo(
    () => active.reduce((s, n) => s + calculateRetailPrice(Number(n.monthly_cost)), 0),
    [active],
  );

  const filtered = useMemo(() => {
    let list = filterNumbers(active, filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.phone_number.includes(q) ||
          (n.label ?? '').toLowerCase().includes(q),
      );
    }
    return sortNumbersByPriority(list);
  }, [active, filter, search]);

  const unchecked = active.filter((n) => !n.has_reputation_check);

  async function handleSetDefault(id: string) {
    await fetch(`/api/numbers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    toast.success('Default caller ID updated');
    await load();
  }

  async function handleRelease(id: string) {
    const res = await fetch(`/api/numbers/${id}`, { method: 'DELETE' });
    const data = await res.json() as { error?: string };
    if (data.error) toast.error(data.error);
    else {
      toast.success('Number released');
      await load();
    }
  }

  async function handleSpamCheck(id: string) {
    const res = await fetch(`/api/numbers/${id}/spam-check`, { method: 'POST' });
    const data = await res.json() as { spam_status?: string; error?: string };
    if (data.error) toast.error(data.error);
    else {
      toast.success(`Spam status: ${data.spam_status?.replace('_', ' ')}`);
      await load();
    }
  }

  async function handleLabelSave(id: string, label: string) {
    const res = await fetch(`/api/numbers/${id}/label`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const data = await res.json() as { error?: string };
    if (data.error) toast.error(data.error);
    else {
      toast.success('Label saved');
      await load();
    }
  }

  async function handleBulkSpamCheck() {
    if (!unchecked.length) return;
    setBulkChecking(true);
    let ok = 0;
    for (const num of unchecked) {
      try {
        const res = await fetch(`/api/numbers/${num.id}/spam-check`, { method: 'POST' });
        const data = await res.json() as { error?: string };
        if (!data.error) ok += 1;
      } catch {
        // continue
      }
    }
    setBulkChecking(false);
    toast.success(`Checked ${ok} of ${unchecked.length} numbers`);
    await load();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <PremiumEmptyState
        icon={Plus}
        title="No caller IDs yet"
        description="Buy a number to dial with your own caller ID, monitor deliverability, and rotate lines as you scale."
        primaryAction={{ label: 'Buy your first number', onClick: onBuyNew }}
        accent="violet"
      />
    );
  }

  return (
    <div className="space-y-5">
      <NumbersPortfolioSummary
        count={stats.count}
        monthlyCost={monthlyCost}
        avgHealth={stats.avgHealth}
        scoredCount={stats.scoredCount}
        needsCheck={stats.needsCheck}
        atRisk={stats.atRisk}
        expiring={stats.expiring}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === 'all'
                ? active.length
                : filterNumbers(active, f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filter === f.key
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                    : 'border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300',
                )}
              >
                {f.label}
                <span className="ml-1 tabular-nums text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unchecked.length > 0 && (
            <button
              type="button"
              disabled={bulkChecking}
              onClick={() => void handleBulkSpamCheck()}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/15 disabled:opacity-50"
            >
              {bulkChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              Check all ({unchecked.length})
            </button>
          )}
          <div className="flex rounded-xl border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition',
                view === 'list' ? 'bg-white/10 text-white' : 'text-slate-500',
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition',
                view === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500',
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by number or label…"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          {search ? `No numbers match "${search}"` : 'No numbers in this filter'}
        </p>
      ) : (
        <motion.div
          className={cn(view === 'grid' ? 'grid grid-cols-1 gap-3 lg:grid-cols-2' : 'space-y-3')}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map((num) => (
            <motion.div
              key={num.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <NumberInventoryRow
                num={num}
                retailPrice={calculateRetailPrice(Number(num.monthly_cost))}
                isOnlyNumber={active.length === 1}
                onSetDefault={() => handleSetDefault(num.id)}
                onRelease={() => handleRelease(num.id)}
                onSpamCheck={() => handleSpamCheck(num.id)}
                onLabelSave={(label) => handleLabelSave(num.id, label)}
              />
            </motion.div>
          ))}

          {view === 'grid' && active.length === 1 && !search && filter === 'all' && (
            <button
              type="button"
              onClick={onBuyNew}
              className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center transition hover:border-violet-500/30 hover:bg-white/[0.02]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-300">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white/80">Add another line</p>
                <p className="mx-auto mt-1 max-w-[14rem] text-xs text-slate-500">
                  Rotate caller IDs to protect deliverability as volume grows.
                </p>
              </div>
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
