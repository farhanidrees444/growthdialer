"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Clock3 } from "lucide-react";
function Confirmation({ intent }: { intent: string | null }) {
  const [state, setState] = useState("checking");
  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll(attempt: number) {
      try {
        const res = await fetch(
          `/api/subscription/status?intent=${encodeURIComponent(intent || "")}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (canceled) return;
        if (res.ok && intent && data.active && data.checkoutConfirmed) {
          setState("active");
          return;
        }
        if (res.status === 401) {
          setState("signin");
          return;
        }
      } catch {
        /* Delayed confirmations can be retried safely. */
      }
      if (canceled) return;
      if (attempt >= 15) {
        setState("pending");
        return;
      }
      timer = setTimeout(() => void poll(attempt + 1), 2000);
    }
    queueMicrotask(() => {
      if (!intent) setState("pending");
      else void poll(1);
    });
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [intent]);
  return (
    <main className="min-h-screen bg-[#090a10] text-white flex items-center justify-center p-6">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/[.04] p-10 text-center">
        <p className="text-sm tracking-widest text-zinc-400 mb-8">
          GROWTHDIALER
        </p>
        {state === "active" ? (
          <CheckCircle2 className="mx-auto text-violet-300" size={56} />
        ) : state === "checking" ? (
          <Loader2 className="mx-auto animate-spin text-violet-300" size={48} />
        ) : (
          <Clock3 className="mx-auto text-amber-300" size={48} />
        )}
        <h1 className="text-3xl font-semibold mt-6">
          {state === "active"
            ? "You’re ready to grow."
            : state === "checking"
              ? "Confirming your subscription"
              : state === "signin"
                ? "Sign in to verify your purchase"
                : "Confirmation is still pending"}
        </h1>
        <p aria-live="polite" className="text-zinc-400 mt-4 leading-relaxed">
          {state === "active"
            ? "Your plan is active. Your calling workspace is ready."
            : "We have not confirmed access yet. A redirect does not confirm payment. Please check your billing status before trying another purchase."}
        </p>
        <Link
          className="inline-flex bg-violet-600 text-white rounded-xl px-6 py-3 mt-8 font-semibold"
          href={
            state === "signin"
              ? `/login?next=${encodeURIComponent(`/checkout/complete?intent=${intent || ""}`)}`
              : "/dashboard"
          }
        >
          {state === "signin" ? "Sign in" : "Open dashboard"}
        </Link>
      </div>
    </main>
  );
}
function IntentConfirmation() {
  const intent = useSearchParams().get("intent");
  return <Confirmation key={intent} intent={intent} />;
}
export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <IntentConfirmation />
    </Suspense>
  );
}
