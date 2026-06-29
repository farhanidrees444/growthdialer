'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

type PollState = 'checking' | 'active' | 'timeout';

function PricingSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [state, setState] = useState<PollState>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll(nextAttempt: number) {
      if (cancelled) return;
      setAttempt(nextAttempt);
      try {
        const res = await fetch('/api/subscription/status', { cache: 'no-store' });
        const data = await res.json().catch(() => ({})) as { active?: boolean };
        if (res.ok && data.active) {
          setState('active');
          return;
        }
      } catch {
        // Retry below. Webhooks can arrive seconds after checkout redirects.
      }

      if (nextAttempt >= 10) {
        setState('timeout');
        return;
      }

      timer = setTimeout(() => void poll(nextAttempt + 1), 2000);
    }

    void poll(1);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-white/[0.09] bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
        {state === 'active' ? (
          <>
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4]"
            >
              <Check className="h-8 w-8" />
            </motion.div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Your plan is active</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Your subscription is ready. Premium features are now available in your workspace.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-3 text-sm font-semibold text-white">
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 text-[#8B5CF6]">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              {state === 'timeout' ? 'Setup is still in progress' : 'Finishing setup'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {state === 'timeout'
                ? 'Checkout completed, but your subscription has not synced yet. You can continue to the dashboard and refresh shortly.'
                : `Waiting for confirmation. Attempt ${attempt} of 10.`}
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200">
              Open dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PricingSuccessInner />
    </Suspense>
  );
}
