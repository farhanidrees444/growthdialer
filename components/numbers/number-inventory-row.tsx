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
import { NumberStatusIndicator } from '@/components/numbers/number-health-ring';
import {
  formatHealthPercent,
  formatReputationScore,
  PRESENTATION_STYLES,
  type PresentationTier,
} from '@/lib/numbers/health';
import type { PurchasedNumberRecord } from '@/lib/numbers/inventory';
import { cn } from '@/lib/utils';

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function spamLabel(status: string | null, checked: boolean): string | null {
  if (!checked) return null;
  const s = status ?? 'clean';
  if (s === 'clean') return 'Verified clean';
  if (s === 'low_risk') return 'Low risk';
  if (s === 'flagged') return 'Flagged';
  return 'Blocked';
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
  const tier = (num.presentation_tier ?? 'ready') as PresentationTier;
  const label = num.presentation_label ?? num.health_label ?? 'Ready';
  const styles = PRESENTATION_STYLES[tier];
  const checked = Boolean(num.has_reputation_check);
  const verifyLabel = spamLabel(num.spam_status, checked);

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
        'group overflow-hidden rounded-2xl border transition-all duration-200',
        num.needs_attention
          ? 'border-orange-500/25 bg-orange-500/[0.03] shadow-[0_0_0_1px_rgba(251,146,60,0.08)]'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]',
        num.is_default && 'ring-1 ring-cyan-500/15',
      )}
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:gap-6 lg:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <NumberStatusIndicator tier={tier} size={44} />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(num.phone_number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="font-mono text-lg font-semibold tracking-tight text-white transition hover:text-cyan-300"
              >
                {fmtPhone(num.phone_number)}
              </button>
              {num.is_default && (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300">
                  <Star className="h-2.5 w-2.5 fill-cyan-400" />
                  Default
                </span>
              )}
              <NumberHealthBadge label={label} tier={tier} />
              {copied && <span className="text-[10px] font-medium text-emerald-400">Copied</span>}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {editingLabel ? (
                <span className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={labelVal}
                    onChange={(e) => setLabelVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void onLabelSave(labelVal).then(() => setEditingLabel(false));
                      if (e.key === 'Escape') setEditingLabel(false);
                    }}
                    className="h-8 w-40 rounded-lg border border-white/10 bg-black/30 px-2.5 text-xs text-white outline-none focus:border-violet-500/40"
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
                  className="inline-flex items-center gap-1 text-slate-500 transition hover:text-slate-300"
                >
                  {num.label ? <span className="text-slate-400">{num.label}</span> : <span>Add label</span>}
                  <Edit2 className="h-3 w-3 opacity-60" />
                </button>
              )}
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span>${retailPrice.toFixed(2)}/mo</span>
              <span className="text-slate-700">·</span>
              <span className={num.billing_status === 'active' ? 'text-emerald-400/90' : 'text-amber-400/90'}>
                {num.billing_status === 'active' ? 'Subscribed' : 'No subscription'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-0.5">
              <MetricPill
                label="30d calls"
                value={stats.total_calls === 0 ? '—' : String(stats.total_calls)}
              />
              <MetricPill
                label="Connect"
                value={stats.total_calls === 0 ? '—' : `${stats.connect_rate}%`}
                highlight={stats.connect_rate >= 20}
              />
              <MetricPill
                label="Reputation"
                value={formatReputationScore(num.reputation_score ?? null, checked)}
                sub={checked ? '/100' : undefined}
              />
              {verifyLabel && (
                <span className={cn(
                  'inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-medium',
                  num.spam_status === 'clean' || num.spam_status === 'low_risk'
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400/90'
                    : 'border-orange-500/25 bg-orange-500/10 text-orange-300',
                )}>
                  {verifyLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:shrink-0">
          {!checked && (
            <button
              type="button"
              disabled={busy === 'spam'}
              onClick={() => void run('spam', onSpamCheck)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600/90 to-violet-500/80 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-600 hover:to-violet-500 disabled:opacity-50 lg:flex-none"
            >
              {busy === 'spam' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              Verify line
            </button>
          )}
          {checked && (
            <button
              type="button"
              disabled={busy === 'spam'}
              onClick={() => void run('spam', onSpamCheck)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {busy === 'spam' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              Recheck
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-500 transition hover:border-white/20 hover:text-white"
            aria-label="Toggle details"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-500 transition hover:border-white/20 hover:text-white"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(num.phone_number);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy number
                  </button>
                  {!num.is_default && (
                    <button
                      type="button"
                      onClick={() => void run('default', onSetDefault)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                    >
                      <Star className="h-3.5 w-3.5" /> Set as default
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
                    <Trash2 className="h-3.5 w-3.5" /> Release number
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/[0.06] bg-black/20"
          >
            <div className="space-y-4 px-5 py-4">
              <p className="text-sm leading-relaxed text-slate-400">{num.health_insight}</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <DetailStat label="Health score" value={formatHealthPercent(num.computed_health ?? null)} />
                <DetailStat label="Last used" value={stats.last_used ? fmtDate(stats.last_used) : 'Never'} />
                <DetailStat label="Connected" value={stats.total_calls === 0 ? '—' : String(stats.connected)} />
                <DetailStat
                  label="Line status"
                  value={label}
                  valueClass={styles.text}
                />
              </div>

              {confirmRelease && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-300">Release this number?</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {isOnlyNumber ? "You'll have no caller IDs left." : 'This cannot be undone.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmRelease(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">
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

function MetricPill({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
      <p className={cn('mt-0.5 text-xs font-semibold tabular-nums', highlight ? 'text-emerald-400' : 'text-slate-300')}>
        {value}
        {sub && <span className="text-[10px] font-normal text-slate-600">{sub}</span>}
      </p>
    </div>
  );
}

function DetailStat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold text-white', valueClass)}>{value}</p>
    </div>
  );
}
