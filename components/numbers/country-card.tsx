'use client';

import { CheckCircle2 } from 'lucide-react';
import CountryFlag from './country-flag';
import type { TelnyxCountry } from '@/lib/telnyx-countries';

interface CountryCardProps {
  country: TelnyxCountry;
  selected: boolean;
  onClick: () => void;
}

export default function CountryCard({ country, selected, onClick }: CountryCardProps) {
  if (!country.is_live) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] px-3.5 py-3 opacity-50 cursor-not-allowed">
        <div className="h-7 w-10 shrink-0 overflow-hidden rounded-sm">
          <CountryFlag code={country.code} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-500">{country.name}</p>
          <span className="inline-block rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
        selected
          ? 'border-emerald-500/40 bg-emerald-500/[0.08] shadow-[0_0_0_1px_oklch(0.5_0.2_145_/_0.15)]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
      }`}
    >
      <div className="h-7 w-10 shrink-0 overflow-hidden rounded-sm">
        <CountryFlag code={country.code} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${selected ? 'text-white' : ', 'text-slate-300'}`}>
          {country.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-block rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
            Available
          </span>
          <span className="text-[10px] text-slate-600">from ${country.price.toFixed(2)}/mo</span>
        </div>
      </div>
      {selected && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      )}
    </button>
  );
}
