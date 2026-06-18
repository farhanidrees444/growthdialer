/**
 * Parallel power dialer — Nooks-class architecture blueprint.
 *
 * ## Flow (first human answer wins)
 *
 * 1. Agent starts session → `POST /api/dialer/parallel-session/start`
 * 2. `dialParallelBatch()` originates up to `lines_count` Call Control legs (default 3)
 *    with `client_state: { parallel_session_id, parallel_leg_id }`
 * 3. Telnyx fires `call.answered` on the first prospect that picks up
 * 4. `handleParallelLegAnswered()` atomically claims winner (`is_winner=true`)
 * 5. `cancelOtherLegs()` hangups / VM-drops all other active legs + fires tracking webhook
 * 6. `bridgeProspectToAgent()` dials agent's per-user WebRTC SIP with `link_to` +
 *    `bridge_on_answer` (same pattern as inbound PSTN→browser)
 * 7. Browser `setParallelAutoAnswer(true)` → WebPhone auto-answers → media bridges
 * 8. On disposition → next batch until queue empty
 *
 * ## Multi-tenant isolation
 * - Sessions scoped by `workspace_id` + `user_id`
 * - Bridge targets per-user telephony credential (never shared env SIP)
 * - Leg tracking webhooks include workspace + user for downstream analytics
 */

export const MAX_PARALLEL_LINES = 5;
export const MIN_PARALLEL_LINES = 2;
export const DEFAULT_PARALLEL_LINES = 2;

export const PARALLEL_WINNER_STATUSES = ['dialing', 'ringing', 'answered'] as const;

export type ParallelBridgeStrategy = 'webrtc_link_to' | 'sip_transfer_fallback';

export interface ParallelDialBlueprint {
  maxLines: number;
  bridgeStrategy: ParallelBridgeStrategy;
  autoAnswerWebRtc: boolean;
  cancelLosersOnAnswer: boolean;
  optionalAmdGate: boolean;
}

export const PARALLEL_DIAL_BLUEPRINT: ParallelDialBlueprint = {
  maxLines: MAX_PARALLEL_LINES,
  bridgeStrategy: 'webrtc_link_to',
  autoAnswerWebRtc: true,
  cancelLosersOnAnswer: true,
  optionalAmdGate: true,
};

export function clampParallelLines(requested: number | undefined): number {
  const n = requested ?? DEFAULT_PARALLEL_LINES;
  return Math.min(MAX_PARALLEL_LINES, Math.max(MIN_PARALLEL_LINES, n));
}
