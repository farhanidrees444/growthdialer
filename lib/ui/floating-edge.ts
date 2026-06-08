/** Shared layout for bottom-right floating controls (FABs, call bar, pop-out badge). */

export const ACTIVE_CALL_STATUSES = ['connecting', 'ringing', 'active', 'held'] as const;

export type ActiveCallStatus = (typeof ACTIVE_CALL_STATUSES)[number];

export function isActiveCallStatus(status: string): status is ActiveCallStatus {
  return (ACTIVE_CALL_STATUSES as readonly string[]).includes(status);
}

/** Reserved height when minimized / pop-out call chrome sits on the bottom-right (desktop). */
export const CALL_DOCK_RESERVE_PX = 76;

/** Gap between call dock and FAB stack above it. */
export const CALL_DOCK_GAP_PX = 12;
