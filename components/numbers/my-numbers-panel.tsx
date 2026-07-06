'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Loader2, Phone, Plus, Search, Shield, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { createClient } from '@/lib/supabase/client';
import { withBillingMeta } from '@/lib/numbers/billing-lifecycle';
import { NumberInventoryRow } from '@/components/numbers/number-inventory-row';
import { NumbersPortfolioSummary } from '@/components/numbers/numbers-portfolio-summary';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { SurfaceCard } from '@/components/ui/surface-card';
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
  { key: 'all', label: 'All lines' },
  { key: 'needs_check', label: 'To verify' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'expiring', label: 'Expiring' },
];

export function MyNumbersPanel({
  refreshSignal,
  onBuyNew,
}: {
  refreshSignal: number;
  onBuyNew: () => void;
}) {
  const { apiFetch } = useWorkspace();
  const [numbers, setNumbers] = useState<PurchasedNumberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NumberFilter>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [bulkChecking, setBulkChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/numbers/list');
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
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`my-numbers-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'purchased_numbers', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as { id?: string };
              if (oldRow.id) {
                setNumbers((prev) => prev.filter((n) => n.id !== oldRow.id));
              }
              return;
            }

            const row = payload.new as PurchasedNumberRecord;
            if (!row?.id || row.status === 'released') {
              if (row?.id) setNumbers((prev) => prev.filter((n) => n.id !== row.id));
              return;
            }

            setNumbers((prev) => {
              const existing = prev.find((n) => n.id === row.id);
              const merged = withBillingMeta({ ...existing, ...row } as PurchasedNumberRecord);
              if (!existing) return [merged, ...prev];
              return prev.map((n) => (n.id === row.id ? { ...n, ...merged } : n));
            });
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

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

  async function handleExtend(id: string) {
    const res = await apiFetch(`/api/numbers/${id}/extend`, { method: 'POST' });
    const data = await res.json() as { error?: string; next_billing_date?: string };
    if (data.error) {
      toast.error(data.error);
      return;
    }
    toast.success('Line extended for 30 days');
    setNumbers((prev) =>
      prev.map((n) =>
        n.id === id
          ? withBillingMeta({
              ...n,
              next_billing_date: data.next_billing_date ?? n.next_billing_date,
              billing_status: 'active',
              status: 'active',
            })
          : n,
      ),
    );
  }

  async function handleSettingsPatch(
    id: string,
    patch: Record<string, unknown>,
  ) {
    const res = await apiFetch(`/api/numbers/${id}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json() as { error?: string };
    if (data.error) toast.error(data.error);
    else {
      toast.success('Line settings updated');
      await load();
    }
  }

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
      toast.success('Line verified');
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
    toast.success(`Verified ${ok} of ${unchecked.length} lines`);
    await load();
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[108px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
        <div className="h-14 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <PremiumEmptyState
        icon={Plus}
        scene="numbers"
        title="Add your first caller ID"
        description="Search available numbers to start outbound calling and inbound routing. Existing lines will appear here once they are linked to your workspace."
        primaryAction={{ label: 'Search numbers', onClick: onBuyNew }}
        secondaryAction={{ label: 'Call settings', href: '/settings?tab=calling' }}
        features={[
          { icon: Phone, label: 'Outbound caller ID' },
          { icon: Shield, label: 'Line verification' },
          { icon: Sparkles, label: 'Rotation ready' },
        ]}
        accent="violet"
      />
    );
  }

  return (
    <div className="space-y-6">
      <NumbersPortfolioSummary
        count={stats.count}
        monthlyCost={monthlyCost}
        avgHealth={stats.avgHealth}
        verified={stats.verified}
        needsCheck={stats.needsCheck}
        flagged={stats.flagged}
        expiring={stats.expiring}
      />

      <SurfaceCard variant="violet" className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Automatic line protection</p>
            <p className="text-xs leading-relaxed text-slate-400">
              We monitor reputation, suggest rotation, and only alert you when a line is confirmed flagged.
            </p>
          </div>
        </div>
        {unchecked.length > 0 && (
          <button
            type="button"
            disabled={bulkChecking}
            onClick={() => void handleBulkSpamCheck()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/25 disabled:opacity-50"
          >
            {bulkChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
            Verify all ({unchecked.length})
          </button>
        )}
      </SurfaceCard>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                  filter === f.key
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-100 shadow-sm shadow-violet-900/20'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-500 hover:border-white/15 hover:text-slate-300',
                )}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-black/20 p-0.5">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition',
                view === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300',
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition',
                view === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300',
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search numbers or labels…"
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/35 focus:bg-white/[0.04]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-slate-500">
          {search ? `No lines match "${search}"` : 'No lines in this view'}
        </p>
      ) : (
        <motion.div
          className={cn(view === 'grid' ? 'grid grid-cols-1 gap-4 xl:grid-cols-2' : 'flex flex-col gap-3')}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
        >
          {filtered.map((num) => (
            <motion.div
              key={num.id}
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
            >
              <NumberInventoryRow
                num={num}
                retailPrice={calculateRetailPrice(Number(num.monthly_cost))}
                isOnlyNumber={active.length === 1}
                onSetDefault={() => handleSetDefault(num.id)}
                onRelease={() => handleRelease(num.id)}
                onSpamCheck={() => handleSpamCheck(num.id)}
                onLabelSave={(label) => handleLabelSave(num.id, label)}
                onSettingsPatch={(patch) => handleSettingsPatch(num.id, patch)}
                onExtend={() => handleExtend(num.id)}
              />
            </motion.div>
          ))}

          {view === 'grid' && active.length === 1 && !search && filter === 'all' && (
            <button
              type="button"
              onClick={onBuyNew}
              className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/[0.03] p-8 text-center transition hover:border-violet-500/35 hover:bg-violet-500/[0.06]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-300">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Add another line</p>
                <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-slate-500">
                  Rotate caller IDs to keep answer rates high as volume grows.
                </p>
              </div>
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
