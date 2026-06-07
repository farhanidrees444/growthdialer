import { NextRequest } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspacePlanLimits } from "@/lib/billing/workspace-plans";
import { claimWebhookEvent } from "@/lib/webhooks/dedup";
import Stripe from "stripe";

async function syncWorkspaceBilling(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  workspaceId: string,
  patch: {
    plan?: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    billing_status?: string;
  },
) {
  const limits = patch.plan ? getWorkspacePlanLimits(patch.plan) : null;
  await supabase
    .from("workspaces")
    .update({
      ...patch,
      ...(limits ? { plan: limits.plan, max_seats: limits.max_seats } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Billing is not configured on this deployment" },
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

  const claimed = await claimWebhookEvent(supabase, event.id, "stripe", event.type);
  if (!claimed) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const workspaceId = session.metadata?.workspaceId;
        const plan = session.metadata?.plan;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (workspaceId && plan) {
          await syncWorkspaceBilling(supabase, workspaceId, {
            plan,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            billing_status: "active",
          });
          console.log("[STRIPE-WEBHOOK] Workspace checkout completed:", workspaceId, "→", plan);
        }

        if (userId && userId !== "guest") {
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
          console.log("[STRIPE-WEBHOOK] User checkout completed:", userId, "→", plan);
        } else if (!workspaceId) {
          console.warn("[STRIPE-WEBHOOK] checkout.session.completed: no userId or workspaceId", session.id);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const workspaceId = sub.metadata?.workspaceId;
        const plan = sub.metadata?.plan;

        await supabase
          .from("user_settings")
          .update({ plan_status: status })
          .eq("stripe_subscription_id", sub.id);

        if (workspaceId) {
          await syncWorkspaceBilling(supabase, workspaceId, {
            ...(plan ? { plan } : {}),
            billing_status: status,
            stripe_subscription_id: sub.id,
          });
        } else {
          await supabase
            .from("workspaces")
            .update({ billing_status: status, updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", sub.id);
        }
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

        const workspaceId = sub.metadata?.workspaceId;
        if (workspaceId) {
          await syncWorkspaceBilling(supabase, workspaceId, {
            plan: "free",
            billing_status: "canceled",
            stripe_subscription_id: null,
          });
        } else {
          await supabase
            .from("workspaces")
            .update({
              plan: "free",
              max_seats: 1,
              billing_status: "canceled",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
        }
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
          await supabase
            .from("workspaces")
            .update({ billing_status: "past_due", updated_at: new Date().toISOString() })
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
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
