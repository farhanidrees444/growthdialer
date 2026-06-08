'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Plus,
  CheckCircle2, Loader2, AlertCircle, ChevronDown,
  X, Search, Signal,
} from 'lucide-react';
import CountryCard from '@/components/numbers/country-card';
import AvailableNumberCard from '@/components/numbers/available-number-card';
import CountryFlag from '@/components/numbers/country-flag';
import { MyNumbersPanel } from '@/components/numbers/my-numbers-panel';
import { PageHeader } from '@/components/ui/page-header';
import {
  TELNYX_COUNTRIES, POPULAR_COUNTRIES, NUMBER_TYPE_LABELS,
  type TelnyxCountry,
} from '@/lib/telnyx-countries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableNumber {
  phoneNumber: string;
  type: string;
  city: string;
  state: string;
  monthlyCost: number;
  currency: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

// ─── Region ordering for Buy New ─────────────────────────────────────────────

const REGION_ORDER = [
  'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Africa & Middle East',
] as const;

// ─── Buy New tab ──────────────────────────────────────────────────────────────

function BuyNew({ onPurchased }: { onPurchased: () => void }) {
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<TelnyxCountry>(POPULAR_COUNTRIES[0]);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [type, setType] = useState<'local' | 'toll_free' | 'mobile' | 'national'>('local');
  const [areaCode, setAreaCode] = useState('');
  const [locality, setLocality] = useState('');
  const [numberContains, setNumberContains] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AvailableNumber[] | null>(null);
  const [buyingPhone, setBuyingPhone] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasDetected = useRef(false);

  useEffect(() => {
    if (hasDetected.current) return;
    hasDetected.current = true;
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const code = data?.country_code;
        if (!code) return;
        setDetectedCountry(code);
        const found = TELNYX_COUNTRIES.find((c) => c.code === code && c.is_live);
        if (found) setSelectedCountry(found);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCountry.types.includes(type as never)) {
      setType(selectedCountry.types[0] as typeof type);
    }
    setResults(null);
  }, [selectedCountry, type]);

  const baseList = showAllCountries ? TELNYX_COUNTRIES : POPULAR_COUNTRIES;
  const filteredCountries = countrySearch
    ? TELNYX_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase()),
      )
    : baseList;

  const groupedCountries =
    showAllCountries && !countrySearch
      ? REGION_ORDER.map((region) => ({
          region,
          countries: TELNYX_COUNTRIES.filter((c) => c.region === region),
        })).filter((g) => g.countries.length > 0)
      : [];

  async function handleSearch() {
    setSearching(true); setSearchError(null); setResults(null);
    try {
      const res = await fetch('/api/numbers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry.code,
          areaCode: areaCode || undefined,
          locality: locality || undefined,
          numberContains: numberContains || undefined,
          type,
        }),
      });
      const data = await res.json() as { numbers?: AvailableNumber[]; error?: string };
      if (data.error) setSearchError(data.error);
      else setResults(data.numbers ?? []);
    } catch {
      setSearchError('Could not search for phone numbers');
    } finally { setSearching(false); }
  }

  async function handleBuy(num: AvailableNumber) {
    setBuyingPhone(num.phoneNumber);
    try {
      const res = await fetch('/api/numbers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: num.phoneNumber,
          monthlyCost: num.monthlyCost,
          country: selectedCountry.code,
          numberType: type,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.error) setSearchError(data.error);
      else {
        setSuccessMsg(`${fmtPhone(num.phoneNumber)} purchased successfully!`);
        setResults((prev) => prev?.filter((r) => r.phoneNumber !== num.phoneNumber) ?? null);
        onPurchased();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch {
      setSearchError('Could not purchase number');
    } finally { setBuyingPhone(null); }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Country */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-400">1</div>
            <span className="text-sm font-semibold text-white">Select Country</span>
          </div>
          {detectedCountry && (
            <span className="flex items-center gap-1.5 text-[11px] text-white/30">
              <div className="h-3 w-4 overflow-hidden rounded-[2px]"><CountryFlag code={detectedCountry} /></div>
              Detected: {detectedCountry}
            </span>
          )}
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text" value={countrySearch}
            onChange={(e) => { setCountrySearch(e.target.value); if (e.target.value) setShowAllCountries(true); }}
            placeholder="Search countries…"
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
          />
          {countrySearch && (
            <button type="button" onClick={() => setCountrySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {!countrySearch && !showAllCountries && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">Popular</p>
        )}
        {(!showAllCountries || countrySearch) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredCountries.map((c) => (
              <CountryCard key={c.code} country={c} selected={selectedCountry.code === c.code}
                onClick={() => { if (c.is_live) { setSelectedCountry(c); setCountrySearch(''); } }} />
            ))}
          </div>
        )}
        {showAllCountries && !countrySearch && (
          <div className="space-y-4">
            {groupedCountries.map((group) => (
              <div key={group.region}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{group.region}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.countries.map((c) => (
                    <CountryCard key={c.code} country={c} selected={selectedCountry.code === c.code}
                      onClick={() => { if (c.is_live) setSelectedCountry(c); }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {!countrySearch && (
          <button type="button" onClick={() => setShowAllCountries((v) => !v)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-white/30 transition hover:text-white/60">
            {showAllCountries ? 'Show fewer countries' : `Show all ${TELNYX_COUNTRIES.length} countries`}
            <ChevronDown className={`h-3 w-3 transition-transform ${showAllCountries ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Step 2: Number Type */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-400">2</div>
          <span className="text-sm font-semibold text-white">Number Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['local', 'toll_free', 'mobile', 'national'] as const).map((t) => {
            const supported = selectedCountry.types.includes(t);
            return (
              <button key={t} type="button" disabled={!supported} onClick={() => setType(t)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                  type === t && supported
                    ? 'border-violet-500/40 bg-violet-500/[0.08] text-violet-300'
                    : supported
                    ? 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:text-white/80'
                    : 'cursor-not-allowed border-white/[0.03] text-white/20'
                }`}>
                {NUMBER_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-white/30">
          {selectedCountry.name} supports: {selectedCountry.types.map((t) => NUMBER_TYPE_LABELS[t]).join(', ')}
        </p>
      </div>

      {/* Step 3: Filters */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-white/40">3</div>
          <span className="text-sm font-semibold text-white">Filters</span>
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/30">Optional</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {selectedCountry.supportsAreaCode && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-white/40">Area Code</label>
              <input
                type="text" value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415" maxLength={3}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40">City / Region</label>
            <input
              type="text" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="e.g. New York"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40">Number Contains</label>
            <input
              type="text" value={numberContains}
              onChange={(e) => setNumberContains(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 777"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
            />
          </div>
        </div>
      </div>

      {/* Search button */}
      <button type="button" onClick={() => void handleSearch()} disabled={searching}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.5),rgba(6,182,212,0.4))', border: '1px solid rgba(139,92,246,0.3)' }}>
        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        <span className="flex items-center gap-1.5">
          Search Available Numbers in
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3.5 w-5 overflow-hidden rounded-[2px]">
              <CountryFlag code={selectedCountry.code} />
            </span>
            {selectedCountry.name}
          </span>
        </span>
      </button>

      {/* Error */}
      {searchError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {searchError}
        </div>
      )}

      {/* Skeleton */}
      {searching && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      )}

      {/* Results */}
      {results !== null && !searching && (
        results.length === 0
          ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-14 text-center">
              <Signal className="h-8 w-8 text-white/20" />
              <p className="text-sm font-semibold text-white/50">No numbers found</p>
              <p className="text-xs text-white/30">Try a different area code or remove the filters.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              {results.map((num) => (
                <AvailableNumberCard
                  key={num.phoneNumber}
                  num={num}
                  countryCode={selectedCountry.code}
                  buyingPhone={buyingPhone}
                  onBuy={handleBuy}
                />
              ))}
            </motion.div>
          )
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NumbersPage() {
  const [tab, setTab] = useState<'my' | 'buy'>('my');
  const [refreshSignal, setRefreshSignal] = useState(0);

  function handlePurchased() {
    setRefreshSignal((s) => s + 1);
    setTab('my');
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="My Numbers"
          description="Monitor caller ID health, carrier reputation, and rotation across your outbound lines."
          icon={Phone}
          badge="Deliverability"
        >
          {tab === 'my' && (
            <button
              type="button"
              onClick={() => setTab('buy')}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-600/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-600"
            >
              <Plus className="h-4 w-4" /> Buy number
            </button>
          )}
        </PageHeader>

        <div className="mb-6 flex gap-1 border-b border-white/[0.06]">
          {([
            { key: 'my', label: 'Inventory' },
            { key: 'buy', label: 'Buy new' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === key
                  ? 'border-violet-500 text-violet-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'my' ? (
          <MyNumbersPanel refreshSignal={refreshSignal} onBuyNew={() => setTab('buy')} />
        ) : (
          <BuyNew onPurchased={handlePurchased} />
        )}
      </div>
    </main>
  );
}
