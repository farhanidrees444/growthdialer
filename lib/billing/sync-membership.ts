import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { membershipSchema, membershipState } from "./whop-membership";
import { whopSandbox } from "./whop";

/** Only call with an authenticated provider response, never browser payloads. */
export async function syncWhopMembership(
  db: SupabaseClient,
  value: unknown,
  eventId = `sync_${randomUUID()}`,
) {
  const membership = membershipSchema.parse(value);
  if (membership.account.id !== process.env.WHOP_COMPANY_ID)
    throw new Error("Account mismatch");
  const intent = z.uuid().parse(membership.metadata.growthdialer_intent);
  const { error } = await db.rpc("apply_whop_membership", {
    p_event_id: eventId,
    p_intent_id: intent,
    p_membership_id: membership.id,
    p_plan_id: membership.plan_id,
    p_product_id: membership.product_id,
    p_status: membershipState(membership.status),
    p_updated_at: membership.updated_at,
    p_period_start: membership.current_period_start,
    p_period_end: membership.current_period_end,
    p_cancel_at_period_end: membership.cancel_at_period_end,
    p_sandbox: whopSandbox(),
  });
  if (error) throw error;
  return membership;
}
