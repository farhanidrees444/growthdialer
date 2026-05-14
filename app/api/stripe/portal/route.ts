import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
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
