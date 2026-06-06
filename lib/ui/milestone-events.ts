'use client';

export type MilestoneKind = 'meeting_booked' | 'first_call_today' | 'connect_streak';

const CONNECT_DISPOSITIONS = new Set(['interested', 'meeting_booked', 'callback', 'gatekeeper']);
const STREAK_KEY = 'gd-connect-streak';

export function emitMilestone(kind: MilestoneKind): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gd:milestone', { detail: { kind } }));
}

export function emitMilestoneFromDisposition(disposition: string): void {
  if (disposition === 'meeting_booked') {
    emitMilestone('meeting_booked');
  }
  if (CONNECT_DISPOSITIONS.has(disposition)) {
    try {
      const prev = parseInt(sessionStorage.getItem(STREAK_KEY) ?? '0', 10);
      const next = prev + 1;
      sessionStorage.setItem(STREAK_KEY, String(next));
      if (next >= 3 && next % 3 === 0) {
        emitMilestone('connect_streak');
      }
    } catch {
      /* ignore */
    }
  } else {
    try {
      sessionStorage.setItem(STREAK_KEY, '0');
    } catch {
      /* ignore */
    }
  }
}

export function maybeEmitFirstCallToday(): void {
  if (typeof window === 'undefined') return;
  const key = `gd-first-call-${new Date().toISOString().slice(0, 10)}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    emitMilestone('first_call_today');
  } catch {
    /* ignore */
  }
}
