"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const SecureCheckout = dynamic(() => import("@/components/billing/secure-checkout").then(m => m.SecureCheckout), {
  ssr: false,
  loading: () => <div role="status" aria-label="Loading secure payment" className="h-96 animate-pulse rounded-2xl bg-white/5" />,
});
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  BILLING_CATALOG,
  purchaseTotal,
  type BillingPlan,
  type BillingCycle,
} from "@/lib/billing/catalog";
export function PurchaseExperience({
  selection,
  sessionId,
  sandbox,
  returnUrl,
}: {
  selection: { plan: BillingPlan; cycle: BillingCycle; seats: number };
  sessionId?: string;
  sandbox: boolean;
  returnUrl?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const plan = BILLING_CATALOG[selection.plan];
  const total = purchaseTotal(selection.plan, selection.cycle, selection.seats);
  async function proceed() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/billing/whop-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selection),
      });
      const data = await response.json();
      if (!response.ok || !data.url)
        throw new Error(data.error || "Checkout could not be started");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again");
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#090a10] text-white px-5 py-8 md:py-14">
      <div className="max-w-6xl mx-auto">
        <nav className="flex justify-between items-center mb-14">
          <Link
            href="/pricing"
            className="inline-flex gap-2 text-sm text-zinc-400 items-center"
          >
            <ArrowLeft size={16} /> Back to plans
          </Link>
          <span className="font-semibold tracking-tight text-lg">
            GrowthDialer<span className="text-violet-300">.</span>
          </span>
          <span className="hidden sm:flex gap-2 text-xs text-zinc-400 items-center">
            <LockKeyhole size={14} /> Secure checkout
          </span>
        </nav>
        {sandbox && (
          <p className="mb-8 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-200">
            Test checkout · No real money moves in this environment.
          </p>
        )}
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-20">
          <section>
            <p className="text-xs uppercase tracking-[.22em] text-violet-300">
              Your next chapter starts here
            </p>
            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              More conversations.
              <br />
              <span className="text-zinc-500">A clearer path to growth.</span>
            </h1>
            <p className="mt-5 text-zinc-400 max-w-md leading-relaxed">
              {plan.description} Review your subscription, then complete your
              purchase securely.
            </p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.06] to-white/[.01] p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  {selection.cycle === "annual" ? "Annual" : "Monthly"}
                </span>
              </div>
              <div className="my-6">
                <span className="text-5xl tracking-tight font-semibold">
                  ${total.toLocaleString("en-US")}
                </span>
                <span className="text-zinc-400">
                  {" "}
                  / {selection.cycle === "annual" ? "year" : "month"}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                {selection.seats} {selection.seats === 1 ? "seat" : "seats"} ·
                USD · Taxes calculated at checkout
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                {[
                  "Your selected plan, linked to your account",
                  "Recurring billing with a clear renewal total",
                  "Self-service subscription management",
                ].map((text) => (
                  <p key={text} className="text-sm text-zinc-300 flex gap-3">
                    <Check size={16} className="text-violet-300 shrink-0" />
                    {text}
                  </p>
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mt-5">
              Renews at ${total.toLocaleString("en-US")} per{" "}
              {selection.cycle === "annual" ? "year" : "month"}, plus applicable
              taxes, until canceled. Calling, phone-number and messaging usage
              may incur separate charges. No free trial is included in this
              purchase.
            </p>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/[.035] p-6 md:p-8 self-start">
            <div className="flex gap-3 items-center mb-6">
              <ShieldCheck className="text-violet-300" />
              <div>
                <h2 className="text-xl font-semibold">
                  Complete your purchase
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Your subscription activates after confirmation.
                </p>
              </div>
            </div>
            {sessionId ? (
              <SecureCheckout
                configurationId={sessionId}
                sandbox={sandbox}
                returnUrl={returnUrl}
              />
            ) : (
              <>
                <div className="border border-white/10 rounded-2xl p-5 mb-6 text-sm text-zinc-300 flex justify-between">
                  <span>Due at checkout, before tax</span>
                  <strong>${total.toLocaleString("en-US")}</strong>
                </div>
                <button
                  onClick={() => void proceed()}
                  disabled={busy}
                  className="w-full flex gap-3 items-center justify-center rounded-xl bg-violet-600 text-white py-4 font-semibold hover:bg-violet-700 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <ArrowRight size={18} />
                  )}{" "}
                  Continue to secure payment
                </button>
              </>
            )}
            {error && (
              <p role="alert" className="mt-5 text-sm text-red-300">
                {error}
              </p>
            )}
            <p className="mt-6 text-xs text-zinc-500 flex gap-2 items-center">
              <LockKeyhole size={13} /> Payment details stay with the secure
              payment service.
            </p>
            <div className="mt-5 flex gap-5 text-xs text-zinc-400">
              <Link href="/terms" className="underline">
                Terms
              </Link>
              <Link href="/privacy" className="underline">
                Privacy
              </Link>
              <Link href="/contact-sales" className="underline">
                Need help?
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
