'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Plus, Star, Copy, Trash2,
  CheckCircle2, Loader2, AlertCircle, ChevronDown,
  X, AlertTriangle, Zap, Clock, Shield,
  Search, Signal, TrendingUp, Edit2, Check,
} from 'lucide-react';
import CountryCard from '@/components/numbers/country-card';
import AvailableNumberCard from '@/components/numbers/available-number-card';
import CountryFlag from '@/components/numbers/country-flag';
import { toast } from 'sonner';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import {
  TELNYX_COUNTRIES, POPULAR_COUNTRIES, NUMBER_TYPE_LABELS,
  type TelnyxCountry,
} from '@/lib/telnyx-countries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NumberStats {
  total_calls: number;
  connected: number;
  connect_rate: number;
  last_used: string | null;
}

interface PurchasedNumber {
  id: string;
  phone_number: string;
  telnyx_number_id: string | null;
  country: string;
  number_type: string | null;
  monthly_cost: number;
  is_default: boolean;
  status: string;
  purchased_at: string;
  billing_status: string | null;
  next_billing_date: string | null;
  auto_renew: boolean | null;
  stripe_subscription_id: string | null;
  spam_score: number | null;
  last_spam_check: string | null;
  label: string | null;
  health_score: number | null;
  spam_status: string | null;
  stats?: NumberStats;
  computed_health?: number;
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

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ─── Spam config ──────────────────────────────────────────────────────────────

const SPAM_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  clean:    { label: 'Clean',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
  low_risk: { label: 'Low Risk', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/15' },
  flagged:  { label: 'Flagged',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/15' },
  blocked:  { label: 'Blocked',  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/15' },
};

// ─── Number Card ──────────────────────────────────────────────────────────────

interface NumberCardProps {
  num: PurchasedNumber;
  isOnlyNumber: boolean;
  onSetDefault: (id: string) => Promise<void>;
  onRelease: (id: string) => Promise<void>;
  onSpamCheck: (id: string) => Promise<void>;
  onLabelSave: (id: string, label: string) => Promise<void>;
}

function NumberCard({ num, isOnlyNumber, onSetDefault, onRelease, onSpamCheck, onLabelSave }: NumberCardProps) {
  const [settingDefault, setSettingDefault] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [checkingSpam, setCheckingSpam] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(num.label ?? '');

  const retailPrice = calculateRetailPrice(Number(num.monthly_cost));
  const health = num.computed_health ?? 100;
  const spamStatus = num.spam_status ?? 'clean';
  const spam = SPAM_CONFIG[spamStatus] ?? SPAM_CONFIG.clean;
  const stats = num.stats ?? { total_calls: 0, connected: 0, connect_rate: 0, last_used: null };
  const renewDays = daysUntil(num.next_billing_date);
  const isExpiringSoon = renewDays !== null && renewDays <= 7 && renewDays >= 0;
  const hasBilling = !!num.stripe_subscription_id;

  const healthColor = health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-red-400';
  const healthBar   = health >= 80 ? 'bg-emerald-500' : health >= 50 ? 'bg-amber-500' : 'bg-red-500';

  async function handleSetDefault() {
    setSettingDefault(true);
    try { await onSetDefault(num.id); } finally { setSettingDefault(false); }
  }
  async function handleRelease() {
    setReleasing(true); setConfirmRelease(false);
    try { await onRelease(num.id); } finally { setReleasing(false); }
  }
  async function handleSpamCheck() {
    setCheckingSpam(true);
    try { await onSpamCheck(num.id); } finally { setCheckingSpam(false); }
  }
  function handleCopy() {
    void navigator.clipboard.writeText(num.phone_number);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  async function handleLabelSave() {
    await onLabelSave(num.id, labelVal);
    setEditingLabel(false);
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isExpiringSoon && !hasBilling
          ? 'border-amber-500/30 bg-amber-500/[0.025]'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'
      }`}
    >
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(ellipse_at_top_left,oklch(0.5_0.2_280_/_0.05),transparent_60%)]" />

      <div className="relative">

        {/* ── Top row ── */}
        <div className="flex items-start gap-3">

          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.14),rgba(6,182,212,0.14))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Phone className="h-5 w-5 text-violet-400" />
          </div>

          {/* Number + label */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base sm:text-[17px] font-bold text-white tracking-wide">
                {fmtPhone(num.phone_number)}
              </span>
              {num.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  <Star className="h-2.5 w-2.5 fill-cyan-400" /> DEFAULT
                </span>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all text-[10px]"
              >
                <Copy className="h-3 w-3" />
                {copied && <span>Copied!</span>}
              </button>
            </div>

            {/* Editable label */}
            <div className="mt-1 flex items-center gap-1.5">
              {editingLabel ? (
                <>
                  <input
                    autoFocus
                    value={labelVal}
                    onChange={(e) => setLabelVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleLabelSave(); if (e.key === 'Escape') setEditingLabel(false); }}
                    placeholder="e.g. Sales Line"
                    className="h-6 w-32 rounded-md border border-cyan-500/30 bg-white/[0.05] px-2 text-xs focus:outline-none"
                  />
                  <button onClick={() => void handleLabelSave()} className="text-emerald-400 hover:text-emerald-300"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditingLabel(false)} className="text-white/40 hover:text-white/70"><X className="h-3.5 w-3.5" /></button>
                </>
              ) : (
                <button
                  onClick={() => setEditingLabel(true)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  {num.label
                    ? <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-white/60">{num.label}</span>
                    : <span className="text-white/25 italic">Add label</span>}
                  <Edit2 className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Release button */}
          <button
            onClick={() => setConfirmRelease(true)}
            disabled={releasing}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/25 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
          >
            {releasing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* ── Meta ── */}
        <p className="mt-2.5 text-[11px] text-white/40">
          {NUMBER_TYPE_LABELS[num.number_type ?? ''] ?? num.number_type ?? 'Local'}
          {' · '}{num.country}
          {' · '}<span className="text-white/60 font-medium">${retailPrice.toFixed(2)}/mo</span>
          {num.billing_status === 'active'
            ? <span className="ml-2 text-emerald-400">Active</span>
            : <span className="ml-2 text-amber-400">No subscription</span>}
        </p>

        {/* ── Stats grid ── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Calls 30d',    value: stats.total_calls.toLocaleString(), icon: Phone,     color: 'text-white/80' },
            { label: 'Connect Rate', value: `${stats.connect_rate}%`,           icon: TrendingUp, color: stats.connect_rate >= 20 ? 'text-emerald-400' : 'text-white/80' },
            { label: 'Health',       value: `${health}%`,                       icon: Zap,        color: healthColor },
            { label: 'Spam Status',  value: spam.label,                         icon: Shield,     color: spam.color, bg: spam.bg, border: spam.border },
          ].map((stat) => (
            <div key={stat.label}
              className={`rounded-xl border px-3 py-2.5 ${stat.bg ?? 'bg-white/[0.02]'} ${stat.border ?? 'border-white/[0.05]'}`}>
              <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">{stat.label}</p>
              <p className={`text-sm font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Health bar ── */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
          <div className={`h-full rounded-full transition-all duration-500 ${healthBar}`} style={{ width: `${health}%` }} />
        </div>

        {/* ── Billing expiry warning ── */}
        {isExpiringSoon && !hasBilling && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {renewDays === 0 ? 'Expires today' : `Expires in ${renewDays}d`} — add billing to keep this number
          </div>
        )}

        {/* ── Actions footer ── */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-2">
            {!num.is_default && (
              <button
                onClick={() => void handleSetDefault()}
                disabled={settingDefault}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                {settingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
                <span>Set Default</span>
              </button>
            )}
            <button
              onClick={() => void handleSpamCheck()}
              disabled={checkingSpam}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-white/50 transition hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-50"
            >
              {checkingSpam ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
              <span>Check Spam</span>
            </button>
          </div>
          <span className="text-[10px] text-white/25">
            {stats.last_used ? `Last used ${fmtDate(stats.last_used)}` : 'Never used'}
          </span>
        </div>

        {/* ── Release confirm ── */}
        <AnimatePresence>
          {confirmRelease && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-red-400">Release this number?</p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {isOnlyNumber ? "You'll have no numbers to call from." : 'This cannot be undone.'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setConfirmRelease(false)}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/50 hover:text-white transition">
                    Cancel
                  </button>
                  <button onClick={() => void handleRelease()}
                    className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/25 transition">
                    Release
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── My Numbers tab ────────────────────────────────────────────────────────────

interface MyNumbersProps {
  refreshSignal: number;
  onBuyNew: () => void;
}

function MyNumbers({ refreshSignal, onBuyNew }: MyNumbersProps) {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/numbers/list');
      const data = await res.json() as { numbers?: PurchasedNumber[]; error?: string };
      if (data.error) { toast.error(data.error); setNumbers([]); }
      else setNumbers(data.numbers ?? []);
    } catch {
      setNumbers([]); toast.error('Failed to load numbers');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load, refreshSignal]);

  async function handleSetDefault(id: string) {
    await fetch(`/api/numbers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    await load();
  }

  async function handleRelease(id: string) {
    const res = await fetch(`/api/numbers/${id}`, { method: 'DELETE' });
    const data = await res.json() as { error?: string };
    if (data.error) toast.error(data.error);
    else { toast.success('Number released'); await load(); }
  }

  async function handleSpamCheck(id: string) {
    const res = await fetch(`/api/numbers/${id}/spam-check`, { method: 'POST' });
    const data = await res.json() as { spam_status?: string; error?: string };
    if (data.error) toast.error(data.error);
    else { toast.success(`Spam status: ${data.spam_status}`); await load(); }
  }

  async function handleLabelSave(id: string, label: string) {
    const res = await fetch(`/api/numbers/${id}/label`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const data = await res.json() as { error?: string };
    if (data.error) toast.error(data.error);
    else { toast.success('Label saved'); await load(); }
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        ))}
      </div>
    );
  }

  const active = numbers.filter((n) => n.status !== 'released');

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(6,182,212,0.08))' }}>
          <Phone className="h-7 w-7 text-violet-400/60" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">No numbers yet</p>
          <p className="mt-1 text-xs text-white/40 max-w-xs">
            Buy a number to start making outbound calls with your own caller ID.
          </p>
        </div>
        <button onClick={onBuyNew}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,hsl(262,80%,50%),hsl(186,100%,42%))' }}>
          <Plus className="h-4 w-4" /> Buy Number
        </button>
      </div>
    );
  }

  const totalCost = active.reduce((s, n) => s + calculateRetailPrice(Number(n.monthly_cost)), 0);
  const avgHealth = Math.round(active.reduce((s, n) => s + (n.computed_health ?? 100), 0) / active.length);
  const expiringCount = active.filter((n) => {
    if (!n.next_billing_date || n.stripe_subscription_id) return false;
    const d = daysUntil(n.next_billing_date);
    return d !== null && d <= 7 && d >= 0;
  }).length;

  const filtered = search
    ? active.filter((n) =>
        n.phone_number.includes(search) ||
        (n.label ?? '').toLowerCase().includes(search.toLowerCase()))
    : active;

  return (
    <div className="space-y-4 max-w-4xl">

      {/* Expiry warning */}
      {expiringCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-300">
                {expiringCount} number{expiringCount > 1 ? 's' : ''} expire{expiringCount === 1 ? 's' : ''} soon
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                Numbers without an active subscription are released after 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-white/40">
        <span><span className="font-bold text-white">{active.length}</span> active number{active.length !== 1 ? 's' : ''}</span>
        <span className="text-white/10 hidden sm:inline">·</span>
        <span>Monthly: <span className="font-bold text-white">${totalCost.toFixed(2)}</span></span>
        <span className="text-white/10 hidden sm:inline">·</span>
        <span>Avg health: <span className={`font-bold ${avgHealth >= 80 ? 'text-emerald-400' : avgHealth >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{avgHealth}%</span></span>
      </div>

      {/* Search */}
      {active.length > 2 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number or label…"
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/25"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Cards — 1 col mobile, 2 col lg+ */}
      <motion.div
        className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {filtered.map((num) => (
          <NumberCard
            key={num.id}
            num={num}
            isOnlyNumber={active.length === 1}
            onSetDefault={handleSetDefault}
            onRelease={handleRelease}
            onSpamCheck={handleSpamCheck}
            onLabelSave={handleLabelSave}
          />
        ))}
      </motion.div>

      {filtered.length === 0 && search && (
        <p className="py-10 text-center text-sm text-white/30">No numbers match "{search}"</p>
      )}
    </div>
  );
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
    <main className="flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-5">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-1 border-b border-white/[0.06]">
            {([
              { key: 'my', label: 'My Numbers' },
              { key: 'buy', label: 'Buy New Number' },
            ] as const).map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === key
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'my' && (
            <button type="button" onClick={() => setTab('buy')}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 w-full sm:w-auto justify-center sm:justify-start"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.3))', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Plus className="h-3.5 w-3.5" /> Buy New Number
            </button>
          )}
        </div>

        {tab === 'my'
          ? <MyNumbers refreshSignal={refreshSignal} onBuyNew={() => setTab('buy')} />
          : <BuyNew onPurchased={handlePurchased} />}
    </main>
  );
}
