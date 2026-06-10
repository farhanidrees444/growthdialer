"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { posthogEnabled } from "@/components/PostHogProvider";
import { useSupabaseSession } from "@/lib/supabase/hooks";

export function PostHogIdentify() {
  const session = useSupabaseSession();

  useEffect(() => {
    if (!posthogEnabled()) return;

    const user = session?.user;
    if (user?.id) {
      posthog.identify(user.id, {
        email: user.email ?? undefined,
      });
      return;
    }

    posthog.reset();
  }, [session?.user?.id, session?.user?.email]);

  return null;
}
