'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `false` on the server and during the first client render, then
 * `true` after the component has mounted. Use this to gate any rendering
 * that depends on client-only signals (e.g. `useReducedMotion`, matchMedia)
 * so the initial client render always matches the server-rendered HTML and
 * avoids hydration mismatches.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
