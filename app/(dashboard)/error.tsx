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
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center dash-enter">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-xl font-semibold tracking-tight text-white">Something went wrong</h2>
        <p className="dash-muted mx-auto max-w-sm leading-relaxed">
          This page hit an unexpected error. Your calls and data are safe — try again or head back to the dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="dash-btn-primary min-h-11"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="dash-btn-ghost min-h-11"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
