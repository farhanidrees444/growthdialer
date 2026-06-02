'use client';

import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import CountryFlag from './country-flag';
import { NUMBER_TYPE_LABELS } from '@/lib/telnyx-countries';

interface AvailableNumber {
  phoneNumber: string;
  type: string;
  city: string;
  state: string;
  monthlyCost: number;
  currency: string;
}

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

interface AvailableNumberCardProps {
  num: AvailableNumber;
  countryCode: string;
  buyingPhone: string | null;
  onBuy: (num: AvailableNumber) => void;
}

export default function AvailableNumberCard({ num, countryCode, buyingPhone, onBuy }: AvailableNumberCardProps) {
  const isBuying = buyingPhone === num.phoneNumber;
  const typeLabel = NUMBER_TYPE_LABELS[num.type] ?? num.type;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-emerald-500/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px]">
              <CountryFlag code={countryCode} />
            </div>
            <p className="font-mono text-sm font-bold text-white">{fmtPhone(num.phoneNumber)}</p>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {[num.city, num.state].filter(Boolean).join(') || ', 'Available'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-500">
              {typeLabel}
            </span>
            <span className="text-xs font-semibold text-emerald-400">${num.monthlyCost.toFixed(2)}/mo</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onBuy(num)}
          disabled={buyingPhone !== null}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-50"
        >
          {isBuying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Buy
        </button>
      </div>
    </motion.div>
  );
}
