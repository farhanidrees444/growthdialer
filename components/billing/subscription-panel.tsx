"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceBillingPanel } from "./workspace-billing-panel";
export function SubscriptionPanel() {
  const [data, setData] = useState<{
    provider?: string;
    plan?: string;
    status?: string;
    seats?: number;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const r = await fetch("/api/subscription/status", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError("Could not load subscription. Please refresh.");
    }
  }
  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, []);
  async function manage() {
    setError("");
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      window.location.assign(d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open billing");
    }
  }
  if (error && !data) return <p role="alert">{error}</p>;
  if (!data) return <p className="text-zinc-400">Loading your subscription…</p>;
  if (data.provider !== "whop") return <WorkspaceBillingPanel />;
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[.03] p-7 max-w-2xl text-white">
      <p className="text-xs uppercase tracking-widest text-cyan-300">
        Your subscription
      </p>
      <h2 className="text-3xl mt-3 font-semibold capitalize">
        {data.plan === "trial" ? "No active plan" : data.plan}
      </h2>
      <p className="text-zinc-400 mt-3 capitalize">
        {data.status} · {data.seats} seats
      </p>
      {data.currentPeriodEnd && (
        <p className="mt-3 text-sm text-zinc-400">
          {data.cancelAtPeriodEnd ? "Access ends" : "Current period ends"}{" "}
          {new Date(data.currentPeriodEnd).toLocaleDateString()}
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          onClick={() => void manage()}
          className="rounded-xl bg-cyan-300 text-zinc-950 px-5 py-3 font-semibold"
        >
          Manage subscription
        </button>
        <Link
          href="/pricing"
          className="rounded-xl border border-white/10 px-5 py-3"
        >
          View plans
        </Link>
        <button
          onClick={() => void refresh()}
          className="text-sm text-zinc-400 px-3"
        >
          Refresh status
        </button>
      </div>
      {error && (
        <p role="alert" className="text-red-300 mt-4">
          {error}
        </p>
      )}
    </section>
  );
}
