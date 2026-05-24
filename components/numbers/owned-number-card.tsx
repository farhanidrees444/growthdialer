'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import CountryFlag from './country-flag';
import { NUMBER_TYPE_LABELS } from '@/lib/telnyx-countries';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';

interface PurchasedNumber {
  id: string;
  phone_number: string;
  country: string;
  country_code: string | null;
  country_name: string | null;
  number_type: string | null;
  region: string | null;
  locality: string | null;
  monthly_cost: number;
  is_default: boolean;
  status: string;
  purchased_at: string;
  billing_status?: string | null;
  next_billing_date?: string | null;
  auto_renew?: boolean | null;
  stripe_subscription_id?: string | null;
}

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeLabel(type: string | null): string {
  if (!type) return 'Local';
  return NUMBER_TYPE_LABELS[type] ?? type;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

interface OwnedNumberCardProps {
  num: PurchasedNumber;
  isOnlyNumber: boolean;
  onSetDefault: (id: string) => Promise<void>;
  onRelease: (id: string) => Promise<void>;
}

export default function OwnedNumberCard({ num, isOnlyNumber, onSetDefault, onRelease }: OwnedNumberCardProps) {
  const [settingDefault, setSettingDefault] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const countryCode = num.country_code ?? num.country;
  const countryName = num.country_name ?? num.country;
  const retailPrice = calculateRetailPrice(Number(num.monthly_cost));
  const renewDays = daysUntil(num.next_billing_date);
  const isExpiringSoon = renewDays !== null && renewDays <= 7 && renewDays >= 0;
  const hasBilling = !!num.stripe_subscription_id;
  // Numbers synced from provider account without Stripe are "active" (paid at provider level)
  const billingStatus = num.billing_status ?? 'unpaid';
  const isProviderActive = billingStatus === 'active' && !hasBilling;
  const isTrial = billingStatus === 'trial';

  async function handleSetDefault() {
    setSettingDefault(true);
    try { await onSetDefault(num.id); } finally { setSettingDefault(false); }
  }

  async function handleRelease() {
    setReleasing(true);
    setConfirmRelease(false);
    try { await onRelease(num.id); } finally { setReleasing(false); }
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative rounded-2xl border p-4 shadow-lg shadow-black/20 transition-all ${
        isExpiringSoon
          ? 'border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50'
          : 'border-white/[0.07] bg-[oklch(0.086_0.024_282)] hover:border-emerald-500/20'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(ellipse_at_top_left,oklch(0.5_0.2_145_/_0.06),transparent_60%)]" />

      <div className="relative flex items-start gap-3">
        {/* Flag avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04]">
          <CountryFlag code={countryCode} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[15px] font-bold text-white tracking-wide">
              {fmtPhone(num.phone_number)}
            </span>
            {num.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                <Star className="h-2.5 w-2.5 fill-amber-400" />
                Default
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {countryName}
            {num.number_type ? ` · ${typeLabel(num.number_type)}` : ''}
            {num.region ? ` · ${num.region}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-emerald-400 font-semibold">${retailPrice.toFixed(2)}/mo</span>
            <span className="capitalize text-slate-500">{num.status}</span>
            <span className="text-slate-600">Since {fmtDate(num.purchased_at)}</span>
          </div>
          {/* Billing status */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px]">
            {hasBilling ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400 font-semibold">
                Subscription active
              </span>
            ) : isProviderActive ? (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-400 font-semibold">
                Active
              </span>
            ) : isTrial ? (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-400 font-semibold">
                Trial
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" />
                No subscription
              </span>
            )}
            {num.next_billing_date && (
              <span className={`text-[11px] ${isExpiringSoon ? 'text-amber-400 font-semibold' : 'text-slate-600'}`}>
                {renewDays !== null && renewDays >= 0
                  ? `Renews in ${renewDays}d`
                  : `Expired ${Math.abs(renewDays ?? 0)}d ago`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!num.is_default && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              onClick={handleSetDefault}
              disabled={settingDefault}
            >
              {settingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
              <span className="hidden sm:inline">Default</span>
            </button>
          )}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-600 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            onClick={() => setConfirmRelease(true)}
            disabled={releasing}
            title="Release number"
          >
            {releasing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expiry warning inline */}
      {isExpiringSoon && !hasBilling && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-[11px] text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {isTrial
            ? `Trial ends in ${renewDays}d — add billing to keep this number`
            : `Expires in ${renewDays}d — renew to keep this number`}
        </div>
      )}

      {/* Release confirm */}
      <AnimatePresence>
        {confirmRelease && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-red-400">Release this number?</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isOnlyNumber ? "You'll have no numbers to call from." : 'This cannot be undone.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRelease}
                  className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/25"
                >
                  Release
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
