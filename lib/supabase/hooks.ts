"use client";

import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "./client";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = createClient();

      // Fast path: local cache (no network round-trip).
      void supabase.auth.getSession().then(({ data }) => {
        if (mounted && data.session) setSession(data.session);
      });

      // Background refresh from JWT cache without blocking sidebar render.
      void supabase.auth.getUser().then(({ data }) => {
        if (!mounted || !data.user) return;
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) setSession(nextSession);
      });

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    } catch {
      return () => { mounted = false; };
    }
  }, []);

  return session;
}
