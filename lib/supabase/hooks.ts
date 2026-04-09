"use client";

import { useEffect, useMemo, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "./client";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) setSession(data.session);
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setSession(session);
      });

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    } catch (error) {
      // Supabase not configured, return null session
      if (mounted) setSession(null);
      return () => {};
    }
  }, []);

  return session;
}
