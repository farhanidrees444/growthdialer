import { unwrapWebhook } from "@whop/sdk/helpers";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getWhop, whopReady } from "@/lib/billing/whop";
import {
  membershipSchema,
  membershipState,
} from "@/lib/billing/whop-membership";
import { createServiceClient } from "@/lib/supabase/service";
export const runtime = "nodejs";
const envelope = z.object({
  id: z.string(),
  type: z.string(),
  account_id: z.string(),
  data: z.object({ id: z.string() }).passthrough(),
});
export async function POST(request: NextRequest) {
  // Fail retryably while disabled: never silently discard a paid event.
  if (!whopReady() || !process.env.WHOP_WEBHOOK_SECRET)
    return NextResponse.json(
      { error: "Billing is unavailable" },
      { status: 503 },
    );
  let event;
  try {
    event = envelope.parse(
      unwrapWebhook(await request.text(), {
        headers: Object.fromEntries(request.headers),
        key: process.env.WHOP_WEBHOOK_SECRET,
      }),
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }
  if (
    event.account_id !== process.env.WHOP_COMPANY_ID ||
    event.id !== request.headers.get("webhook-id")
  )
    return NextResponse.json(
      { error: "Invalid account or event" },
      { status: 400 },
    );
  // Payments never grant access. Membership state is authoritative, including
  // failed renewals, expiration, refunds and end-of-period cancellation.
  if (!event.type.startsWith("membership."))
    return NextResponse.json({ received: true, ignored: true });
  const db = createServiceClient();
  if (!db)
    return NextResponse.json(
      { error: "Billing persistence unavailable" },
      { status: 503 },
    );
  try {
    const membership = membershipSchema.parse(
      await getWhop().memberships.retrieve({ id: event.data.id }),
    );
    if (membership.account.id !== process.env.WHOP_COMPANY_ID)
      throw new Error("Account mismatch");
    const intent = z.uuid().parse(membership.metadata.growthdialer_intent);
    const { error } = await db.rpc("apply_whop_membership", {
      p_event_id: event.id,
      p_intent_id: intent,
      p_membership_id: membership.id,
      p_plan_id: membership.plan_id,
      p_product_id: membership.product_id,
      p_status: membershipState(membership.status),
      p_updated_at: membership.updated_at,
      p_period_start: membership.current_period_start,
      p_period_end: membership.current_period_end,
      p_cancel_at_period_end: membership.cancel_at_period_end,
      p_sandbox: process.env.WHOP_SANDBOX !== "false",
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch {
    console.error("[WHOP-WEBHOOK] Membership sync failed");
    return NextResponse.json(
      { error: "Could not sync subscription" },
      { status: 500 },
    );
  }
}
