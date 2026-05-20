'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Signal, Search, Plus, Star, Sparkles,
  CheckCircle2, Loader2, AlertCircle, ChevronDown, X,
  Globe,
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import CountryCard from '@/components/numbers/country-card';
import OwnedNumberCard from '@/components/numbers/owned-number-card';
import AvailableNumberCard from '@/components/numbers/available-number-card';
import CountryFlag from '@/components/numbers/country-flag';
import {
  TELNYX_COUNTRIES, POPULAR_COUNTRIES, getCountryByCode, NUMBER_TYPE_LABELS,
  type TelnyxCountry,
} from '@/lib/telnyx-countries';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── My Numbers tab ──────────────────────────────────────────────────────────

interface MyNumbersProps {
  refreshSignal: number;
  onBuyNew: () => void;
}

function MyNumbers({ refreshSignal, onBuyNew }: MyNumbersProps) {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/numbers/list');
      const data = await res.json();
      setNumbers(data.numbers ?? []);
    } catch {
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshSignal]);

  async function handleSetDefault(id: string) {
    await fetch(`/api/numbers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    await load();
  }

  async function handleRelease(id: string) {
    const res = await fetch(`/api/numbers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) alert(data.error);
    else await load();
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  const active = numbers.filter((n) => n.status === 'active');
  const totalCost = active.reduce((sum, n) => sum + Number(n.monthly_cost), 0);

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Signal className="h-8 w-8 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">No numbers yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Buy a number to start making outbound calls with your own caller ID.
          </p>
        </div>
        <button
          type="button"
          onClick={onBuyNew}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-violet-600/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:from-emerald-600/30"
        >
          <Sparkles className="h-4 w-4" />
          Buy New Number
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
        <span>
          <span className="font-bold text-white">{active.length}</span> active number{active.length !== 1 ? 's' : ''}
        </span>
        <span className="text-slate-700">·</span>
        <span>
          Monthly cost: <span className="font-bold text-white">${totalCost.toFixed(2)}</span>
        </span>
      </div>

      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {active.map((num) => (
          <OwnedNumberCard
            key={num.id}
            num={num}
            isOnlyNumber={active.length === 1}
            onSetDefault={handleSetDefault}
            onRelease={handleRelease}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Region group label ───────────────────────────────────────────────────────

const REGION_ORDER = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Africa & Middle East',
] as const;

// ─── Buy New tab ─────────────────────────────────────────────────────────────

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
  const [toast, setToast] = useState<string | null>(null);
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

  // Build grouped list for "show all" view (no search)
  const groupedCountries: { region: string; countries: TelnyxCountry[] }[] = showAllCountries && !countrySearch
    ? REGION_ORDER.map((region) => ({
        region,
        countries: TELNYX_COUNTRIES.filter((c) => c.region === region),
      })).filter((g) => g.countries.length > 0)
    : [];

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setResults(null);
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
      const data = await res.json();
      if (data.error) setSearchError(data.error);
      else setResults(data.numbers ?? []);
    } catch {
      setSearchError('Could not search for phone numbers');
    } finally {
      setSearching(false);
    }
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
          countryName: selectedCountry.name,
          numberType: type,
          locality: num.city || undefined,
          region: num.state || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      } else {
        setToast(`${fmtPhone(num.phoneNumber)} purchased successfully!`);
        setResults((prev) => prev?.filter((r) => r.phoneNumber !== num.phoneNumber) ?? null);
        onPurchased();
        setTimeout(() => setToast(null), 5000);
      }
    } catch {
      setSearchError('Could not purchase number');
    } finally {
      setBuyingPhone(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Country */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400">1</div>
            <span className="text-sm font-semibold text-white">Select Country</span>
          </div>
          {detectedCountry && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <div className="h-3 w-4 overflow-hidden rounded-[2px]">
                <CountryFlag code={detectedCountry} />
              </div>
              Detected: {detectedCountry}
            </span>
          )}
        </div>

        {/* Country search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => { setCountrySearch(e.target.value); if (e.target.value) setShowAllCountries(true); }}
            placeholder="Search countries…"
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/25"
          />
          {countrySearch && (
            <button type="button" onClick={() => setCountrySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Popular label (no search, not all) */}
        {!countrySearch && !showAllCountries && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Popular</p>
        )}

        {/* Flat grid for popular / search results */}
        {(!showAllCountries || countrySearch) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredCountries.map((c) => (
              <CountryCard
                key={c.code}
                country={c}
                selected={selectedCountry.code === c.code}
                onClick={() => { if (c.is_live) { setSelectedCountry(c); setCountrySearch(''); } }}
              />
            ))}
          </div>
        )}

        {/* Region-grouped grid for "show all" */}
        {showAllCountries && !countrySearch && (
          <div className="space-y-4">
            {groupedCountries.map((group) => (
              <div key={group.region}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">{group.region}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.countries.map((c) => (
                    <CountryCard
                      key={c.code}
                      country={c}
                      selected={selectedCountry.code === c.code}
                      onClick={() => { if (c.is_live) { setSelectedCountry(c); } }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show all toggle */}
        {!countrySearch && (
          <button
            type="button"
            onClick={() => setShowAllCountries((v) => !v)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"
          >
            {showAllCountries ? 'Show fewer countries' : `Show all ${TELNYX_COUNTRIES.length} countries`}
            <ChevronDown className={`h-3 w-3 transition-transform ${showAllCountries ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Step 2: Number Type */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400">2</div>
          <span className="text-sm font-semibold text-white">Number Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['local', 'toll_free', 'mobile', 'national'] as const).map((t) => {
            const supported = selectedCountry.types.includes(t);
            return (
              <button
                key={t}
                type="button"
                disabled={!supported}
                onClick={() => setType(t)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                  type === t && supported
                    ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-300'
                    : supported
                    ? 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-white'
                    : 'cursor-not-allowed border-white/[0.03] text-slate-700'
                }`}
              >
                {NUMBER_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-600">
          {selectedCountry.name} supports: {selectedCountry.types.map((t) => NUMBER_TYPE_LABELS[t]).join(', ')}
        </p>
      </div>

      {/* Step 3: Filters */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500/15 text-[11px] font-bold text-slate-500">3</div>
          <span className="text-sm font-semibold text-white">Filters</span>
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-600">Optional</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {selectedCountry.supportsAreaCode && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500">Area Code</label>
              <input
                type="text"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415"
                maxLength={3}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/25"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500">City / Region</label>
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. New York"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/25"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500">Number Contains</label>
            <input
              type="text"
              value={numberContains}
              onChange={(e) => setNumberContains(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 777"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/25"
            />
          </div>
        </div>
      </div>

      {/* Search button */}
      <button
        type="button"
        onClick={handleSearch}
        disabled={searching}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/10 py-3.5 text-sm font-bold text-emerald-300 transition hover:from-emerald-600/30 disabled:opacity-60"
      >
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
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {searchError}
        </div>
      )}

      {/* Skeleton */}
      {searching && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      )}

      {/* Results */}
      {results !== null && !searching && (
        results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-14 text-center">
            <Signal className="h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No numbers found</p>
            <p className="text-xs text-slate-600">Try a different area code or remove the filters.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            initial="hidden"
            animate="show"
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
    <>
      <DashboardHeader
        title="My Numbers"
        subtitle="Manage your calling identity across countries"
      />
      <main className="flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1 border-b border-white/[0.08]">
            {([
              { key: 'my', label: 'My Numbers' },
              { key: 'buy', label: 'Buy New Number' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === key
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'my' && (
            <button
              type="button"
              onClick={() => setTab('buy')}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-violet-600/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:from-emerald-600/30"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Buy New Number
            </button>
          )}
        </div>

        {tab === 'my'
          ? <MyNumbers refreshSignal={refreshSignal} onBuyNew={() => setTab('buy')} />
          : <BuyNew onPurchased={handlePurchased} />}
      </main>
    </>
  );
}
