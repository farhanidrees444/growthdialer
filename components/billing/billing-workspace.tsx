"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
const SecureCheckout = dynamic(
  () => import("./secure-checkout").then((m) => m.SecureCheckout),
  {
    ssr: false,
    loading: () => (
      <div className="bill-payment-host animate-pulse rounded-xl bg-white/5" />
    ),
  },
);
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Headphones,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BILLING_CATALOG,
  purchaseTotal,
  type BillingPlan,
  type BillingCycle,
} from "@/lib/billing/catalog";
import { WorkspaceBillingPanel } from "./workspace-billing-panel";
import "./billing-workspace.css";

type Snapshot = {
  provider: string;
  plan: string;
  status: string;
  seats: number;
  billingCycle: BillingCycle;
  active: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canManage: boolean;
  checkoutAvailable: boolean;
  billingEnabled: boolean;
  amount: number | null;
  sandbox?: boolean;
  checkoutConfirmed?: boolean;
  pendingCheckout?: { plan: BillingPlan; cycle: BillingCycle; seats: number; amount: number } | null;
};
type HistoryItem = {
  id: string;
  date: string;
  amount: string | null;
  currency: string;
  status: string;
  paymentMethod: string | null;
};
const FEATURES: Record<BillingPlan, string[]> = {
  starter: [
    "AI dialer and call workflows",
    "Recordings and transcripts",
    "1 local number allowance",
  ],
  growth: [
    "Everything in Starter",
    "AI call scoring and summaries",
    "Coaching dashboard and leaderboard",
  ],
  pro: [
    "Everything in Growth",
    "Live monitoring and manager visibility",
    "API, webhooks and priority support",
  ],
};
const EMPTY: Snapshot = {
  provider: "whop",
  plan: "trial",
  status: "none",
  seats: 1,
  billingCycle: "monthly",
  active: false,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  canManage: false,
  checkoutAvailable: false,
  billingEnabled: false,
  amount: null,
};
const formatMoney = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled";

