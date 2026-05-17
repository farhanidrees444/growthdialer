"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import {
  Hash, Search, Plus, Star, Trash2, Phone,
  CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchasedNumber {
  id: string;
  phone_number: string;
  country: string;
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

function formatPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── My Numbers tab ───────────────────────────────────────────────────────────

function MyNumbers({ refreshSignal }: { refreshSignal: number }) {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/numbers/list");
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
    setSettingDefaultId(id);
    try {
      await fetch(`/api/numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      await load();
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleRelease(id: string, phone: string) {
    if (!confirm(`Release ${formatPhone(phone)}? This cannot be undone.`)) return;
    setReleasingId(id);
    try {
      const res = await fetch(`/api/numbers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) alert(data.error);
      else await load();
    } finally {
      setReleasingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  const active = numbers.filter((n) => n.status === "active");

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Hash className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">No numbers yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Buy a number to start making outbound calls with your own caller ID.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:space-y-3 max-w-2xl">
      {active.map((num) => (
        <Card
          key={num.id}
          className="border-white/10 bg-[oklch(0.086_0.024_282)]/90 p-3 lg:p-4 shadow-lg shadow-black/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <Phone className="h-4 w-4 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold">
                  {formatPhone(num.phone_number)}
                  {num.is_default ? ' ⭐' : ''}
                </span>
                {num.is_default && (
                  <Badge className="bg-brand/20 text-brand border-brand/30 text-[10px] px-1.5 py-0 h-4">
                    Default
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span>{num.country}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>${Number(num.monthly_cost).toFixed(2)}/mo</span>
                <span className="text-muted-foreground/40">·</span>
                <span>Since {formatDate(num.purchased_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!num.is_default && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 gap-1.5"
                  onClick={() => handleSetDefault(num.id)}
                  disabled={settingDefaultId === num.id}
                >
                  {settingDefaultId === num.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Star className="h-3 w-3" />}
                  <span className="hidden sm:inline">Set default</span>
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                onClick={() => handleRelease(num.id, num.phone_number)}
                disabled={releasingId === num.id}
                title="Release number"
              >
                {releasingId === num.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Buy New tab ──────────────────────────────────────────────────────────────

function BuyNew({ onPurchased }: { onPurchased: () => void }) {
  const [country, setCountry] = useState("US");
  const [areaCode, setAreaCode] = useState("");
  const [type, setType] = useState<"local" | "toll_free">("local");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AvailableNumber[] | null>(null);
  const [buyingPhone, setBuyingPhone] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const res = await fetch("/api/numbers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, areaCode: areaCode || undefined, type }),
      });
      const data = await res.json();
      if (data.error) setSearchError(data.error);
      else setResults(data.numbers ?? []);
    } catch {
      setSearchError("Could not search for phone numbers");
    } finally {
      setSearching(false);
    }
  }

  async function handleBuy(num: AvailableNumber) {
    setBuyingPhone(num.phoneNumber);
    try {
      const res = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: num.phoneNumber,
          monthlyCost: num.monthlyCost,
          country,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      } else {
        const label = formatPhone(num.phoneNumber);
        setToast(`Number ${label} purchased successfully!`);
        setResults((prev) => prev?.filter((r) => r.phoneNumber !== num.phoneNumber) ?? null);
        onPurchased();
        setTimeout(() => setToast(null), 5000);
      }
    } catch {
      setSearchError("Could not purchase number");
    } finally {
      setBuyingPhone(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Success toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Search form */}
      <Card className="border-white/10 bg-[oklch(0.086_0.024_282)]/90 p-4 shadow-lg shadow-black/20">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Country</label>
            <Select value={country} onValueChange={(v) => { if (v) setCountry(v); }}>
              <SelectTrigger className="h-9 border-white/15 bg-white/5 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">🇺🇸 United States</SelectItem>
                <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                <SelectItem value="AU">🇦🇺 Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Area code <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Input
              value={areaCode}
              onChange={(e) =>
                setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))
              }
              placeholder="e.g. 415"
              className="h-9 border-white/15 bg-white/5 text-sm"
              maxLength={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <div className="flex gap-2">
              {(["local", "toll_free"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-colors ${
                    type === t
                      ? "border-brand bg-brand/15 text-brand"
                      : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-foreground"
                  }`}
                >
                  {t === "local" ? "Local" : "Toll-free"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="mt-4 h-9 bg-brand px-5 text-xs font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] gap-2"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
      </Card>

      {/* Error */}
      {searchError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {searchError}
        </div>
      )}

      {/* Skeleton while searching */}
      {searching && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      )}

      {/* Results */}
      {results !== null && !searching && (
        results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Hash className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No numbers found</p>
            <p className="text-xs text-muted-foreground">
              Try a different area code or country.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((num) => (
              <Card
                key={num.phoneNumber}
                className="border-white/10 bg-[oklch(0.086_0.024_282)]/90 p-3 lg:p-4 shadow-lg shadow-black/20 transition-colors hover:border-brand/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">
                      {formatPhone(num.phoneNumber)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[num.city, num.state].filter(Boolean).join(", ") || "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 capitalize"
                      >
                        {num.type === "toll_free" ? "Toll-free" : "Local"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${num.monthlyCost.toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 h-8 bg-brand px-3 text-xs font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] gap-1"
                    onClick={() => handleBuy(num)}
                    disabled={buyingPhone !== null}
                  >
                    {buyingPhone === num.phoneNumber
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Plus className="h-3 w-3" />}
                    Buy
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NumbersPage() {
  const [tab, setTab] = useState<"my" | "buy">("my");
  const [refreshSignal, setRefreshSignal] = useState(0);

  function handlePurchased() {
    setRefreshSignal((s) => s + 1);
    setTab("my");
  }

  return (
    <>
      <DashboardHeader
        title="Phone Numbers"
        subtitle="Search and purchase numbers for your campaigns"
      />
      <main className="flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-5">
        {/* Tabs */}
        <div className="mb-4 lg:mb-5 flex gap-1 border-b border-white/10">
          {(["my", "buy"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "my" ? "My Numbers" : "Buy New"}
            </button>
          ))}
        </div>

        {tab === "my"
          ? <MyNumbers refreshSignal={refreshSignal} />
          : <BuyNew onPurchased={handlePurchased} />}
      </main>
    </>
  );
}
