"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState, type ReactNode } from "react";

function posthogEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!posthogEnabled()) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!.trim(), {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });
    setReady(true);
  }, []);

  if (!ready) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export { posthogEnabled };
