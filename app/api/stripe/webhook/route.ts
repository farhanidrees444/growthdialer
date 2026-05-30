import { NextRequest } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Stripe is not configured on this deployment" },
      { status: 503 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return Response.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 503 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    console.error("[STRIPE-WEBHOOK] Service client unavailable");
    return Response.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!userId || userId === "guest") {
          console.warn("[STRIPE-WEBHOOK] checkout.session.completed: no userId in metadata", session.id);
          break;
        }

        await supabase
          .from("user_settings")
          .upsert(
            {
              user_id: userId,
              plan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_status: "active",
              plan_started_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        console.log("[STRIPE-WEBHOOK] Checkout completed — upgraded:", userId, "→", plan);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status; // active | past_due | canceled | unpaid | incomplete | trialing
        await supabase
          .from("user_settings")
          .update({ plan_status: status })
          .eq("stripe_subscription_id", sub.id);
        console.log("[STRIPE-WEBHOOK] Subscription updated:", sub.id, "→", status);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("user_settings")
          .update({
            plan: "free",
            plan_status: "canceled",
            plan_ended_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        console.log("[STRIPE-WEBHOOK] Subscription cancelled:", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          (invoice as unknown as { subscription?: string | { id: string } }).subscription;
        const subId =
          typeof subscriptionId === "string" ? subscriptionId : subscriptionId?.id;
        if (subId) {
          await supabase
            .from("user_settings")
            .update({ plan_status: "past_due" })
            .eq("stripe_subscription_id", subId);
        }
        console.log("[STRIPE-WEBHOOK] Payment failed:", invoice.customer_email);
        break;
      }

      default:
        console.log("[STRIPE-WEBHOOK] Unhandled event:", event.type);
    }
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Handler error:", err);
    // Still return 200 so Stripe doesn't endlessly retry our own bugs
  }

  return Response.json({ received: true });
}
