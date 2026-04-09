import { NextRequest } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { auth } from "@/lib/auth";

function stripeReadyForPlan(planData: (typeof PLANS)[PlanKey]) {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key || key.includes("placeholder")) return false;
  if (!planData.priceId?.trim()) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const { plan, annual } = (await req.json()) as { plan: PlanKey; annual: boolean };

  if (!PLANS[plan]) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planData = PLANS[plan];

  // Enterprise — no checkout, redirect to contact
  if (!planData.priceId) {
    return Response.json({ url: "/contact-sales" });
  }

  if (!stripeReadyForPlan(planData)) {
    const signup = new URL("/signup", req.nextUrl.origin);
    signup.searchParams.set("plan", plan);
    if (annual) signup.searchParams.set("billing", "annual");
    return Response.json({ url: signup.toString() });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planData.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: session?.user?.email ?? undefined,
      metadata: {
        plan,
        annual: annual ? "true" : "false",
        userId: session?.user?.id ?? "guest",
      },
      subscription_data: {
        trial_period_days: 14,
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
