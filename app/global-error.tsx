"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08080A] text-[#F5F5F7] antialiased flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]">
            <span className="font-display text-lg font-bold text-white">G</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold">GrowthDialer ran into a problem</h1>
            <p className="text-sm text-zinc-400">
              An unexpected error occurred. Refresh the page or try again — if this keeps happening, contact support.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#8B5CF6] px-6 text-sm font-semibold text-white hover:bg-[#7C3AED]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
