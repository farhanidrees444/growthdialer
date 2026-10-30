import { hasSubscriptionAccess } from "@/lib/billing/catalog";
import { isGrandfatheredBillingAccess } from "@/lib/billing/access-rollout";
import { isWhopSelected, whopReady, whopSandbox } from "@/lib/billing/whop";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingEnabled } from "@/lib/billing/billing-flag";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBillingEnabled()) {
    return NextResponse.json({
      status: "none",
      provider: isWhopSelected() ? "whop" : "legacy",
      sandbox: whopSandbox(),
      plan: "trial",
      billingCycle: "monthly",
      seats: 1,
      active: false,
      checkoutConfirmed: false,
      currentPeriodEnd: null,
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
      checkoutAvailable: false,
      billingEnabled: false,
      canManage: false,
      amount: null,
    });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan, billing_cycle, seats, status, trial_ends_at, current_period_end, whop_intent_id, billing_provider, cancel_at_period_end, whop_sandbox, whop_membership_id",
    )
    .eq("user_id", user.id)

    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[SUBSCRIPTION-STATUS] Lookup failed", error);
    return NextResponse.json(
      { error: "Could not load subscription status" },
      { status: 500 },
    );
  }

  const { data: intent } = data?.whop_intent_id
    ? await supabase
        .from("billing_checkout_intents")
        .select("amount")
        .eq("id", data.whop_intent_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: pendingCheckout, error: pendingError } = isWhopSelected()
    ? await supabase.from("billing_checkout_intents")
        .select("plan,cycle,seats,amount")
        .eq("user_id", user.id).eq("sandbox", whopSandbox())
        .is("membership_id", null).maybeSingle()
    : { data: null, error: null };
  if (pendingError) {
    console.error("[SUBSCRIPTION-STATUS] Pending checkout lookup failed", pendingError.code);
    return NextResponse.json({ error: "Could not load your pending checkout" }, { status: 503 });
  }

  return NextResponse.json({
    accessGrandfathered: isWhopSelected() && isGrandfatheredBillingAccess(user.created_at,
      data?.billing_provider === "whop" && data.whop_sandbox === whopSandbox()),
    pendingCheckout,
    status: data?.status ?? "none",
    provider: isWhopSelected() ? "whop" : "legacy",
    sandbox: whopSandbox(),
    plan: data?.plan ?? "trial",
    billingCycle: data?.billing_cycle ?? "monthly",
    seats: data?.seats ?? 1,
    trialEndsAt: data?.trial_ends_at ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    active:
      isWhopSelected()
        ? data?.billing_provider === "whop" && data.whop_sandbox === whopSandbox() &&
          hasSubscriptionAccess(data.status, data.current_period_end)
        : data?.status === "active" || data?.status === "trialing",
    checkoutConfirmed:
      !!data?.whop_intent_id &&
      data.whop_intent_id === request.nextUrl.searchParams.get("intent"),
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    canManage:
      data?.billing_provider === "whop" &&
      !!data.whop_membership_id &&
      data.whop_sandbox === whopSandbox(),
    amount: intent?.amount ?? null,
    checkoutAvailable: whopReady(),
    billingEnabled: isBillingEnabled(),
  });
}
