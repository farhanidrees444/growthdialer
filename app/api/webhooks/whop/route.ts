import { unwrapWebhook } from "@whop/sdk/helpers";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getWhop, whopReady } from "@/lib/billing/whop";
import { syncWhopMembership } from "@/lib/billing/sync-membership";
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
    await syncWhopMembership(
      db,
      await getWhop().memberships.retrieve({ id: event.data.id }),
      event.id,
    );
    return NextResponse.json({ received: true });
  } catch {
    console.error("[WHOP-WEBHOOK] Membership sync failed");
    return NextResponse.json(
      { error: "Could not sync subscription" },
      { status: 500 },
    );
  }
}
