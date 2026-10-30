"use client";

import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "./client";

/** Read session from Supabase local storage for instant first paint. */
function readCachedSession(): Session | null {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      expires_in?: number;
      token_type?: string;
      user?: Session["user"];
    };

    if (!parsed.access_token || !parsed.user) return null;

    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token ?? "",
      expires_at: parsed.expires_at,
      expires_in: parsed.expires_in,
      token_type: parsed.token_type ?? "bearer",
      user: parsed.user,
    } as Session;
  } catch {
    return null;
  }
}

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(() => readCachedSession());

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
      if (mounted) setSession(null);
      return () => {};
    }
  }, []);

  return session;
}
