'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard]', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-xl font-semibold text-white">Something went wrong</h2>
        <p className="text-sm text-slate-400">
          This page hit an unexpected error. Your calls and data are safe — try again or head back to the dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[oklch(0.64_0.21_293)] px-5 text-sm font-medium text-white hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.10] px-5 text-sm text-slate-300 hover:bg-white/[0.05]"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
