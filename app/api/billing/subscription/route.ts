import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  billingAppUrl,
  getWhop,
  whopReady,
  whopSandbox,
} from "@/lib/billing/whop";
import { syncWhopMembership } from "@/lib/billing/sync-membership";

export async function POST(request: NextRequest) {
  if (!whopReady())
    return NextResponse.json(
      { error: "Subscription management is not available yet" },
      { status: 503 },
    );
  if (request.headers.get("origin") !== billingAppUrl())
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Please sign in to manage billing" },
      { status: 401 },
    );
  let action;
  try {
    action = (await request.json()).action;
  } catch {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!["cancel", "keep", "sync"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const { data: subscription, error } = await db
    .from("subscriptions")
    .select("whop_membership_id, whop_sandbox")
    .eq("user_id", user.id)
    .maybeSingle();
  if (
    error ||
    !subscription?.whop_membership_id ||
    subscription.whop_sandbox !== whopSandbox()
  )
    return NextResponse.json(
      { error: "No subscription to manage" },
      { status: 404 },
    );
  const service = createServiceClient();
  if (!service)
    return NextResponse.json(
      { error: "Billing is temporarily unavailable" },
      { status: 503 },
    );
  try {
    const api = getWhop();
    const membership = await api.memberships.retrieve({
      id: subscription.whop_membership_id,
    });
    if (membership.account.id !== process.env.WHOP_COMPANY_ID)
      throw new Error("Account mismatch");
    // Ownership is checked against our server-recorded intent before any mutation.
    const { data: intent } = await db
      .from("billing_checkout_intents")
      .select("id")
      .eq("id", membership.metadata.growthdialer_intent)
      .eq("membership_id", membership.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!intent)
      return NextResponse.json(
        { error: "Subscription ownership could not be verified" },
        { status: 403 },
      );
    if (
      action !== "sync" &&
      !["active", "trialing", "past_due", "canceling"].includes(
        membership.status,
      )
    )
      return NextResponse.json(
        { error: "This subscription is no longer renewable" },
        { status: 409 },
      );
    const updated =
      action === "sync"
        ? membership
        : await api.memberships.update({
            id: membership.id,
            cancel_at_period_end: action === "cancel",
          });
    await syncWhopMembership(service, updated);
    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    });
  } catch {
    console.error("[BILLING] Subscription management failed");
    return NextResponse.json(
      {
        error:
          "Could not update your subscription. Refresh your status before trying again.",
      },
      { status: 502 },
    );
  }
}
