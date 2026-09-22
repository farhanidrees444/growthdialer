import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isBillingEnabled } from '@/lib/billing/billing-flag';

export async function POST(req: NextRequest) {
  // Billing bypass: checkout/portal disabled until BILLING_ENABLED=true.
  if (!isBillingEnabled()) {
    return Response.json({ error: 'Billing is temporarily unavailable', billingEnabled: false }, { status: 410 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId } = await req.json() as { customerId: string };

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });
    return Response.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal error";
    return Response.json({ error: message }, { status: 500 });
  }
}