export function BillingWorkspace({
  preview = false,
  embedded = false,
}: {
  preview?: boolean;
  embedded?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(
    preview
      ? {
          ...EMPTY,
          plan: "growth",
          status: "active",
          seats: 3,
          active: true,
          currentPeriodEnd: "2026-11-30T00:00:00Z",
          canManage: true,
          amount: 237,
        }
      : null,
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [seats, setSeats] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const [checkout, setCheckout] = useState<{
    plan: BillingPlan;
    sessionId?: string;
    intentId?: string;
  } | null>(null);
  const [waiting, setWaiting] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (preview) return;
    setError("");
    try {
      const response = await fetch("/api/subscription/status", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Please sign in to manage your billing."
            : "We could not load your subscription. Please try again.",
        );
      const data = await response.json();
      setSnapshot(data);
      if (data.pendingCheckout) {
        setCycle(data.pendingCheckout.cycle);
        setSeats(data.pendingCheckout.seats);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Billing is temporarily unavailable.",
      );
    }
  }, [preview]);
  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    void fetch("/api/billing/history", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setHistory(data.entries || []);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setHistoryError("Payment history is temporarily unavailable.");
      });
    return () => controller.abort();
  }, [preview, snapshot?.currentPeriodEnd]);
  useEffect(() => {
    if (!waiting || preview) return;
    let canceled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    async function poll() {
      attempt++;
      try {
        const res = await fetch(
          `/api/subscription/status?intent=${encodeURIComponent(waiting!)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (canceled) return;
        if (res.ok && data.active && data.checkoutConfirmed) {
          setSnapshot(data);
          setWaiting(null);
          setCheckout(null);
          setNotice("Your subscription is active. You’re ready to go.");
          return;
        }
      } catch {}
      if (canceled) return;
      if (attempt >= 20) {
        setWaiting(null);
        setNotice(
          "Confirmation is still pending. Refresh your status before making another purchase.",
        );
        return;
      }
      timer = setTimeout(() => void poll(), 2000);
    }
    void poll();
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [waiting, preview]);
  async function manage(action: "cancel" | "keep" | "sync") {
    setBusy(action);
    setError("");
    setNotice("");
    if (preview) {
      setSnapshot((s) =>
        s
          ? {
              ...s,
              cancelAtPeriodEnd:
                action === "cancel"
                  ? true
                  : action === "keep"
                    ? false
                    : s.cancelAtPeriodEnd,
            }
          : s,
      );
      setConfirm(false);
      setBusy("");
      setNotice("Preview updated. No real subscription was changed.");
      return;
    }
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refresh();
      setConfirm(false);
      setNotice(
        action === "cancel"
          ? "Automatic renewal is off. Your access continues until the current period ends."
          : action === "keep"
            ? "Automatic renewal is on. Your subscription will continue."
            : "Subscription status refreshed.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update your subscription.",
      );
    } finally {
      setBusy("");
    }
  }
  async function begin(plan: BillingPlan, resume?: { cycle: BillingCycle; seats: number }) {
    setError("");
    setNotice("");
    if (preview) {
      setCheckout({ plan });
      return;
    }
    if (snapshot?.canManage && ["active", "trialing", "past_due"].includes(snapshot.status)) {
      setNotice(
        "You already have a subscription. Contact support to arrange a plan or seat change without duplicate billing.",
      );
      return;
    }
    if (!snapshot?.checkoutAvailable) {
      setNotice(
        "Purchasing is not enabled yet. Your account has not been charged.",
      );
      return;
    }
    const selectedCycle = resume?.cycle ?? cycle;
    const selectedSeats = resume?.seats ?? seats;
    if (resume) { setCycle(selectedCycle); setSeats(selectedSeats); }
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/whop-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle: selectedCycle, seats: selectedSeats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.sessionId || !data.intentId)
        throw new Error("Could not prepare secure checkout.");
      setCheckout({ plan, sessionId: data.sessionId, intentId: data.intentId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setBusy("");
    }
  }
  async function paymentDetails() {
    if (preview) {
      setNotice(
        "In the live product, payment details open in your secure billing management page.",
      );
      return;
    }
    setBusy("portal");
    setError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not open payment settings.",
      );
      setBusy("");
    }
  }
  const data = snapshot || EMPTY;
  const selectionLocked = !preview && !!data.pendingCheckout;
  const plan = BILLING_CATALOG[data.plan as BillingPlan];
  const renewable =
    data.canManage && ["active", "trialing", "past_due"].includes(data.status);
  const amount =
    data.amount ??
    (plan
      ? purchaseTotal(data.plan as BillingPlan, data.billingCycle, data.seats)
      : 0);
  if (!snapshot && !error)
    return (
      <div className="gd-billing">
        <div className="bill-skeleton" />
        <p className="bill-muted mt-5">Loading your billing workspace…</p>
      </div>
    );
  if (snapshot?.provider === "legacy" && snapshot.billingEnabled && !preview)
    return (
      <div className="gd-billing">
        <WorkspaceBillingPanel />
      </div>
    );
  return (
    <div className="gd-billing">
      <div className="bill-top">
        <div>
          <p className="bill-eyebrow">Workspace / Billing</p>
          <h1 className="bill-title">Your plan. Your pace.</h1>
          <p className="bill-muted">
            Subscriptions, seats and payment history. All in one place.
          </p>
        </div>
        <button
          className="bill-button"
          disabled={!!busy}
          onClick={() =>
            data.canManage ? void manage("sync") : void refresh()
          }
        >
          <RefreshCw
            size={13}
            className={busy === "sync" ? "animate-spin" : ""}
          />{" "}
          Refresh status
        </button>
      </div>
      {preview && (
        <div className="bill-notice">
          <ShieldCheck size={17} className="shrink-0 mt-0.5" />
          <span>
            <strong>Interactive design preview.</strong> This page uses sample
            subscription details. No payments, account changes or calls are
            made.
          </span>
        </div>
      )}
      {!preview && !data.billingEnabled && (
        <div className="bill-notice">
          <LockKeyhole size={17} className="shrink-0 mt-0.5" />
          <span>
            Subscription purchasing is being prepared. You can review plans
            here; your current product access is unchanged.
          </span>
        </div>
      )}
      {error && (
        <div role="alert" className="bill-error">
          {error}
          <button className="ml-4 underline" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="bill-notice">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          {notice}
        </div>
      )}
      {waiting && (
        <div role="status" className="bill-notice">
          <Loader2 size={16} className="animate-spin shrink-0" />
          Confirming your subscription. Access will update when the payment
          service confirms it.
        </div>
      )}
      {!preview && data.pendingCheckout && (
        <div className="bill-notice flex-wrap items-center justify-between gap-4">
          <span>You have an unfinished {BILLING_CATALOG[data.pendingCheckout.plan].name} checkout: {data.pendingCheckout.seats} seats, {formatMoney(Number(data.pendingCheckout.amount))} per {data.pendingCheckout.cycle === "annual" ? "year" : "month"}. Resume it before starting another purchase.</span>
          <button type="button" className="bill-button" disabled={!!busy}
            onClick={() => { const pending = data.pendingCheckout!; void begin(pending.plan, pending); }}>Resume checkout</button>
        </div>
      )}
      <div className="bill-grid">
        <section className="bill-panel bill-plan-card">
          <Image
            src="/billing/conversation-sculpture.webp"
            fill
            sizes="(max-width:650px) 100vw, 700px"
            alt=""
            className="bill-artwork object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/65 to-transparent" />
          <div className="bill-plan-content">
            <div className="flex items-center gap-3">
              <p className="bill-eyebrow">Current plan</p>
              <span
                className={`bill-status ${!data.active ? "bill-status-warn" : ""}`}
              >
                <span className="bill-status-dot" />
                {data.cancelAtPeriodEnd
                  ? "Ending"
                  : data.active
                    ? "Active"
                    : "Not subscribed"}
              </span>
            </div>
            <h2>{plan?.name || "Find your fit."}</h2>
            <p className="bill-muted">
              {plan
                ? `${data.seats} ${data.seats === 1 ? "seat" : "seats"} · Billed ${data.billingCycle === "annual" ? "annually" : "monthly"}`
                : "A calling workspace built around your next stage of growth."}
            </p>
            <div className="bill-price">
              {plan ? formatMoney(Number(amount)) : "Simple plans."}
              <span>
                {plan
                  ? ` / ${data.billingCycle === "annual" ? "year" : "month"}`
                  : " No seat minimum."}
              </span>
            </div>
          </div>
        </section>
        <section className="bill-panel">
          <h2 className="bill-card-title">
            <Clock3 />
            Subscription details
          </h2>
          <div className="bill-row">
            <span className="bill-muted">
              {data.cancelAtPeriodEnd ? "Access until" : "Next renewal"}
            </span>
            <strong>{formatDate(data.currentPeriodEnd)}</strong>
          </div>
          <div className="bill-row">
            <span className="bill-muted">Billing cycle</span>
            <span>
              {plan
                ? data.billingCycle === "annual"
                  ? "Annual"
                  : "Monthly"
                : "Choose at checkout"}
            </span>
          </div>
          <div className="bill-row">
            <span className="bill-muted">Seats on subscription</span>
            <span>{plan ? data.seats : "—"}</span>
          </div>
          <div className="bill-row">
            <span className="bill-muted">Automatic renewal</span>
            <span>
              {!plan ? "Not started" : data.cancelAtPeriodEnd ? "Off" : "On"}
            </span>
          </div>
          {renewable && (
            <button
              className="mt-4 text-xs underline underline-offset-4"
              disabled={!!busy}
              onClick={() =>
                data.cancelAtPeriodEnd ? void manage("keep") : setConfirm(true)
              }
            >
              {busy === "keep"
                ? "Updating…"
                : data.cancelAtPeriodEnd
                  ? "Keep my subscription"
                  : "Cancel automatic renewal"}
            </button>
          )}
        </section>
      </div>
      <div className="bill-subgrid">
        <section className="bill-panel">
          <h2 className="bill-card-title">
            <CreditCard />
            Payment details
          </h2>
          <p className="bill-muted mt-3">
            {history[0]?.paymentMethod ||
              "Your payment details are handled securely."}
          </p>
          <p className="bill-muted mt-1">
            Card details are never stored in your workspace.
          </p>
          <button
            className="bill-button mt-5"
            disabled={!data.canManage || !!busy}
            onClick={() => void paymentDetails()}
          >
            {busy === "portal" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ExternalLink size={13} />
            )}{" "}
            Manage payment details
          </button>
        </section>
        <section className="bill-panel">
          <h2 className="bill-card-title">
            <Headphones />
            Here when you need us
          </h2>
          <p className="bill-muted mt-3">
            Need a different plan or seat count? We’ll help you make the change
            without overlapping subscriptions.
          </p>
          <Link className="bill-button mt-5" href="/contact-sales">
            Talk to our team <ArrowRight size={13} />
          </Link>
        </section>
      </div>
      <div className="bill-section-head">
        <div>
          <h2>Find your next gear.</h2>
          <p className="bill-muted mt-1">
            Choose your plan, billing cycle and the seats you need.
          </p>
        </div>
        <div className="bill-selectors">
          <div className="bill-segment">
            {(["monthly", "annual"] as const).map((c) => (
              <button
                key={c}
                aria-pressed={cycle === c}
                disabled={selectionLocked || !!busy}
                onClick={() => setCycle(c)}
              >
                {c === "monthly" ? "Monthly" : "Annual · save up to 20%"}
              </button>
            ))}
          </div>
          <div className="bill-seats">
            <Users size={14} />
            <button
              aria-label="Fewer seats"
              disabled={selectionLocked || !!busy}
              onClick={() => setSeats(Math.max(1, seats - 1))}
            >
              −
            </button>
            <output aria-label="Selected seats">{seats}</output>
            <button
              aria-label="More seats"
              disabled={selectionLocked || !!busy}
              onClick={() => setSeats(Math.min(500, seats + 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div className="bill-plan-options">
        {(Object.keys(BILLING_CATALOG) as BillingPlan[]).map((key) => {
          const option = BILLING_CATALOG[key];
          const current = data.plan === key && renewable;
          return (
            <section
              key={key}
              className={`bill-option ${key === "growth" ? "bill-option-recommended" : ""}`}
            >
              <div className="flex justify-between items-center">
                <span className="bill-eyebrow">
                  {key === "starter"
                    ? "Your foundation"
                    : key === "growth"
                      ? "Build momentum"
                      : "Your full potential"}
                </span>
                {key === "growth" && (
                  <Sparkles size={14} className="text-violet-200" />
                )}
              </div>
              <h3>{option.name}</h3>
              <p className="bill-muted min-h-11">{option.description}</p>
              <div className="bill-large mt-5">
                ${option[cycle]}
                <span className="text-xs font-normal text-[var(--bill-muted)]">
                  {" "}
                  / seat / month
                </span>
              </div>
              <p className="bill-muted text-[11px] mt-1">
                {cycle === "annual"
                  ? `${formatMoney(purchaseTotal(key, cycle, seats))} billed yearly`
                  : `${formatMoney(purchaseTotal(key, cycle, seats))} billed monthly`}{" "}
                · {seats} {seats === 1 ? "seat" : "seats"}
              </p>
              <ul>
                {FEATURES[key].map((f) => (
                  <li key={f}>
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`bill-button ${key === "growth" ? "bill-button-primary" : ""}`}
                disabled={!!busy || selectionLocked || (!preview && current)}
                onClick={() => void begin(key)}
              >
                {busy === key ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : selectionLocked ? (
                  "Resume checkout above"
                ) : current ? (
                  "Current plan"
                ) : renewable && !preview ? (
                  "Arrange a plan change"
                ) : (
                  `Choose ${option.name}`
                )}{" "}
                {!current && <ArrowRight size={13} />}
              </button>
            </section>
          );
        })}
      </div>
      <p className="bill-muted text-[10px] mt-4">
        Prices in USD, before applicable taxes. Calling, messaging and
        phone-number usage may cost extra. Paid subscriptions start at checkout;
        no free trial is included. Features marked coming soon on the comparison
        page are not included yet.
      </p>
      <section className="bill-panel bill-activity">
        <div className="flex justify-between items-center gap-4">
          <h2 className="bill-card-title">
            <FileText />
            Payment history
          </h2>
          <span className="bill-muted text-[10px]">Latest 12 payments</span>
        </div>
        {historyError ? (
          <p role="status" className="bill-muted mt-5">
            {historyError}
          </p>
        ) : history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full mt-5 text-left text-xs">
              <thead className="text-[var(--bill-muted)]">
                <tr>
                  <th className="py-3 font-normal">Date</th>
                  <th className="font-normal">Amount</th>
                  <th className="font-normal">Status</th>
                  <th className="font-normal text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--bill-line)]">
                    <td className="py-4">{formatDate(p.date)}</td>
                    <td>
                      {p.amount
                        ? formatMoney(Number(p.amount), p.currency)
                        : "—"}
                    </td>
                    <td className="capitalize">{p.status}</td>
                    <td className="text-right">
                      <Link
                        href={`/billing/receipt/${p.id}`}
                        className="inline-flex gap-1 items-center underline underline-offset-4"
                      >
                        <ArrowDownToLine size={12} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bill-empty">
            <FileText size={25} />
            <p className="text-sm font-medium">
              {preview ? "A clean record. A clear view." : "No payments yet"}
            </p>
            <p className="bill-muted max-w-sm">
              {preview
                ? "Receipts appear here after confirmed payments. This preview does not create payment records."
                : "Your confirmed subscription payments and receipts will appear here."}
            </p>
          </div>
        )}
      </section>
      <footer className="bill-footer">
        <span className="inline-flex gap-2 items-center">
          <ShieldCheck size={13} />
          Secure subscription management
        </span>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        {!embedded && (
          <Link href="/pricing">
            Full plan comparison <ArrowRight size={11} className="inline" />
          </Link>
        )}
      </footer>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-w-lg sm:max-w-lg bg-[#12151c] text-white border border-white/10 p-7">
          <DialogTitle className="text-xl">
            Turn off automatic renewal?
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
            Your current plan stays available until{" "}
            {formatDate(data.currentPeriodEnd)}. You won’t be charged for
            another renewal. You can turn renewal back on before that date.
          </DialogDescription>
          <div className="bill-dialog-actions">
            <button className="bill-button" onClick={() => setConfirm(false)}>
              Keep my plan
            </button>
            <button
              className="bill-button bill-button-primary"
              disabled={!!busy}
              onClick={() => void manage("cancel")}
            >
              {busy === "cancel" ? "Updating…" : "Turn off renewal"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!checkout}
        onOpenChange={(open) => {
          if (!open) setCheckout(null);
        }}
      >
        <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#10131a] text-white p-7 border border-white/10">
          <DialogTitle className="text-xl">
            {checkout
              ? `${BILLING_CATALOG[checkout.plan].name} · Complete your subscription`
              : ""}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {seats} {seats === 1 ? "seat" : "seats"} ·{" "}
            {checkout
              ? formatMoney(purchaseTotal(checkout.plan, cycle, seats))
              : ""}{" "}
            per {cycle === "annual" ? "year" : "month"}, before taxes. Renews
            until canceled.
          </DialogDescription>
          {preview ? (
            <div className="rounded-xl border border-white/10 bg-white/[.03] p-8 my-4 text-center">
              <LockKeyhole size={30} className="text-violet-200 mx-auto mb-5" />
              <h3 className="text-lg font-semibold">
                Your secure payment form lives here.
              </h3>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                This preview shows the exact plan and billing total. The real
                embedded payment form is enabled after sandbox credentials and
                webhook setup are complete.
              </p>
              <button
                className="bill-button bill-button-primary mt-6"
                onClick={() => {
                  setCheckout(null);
                  setNotice(
                    "Preview complete. No payment was made or subscription activated.",
                  );
                }}
              >
                Return to billing <ArrowRight size={13} />
              </button>
            </div>
          ) : checkout?.sessionId ? (
            <SecureCheckout
              configurationId={checkout.sessionId}
              sandbox={!!data.sandbox}
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/complete?intent=${checkout.intentId}`}
              onComplete={() => {
                setWaiting(checkout.intentId || null);
                setCheckout(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
