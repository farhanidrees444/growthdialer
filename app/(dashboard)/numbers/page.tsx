'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, RefreshCw, Plus, Star, Copy, Trash2,
  BarChart2, CheckCircle2, Loader2, AlertCircle, ChevronDown,
  X, AlertTriangle, Globe, Zap, Clock, Shield,
  Search, Sparkles, Signal, Settings2,
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import CountryCard from '@/components/numbers/country-card';
import AvailableNumberCard from '@/components/numbers/available-number-card';
import CountryFlag from '@/components/numbers/country-flag';
import { toast } from 'sonner';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import {
  TELNYX_COUNTRIES, POPULAR_COUNTRIES, NUMBER_TYPE_LABELS,
  type TelnyxCountry,
} from '@/lib/telnyx-countries';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NumberStats {
  total_calls: number;
  connected_calls: number;
  connect_rate: number;
  last_used: string | null;
}

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
  stats?: NumberStats;
}

interface AvailableNumber {
  phoneNumber: string;
  type: string;
  city: string;
  state: string;
  monthlyCost: number;
  currency: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ─── Premium Number Card ───────────────────────────────────────────────────────

interface NumberCardProps {
  num: PurchasedNumber;
  isOnlyNumber: boolean;
  onSetDefault: (id: string) => Promise<void>;
  onRelease: (id: string) => Promise<void>;
}

function NumberCard({ num, isOnlyNumber, onSetDefault, onRelease }: NumberCardProps) {
  const [settingDefault, setSettingDefault] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [copied, setCopied] = useState(false);

  const retailPrice = calculateRetailPrice(Number(num.monthly_cost));
  const renewDays = daysUntil(num.next_billing_date);
  const isExpiringSoon = renewDays !== null && renewDays <= 7 && renewDays >= 0;
  const hasBilling = !!num.stripe_subscription_id;
  const billingStatus = num.billing_status ?? 'unpaid';
  const isProviderActive = billingStatus === 'active' && !hasBilling;
  const isTrial = billingStatus === 'trial';

  const stats = num.stats ?? { total_calls: 0, connected_calls: 0, connect_rate: 0, last_used: null };

  async function handleSetDefault() {
    setSettingDefault(true);
    try { await onSetDefault(num.id); } finally { setSettingDefault(false); }
  }

  async function handleRelease() {
    setReleasing(true);
    setConfirmRelease(false);
    try { await onRelease(num.id); } finally { setReleasing(false); }
  }

  function handleCopy() {
    void navigator.clipboard.writeText(num.phone_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative rounded-2xl border p-5 transition-all duration-200 ${
        isExpiringSoon
          ? 'border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'
      }`}
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(ellipse_at_top_left,oklch(0.5_0.2_145_/_0.04),transparent_60%)]" />

      <div className="relative flex items-start gap-4">

        {/* Icon */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.12))',
            border: '1px solid rgba(139,92,246,0.18)',
          }}
        >
          <Phone className="h-5 w-5 text-violet-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">

          {/* Number row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[17px] font-bold text-white tracking-wide">
              {fmtPhone(num.phone_number)}
            </span>
            {num.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                <Star className="h-2.5 w-2.5 fill-cyan-400" />
                DEFAULT
              </span>
            )}
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all text-[10px]"
              title="Copy number"
            >
              <Copy className="h-3 w-3" />
              {copied && <span>Copied!</span>}
            </button>
          </div>

          {/* Meta */}
          <p className="mt-0.5 text-xs text-white/40">
            {num.country_name ?? num.country}
            {num.number_type ? ` · ${NUMBER_TYPE_LABELS[num.number_type] ?? num.number_type}` : ''}
            {num.region ? ` · ${num.region}` : ''}
            {' · '}
            <span className="text-white/60 font-medium">${retailPrice.toFixed(2)}/mo</span>
          </p>

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
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" />
                No subscription
              </span>
            )}
            {num.next_billing_date && (
              <span className={`${isExpiringSoon ? 'text-amber-400 font-semibold' : 'text-white/30'}`}>
                {renewDays !== null && renewDays >= 0
                  ? `Renews in ${renewDays}d`
                  : `Expired ${Math.abs(renewDays ?? 0)}d ago`}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Calls', value: stats.total_calls.toLocaleString(), icon: Phone },
              { label: 'Connect Rate', value: `${stats.connect_rate}%`, icon: Zap, highlight: stats.connect_rate >= 20 },
              { label: 'Last Used', value: stats.last_used ? fmtDate(stats.last_used) : 'Never', icon: Clock },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-0.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <p className="text-[9px] uppercase tracking-wider text-white/30">{stat.label}</p>
                <p className={`text-sm font-semibold tabular-nums ${stat.highlight ? 'text-emerald-400' : 'text-white/80'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top-right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!num.is_default && (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={settingDefault}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {settingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
              <span className="hidden sm:inline">Default</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmRelease(true)}
            disabled={releasing}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/30 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            title="Release number"
          >
            {releasing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expiry warning */}
      {isExpiringSoon && !hasBilling && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] text-amber-300">
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
            <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-red-400">Release this number?</p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  {isOnlyNumber ? "You'll have no numbers to call from." : 'This cannot be undone.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/50 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRelease}
                  className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/25 transition"
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

// ─── My Numbers tab ─────────────────────────────────────────────────────────

interface MyNumbersProps {
  refreshSignal: number;
  onBuyNew: () => void;
}

function MyNumbers({ refreshSignal, onBuyNew }: MyNumbersProps) {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/numbers/list');
      const data = await res.json() as { numbers?: PurchasedNumber[]; error?: string };
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

  useEffect(() => { void load(); }, [load, refreshSignal]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/numbers/sync', { method: 'POST' });
      const data = await res.json() as { synced?: number; error?: string };
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Synced ${data.synced ?? 0} number${(data.synced ?? 0) !== 1 ? 's' : ''} from your account`);
        await load();
      }
    } catch {
      toast.error('Sync failed — check your connection');
    } finally {
      setSyncing(false);
    }
  }

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
    const data = await res.json() as { error?: string };
    if (data.error) toast.error(data.error);
    else await load();
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[168px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        ))}
      </div>
    );
  }

  const active = numbers.filter((n) => n.status !== 'released');
  const totalCost = active.reduce((sum, n) => sum + calculateRetailPrice(Number(n.monthly_cost)), 0);

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))' }}
        >
          <Phone className="h-7 w-7 text-violet-400/60" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">No numbers yet</p>
          <p className="mt-1 text-xs text-white/40 max-w-xs">
            Buy a number or sync existing ones to start making calls with your own caller ID.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:border-white/[0.14] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Numbers'}
          </button>
          <button
            type="button"
            onClick={onBuyNew}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
          >
            <Plus className="h-4 w-4" />
            Buy Number
          </button>
        </div>
      </div>
    );
  }

  const expiringNumbers = active.filter((n) => {
    if (!n.next_billing_date || n.stripe_subscription_id) return false;
    const days = Math.ceil((new Date(n.next_billing_date).getTime() - Date.now()) / 86400000);
    return days <= 7 && days >= 0;
  });

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Expiry warning banner */}
      {expiringNumbers.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400 w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-300">
                {expiringNumbers.length} number{expiringNumbers.length > 1 ? 's' : ''} expire{expiringNumbers.length === 1 ? 's' : ''} soon
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                Numbers without an active subscription are released after 30 days.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs text-amber-300 hover:text-white border border-amber-500/40 rounded-lg px-3 py-1.5 transition"
              onClick={() => toast.info('Billing setup coming soon')}
            >
              Set up billing →
            </button>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-white/40">
        <span>
          <span className="font-bold text-white">{active.length}</span> active number{active.length !== 1 ? 's' : ''}
        </span>
        <span className="text-white/10">·</span>
        <span>
          Monthly cost: <span className="font-bold text-white">${totalCost.toFixed(2)}</span>
        </span>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium transition hover:border-white/[0.16] hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Numbers'}
        </button>
      </div>

      {/* Cards */}
      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      >
        {active.map((num) => (
          <NumberCard
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

// ─── Region group label ────────────────────────────────────────────────────────

const REGION_ORDER = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Africa & Middle East',
] as const;

// ─── Buy New tab ───────────────────────────────────────────────────────────────

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

  const groupedCountries: { region: string; countries: TelnyxCountry[] }[] =
    showAllCountries && !countrySearch
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
      const data = await res.json() as { numbers?: AvailableNumber[]; error?: string };
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
      const data = await res.json() as { success?: boolean; error?: string; warning?: string };
      if (data.error) {
        setSearchError(data.error);
      } else {
        setSuccessMsg(`${fmtPhone(num.phoneNumber)} purchased successfully!`);
        setResults((prev) => prev?.filter((r) => r.phoneNumber !== num.phoneNumber) ?? null);
        onPurchased();
        setTimeout(() => setSuccessMsg(null), 5000);
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
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg}
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
              <div className="h-3 w-4 overflow-hidden rounded-[2px]">
                <CountryFlag code={detectedCountry} />
              </div>
              Detected: {detectedCountry}
            </span>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={countrySearch}
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
              <CountryCard
                key={c.code}
                country={c}
                selected={selectedCountry.code === c.code}
                onClick={() => { if (c.is_live) { setSelectedCountry(c); setCountrySearch(''); } }}
              />
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

        {!countrySearch && (
          <button
            type="button"
            onClick={() => setShowAllCountries((v) => !v)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-white/30 transition hover:text-white/60"
          >
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
              <button
                key={t}
                type="button"
                disabled={!supported}
                onClick={() => setType(t)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                  type === t && supported
                    ? 'border-violet-500/40 bg-violet-500/[0.08] text-violet-300'
                    : supported
                    ? 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:text-white/80'
                    : 'cursor-not-allowed border-white/[0.03] text-white/20'
                }`}
              >
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
                type="text"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415"
                maxLength={3}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40">City / Region</label>
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. New York"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40">Number Contains</label>
            <input
              type="text"
              value={numberContains}
              onChange={(e) => setNumberContains(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 777"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
            />
          </div>
        </div>
      </div>

      {/* Search button */}
      <button
        type="button"
        onClick={handleSearch}
        disabled={searching}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(6,182,212,0.4))', border: '1px solid rgba(139,92,246,0.3)' }}
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
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {searchError}
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
        results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-14 text-center">
            <Signal className="h-8 w-8 text-white/20" />
            <p className="text-sm font-semibold text-white/50">No numbers found</p>
            <p className="text-xs text-white/30">Try a different area code or remove the filters.</p>
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

// ─── Page ──────────────────────────────────────────────────────────────────────

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
          <div className="flex gap-1 border-b border-white/[0.06]">
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
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-white/40 hover:text-white/70'
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
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.3))', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <Plus className="h-3.5 w-3.5" />
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
