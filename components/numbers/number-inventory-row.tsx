'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Copy,
  Edit2,
  Loader2,
  MoreHorizontal,
  Shield,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { NumberHealthBadge } from '@/components/numbers/number-health-badge';
import { NumberHealthRing } from '@/components/numbers/number-health-ring';
import {
  formatReputationScore,
  HEALTH_TIER_STYLES,
  type NumberHealthTier,
} from '@/lib/numbers/health';
import type { PurchasedNumberRecord } from '@/lib/numbers/inventory';
import { cn } from '@/lib/utils';

const SPAM_PILL: Record<string, string> = {
  clean: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  low_risk: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  flagged: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  blocked: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NumberInventoryRow({
  num,
  retailPrice,
  isOnlyNumber,
  onSetDefault,
  onRelease,
  onSpamCheck,
  onLabelSave,
}: {
  num: PurchasedNumberRecord;
  retailPrice: number;
  isOnlyNumber: boolean;
  onSetDefault: () => Promise<void>;
  onRelease: () => Promise<void>;
  onSpamCheck: () => Promise<void>;
  onLabelSave: (label: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [busy, setBusy] = useState<'default' | 'spam' | 'release' | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(num.label ?? '');

  const stats = num.stats ?? { total_calls: 0, connected: 0, connect_rate: 0, last_used: null };
  const health = num.computed_health ?? null;
  const tier = (num.health_tier ?? 'unknown') as NumberHealthTier;
  const spamKey = num.spam_status ?? 'clean';
  const tierStyles = HEALTH_TIER_STYLES[tier];
  const needsAction = num.action_required && num.action_required !== 'none';

  async function run(action: 'default' | 'spam' | 'release', fn: () => Promise<void>) {
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
      setMenuOpen(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border transition-colors',
        needsAction ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/[0.07] bg-white/[0.02]',
        num.is_default && 'ring-1 ring-cyan-500/20',
      )}
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <NumberHealthRing health={health} tier={tier} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(num.phone_number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="font-mono text-base font-bold text-white hover:text-cyan-300 transition"
              >
                {fmtPhone(num.phone_number)}
              </button>
              {num.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  <Star className="h-2.5 w-2.5 fill-cyan-400" /> Default
                </span>
              )}
              <NumberHealthBadge label={num.health_label ?? 'New'} tier={tier} />
              {copied && <span className="text-[10px] text-emerald-400">Copied</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
              {editingLabel ? (
                <span className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={labelVal}
                    onChange={(e) => setLabelVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void onLabelSave(labelVal).then(() => setEditingLabel(false));
                      if (e.key === 'Escape') setEditingLabel(false);
                    }}
                    className="h-7 w-36 rounded-md border border-cyan-500/30 bg-white/[0.05] px-2 text-xs text-white outline-none"
                    placeholder="e.g. Sales line"
                  />
                  <button type="button" onClick={() => void onLabelSave(labelVal).then(() => setEditingLabel(false))} className="text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditingLabel(false)} className="text-slate-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingLabel(true)}
                  className="inline-flex items-center gap-1 hover:text-slate-300"
                >
                  {num.label ? <span className="text-slate-400">{num.label}</span> : <span className="italic text-slate-600">Add label</span>}
                  <Edit2 className="h-2.5 w-2.5" />
                </button>
              )}
              <span className="text-slate-700">·</span>
              <span>${retailPrice.toFixed(2)}/mo</span>
              <span className="text-slate-700">·</span>
              <span className={num.billing_status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>
                {num.billing_status === 'active' ? 'Subscribed' : 'No subscription'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center lg:w-[280px] lg:shrink-0">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Calls 30d</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">{stats.total_calls}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Connect</p>
            <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', stats.connect_rate >= 20 ? 'text-emerald-400' : 'text-slate-300')}>
              {stats.total_calls === 0 ? '—' : `${stats.connect_rate}%`}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Reputation</p>
            <p className={cn('mt-0.5 text-xs font-semibold', num.reputation_score != null ? tierStyles.text : 'text-slate-500')}>
              {formatReputationScore(num.reputation_score ?? null)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:shrink-0">
          <span className={cn('hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize sm:inline', SPAM_PILL[spamKey] ?? SPAM_PILL.clean)}>
            {spamKey.replace('_', ' ')}
          </span>
          {!num.is_default && (
            <button
              type="button"
              disabled={busy === 'default'}
              onClick={() => void run('default', onSetDefault)}
              className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-50 sm:inline-flex"
            >
              {busy === 'default' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set default'}
            </button>
          )}
          <button
            type="button"
            disabled={busy === 'spam'}
            onClick={() => void run('spam', onSpamCheck)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/15 disabled:opacity-50"
          >
            {busy === 'spam' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
            Check spam
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-white"
            aria-label="Toggle details"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-white"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(num.phone_number);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                  >
                    <Copy className="h-3 w-3" /> Copy number
                  </button>
                  {!num.is_default && (
                    <button
                      type="button"
                      onClick={() => void run('default', onSetDefault)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 sm:hidden"
                    >
                      <Star className="h-3 w-3" /> Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmRelease(true);
                      setMenuOpen(false);
                      setExpanded(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" /> Release
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="space-y-3 px-4 py-4">
              <p className="text-sm text-slate-400 leading-relaxed">{num.health_insight}</p>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                <span>Last used: {stats.last_used ? fmtDate(stats.last_used) : 'Never'}</span>
                <span className="sm:hidden capitalize">Spam: {spamKey.replace('_', ' ')}</span>
              </div>
              {confirmRelease && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-300">Release this number?</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isOnlyNumber ? "You'll have no caller IDs left." : 'This cannot be undone.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmRelease(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busy === 'release'}
                      onClick={() => void run('release', onRelease)}
                      className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300"
                    >
                      {busy === 'release' ? 'Releasing…' : 'Release'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
