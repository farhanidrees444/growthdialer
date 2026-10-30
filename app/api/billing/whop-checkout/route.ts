import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parsePurchase, purchaseTotal } from "@/lib/billing/catalog";
import {
  billingAppUrl,
  getWhop,
  whopReady,
  whopSandbox,
} from "@/lib/billing/whop";

export async function POST(request: NextRequest) {
  if (!whopReady())
    return NextResponse.json(
      { error: "Checkout is not available yet" },
      { status: 503 },
    );
  const appOrigin = billingAppUrl(request.headers.get("origin") || undefined);
  if (request.headers.get("origin") !== appOrigin)
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Please sign in to continue" },
      { status: 401 },
    );
  let selection;
  try {
    selection = parsePurchase(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Choose a valid plan, billing cycle, and seat count" },
      { status: 400 },
    );
  }
  const db = createServiceClient();
  if (!db)
    return NextResponse.json(
      { error: "Checkout is unavailable" },
      { status: 503 },
    );
  const { data: current, error: currentError } = await db
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (currentError)
    return NextResponse.json(
      { error: "Could not verify billing" },
      { status: 503 },
    );
  if (current && ["active", "trialing", "past_due"].includes(current.status))
    return NextResponse.json(
      {
        error:
          "Manage your existing subscription before purchasing another plan",
      },
      { status: 409 },
    );
  const { count, error: countError } = await db
    .from("billing_checkout_intents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if (countError || (count ?? 0) >= 3)
    return NextResponse.json(
      { error: "Please wait a minute before trying again" },
      { status: 429 },
    );
  const productId = process.env[`WHOP_PRODUCT_${selection.plan.toUpperCase()}`];
  if (!productId?.startsWith("prod_"))
    return NextResponse.json(
      { error: "This plan is not available yet" },
      { status: 503 },
    );
  // Reservation shares the activation transaction's user lock and reuses a
  // single pending intent. Provider retries therefore share one idempotency key.
  const { data: reservation, error: reservationError } = await db.rpc("reserve_whop_checkout", {
    p_id: randomUUID(), p_user_id: user.id, p_plan: selection.plan,
    p_cycle: selection.cycle, p_seats: selection.seats,
    p_amount: purchaseTotal(selection.plan, selection.cycle, selection.seats),
    p_product_id: productId, p_sandbox: whopSandbox(),
  });
  if (reservationError || !reservation) {
    const conflict = reservationError?.code === "P0001";
    return NextResponse.json({ error: conflict
      ? "An existing subscription or unfinished checkout needs attention. Resume the original selection or contact support to change it."
      : "Could not prepare checkout. Please retry." }, { status: conflict ? 409 : 503 });
  }
  const intentId = reservation.id;
  if (reservation.checkout_id)
    return NextResponse.json({ url: `/checkout?intent=${intentId}`, sessionId: reservation.checkout_id, intentId });

  try {
    const config = await getWhop().checkoutConfigurations.create(
      {
        account_id: process.env.WHOP_COMPANY_ID!,
        mode: "payment",
        plan: {
          account_id: process.env.WHOP_COMPANY_ID!,
          product_id: productId,
          title: `${selection.plan} · ${selection.seats} seats`,
          plan_type: "renewal",
          force_create_new_plan: true,
          stock: 1,
          unlimited_stock: false,
          currency: "usd",
          initial_price: 0,
          renewal_price: purchaseTotal(
            selection.plan,
            selection.cycle,
            selection.seats,
          ),
          billing_period: selection.cycle === "annual" ? 365 : 30,
          trial_period_days: 0,
          visibility: "hidden",
          release_method: "buy_now",
        },
        metadata: { growthdialer_intent: intentId },
        redirect_url: `${appOrigin}/checkout/complete?intent=${intentId}`,
      },
      { idempotencyKey: intentId },
    );
    if (!config.plan?.id) throw new Error("Missing checkout plan");
    const { error } = await db
      .from("billing_checkout_intents")
      .update({ checkout_id: config.id, provider_plan_id: config.plan.id })
      .eq("id", intentId);
    if (error) throw error;
    return NextResponse.json({
      url: `/checkout?intent=${intentId}`,
      sessionId: config.id,
      intentId,
    });
  } catch {
    console.error("[WHOP-CHECKOUT] Could not prepare checkout");
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
