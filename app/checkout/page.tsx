import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePurchase } from "@/lib/billing/catalog";
import { billingAppUrl, whopReady, whopSandbox } from "@/lib/billing/whop";
import { PurchaseExperience } from "./purchase-experience";
export const dynamic = "force-dynamic";
export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  if (!whopReady())
    return (
      <main className="min-h-screen bg-zinc-950 text-white grid place-items-center p-8">
        <div className="max-w-md">
          <p className="text-violet-300 text-sm">GROWTHDIALER</p>
          <h1 className="text-4xl font-semibold mt-4">
            Checkout is coming soon.
          </h1>
          <p className="text-zinc-400 mt-4">
            Purchasing is not available yet. Your account has not been charged.
          </p>
          <Link href="/pricing" className="inline-block mt-8 underline">
            Back to plans
          </Link>
        </div>
      </main>
    );
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const next = `/checkout?${new URLSearchParams(params as Record<string, string>).toString()}`;
  const host = (await headers()).get("host");
  const appOrigin = billingAppUrl(host ? `https://${host}` : undefined);
  if (host && host !== new URL(appOrigin).host)
    redirect(`${appOrigin}${next}`);
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (params.intent) {
    const { data: intent } = await db
      .from("billing_checkout_intents")
      .select("*")
      .eq("id", params.intent)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!intent?.checkout_id || intent.sandbox !== whopSandbox())
      redirect("/pricing");
    return (
      <PurchaseExperience
        selection={{
          plan: intent.plan,
          cycle: intent.cycle,
          seats: intent.seats,
        }}
        sessionId={intent.checkout_id}
        returnUrl={`${appOrigin}/checkout/complete?intent=${intent.id}`}
        sandbox={whopSandbox()}
      />
    );
  }
  let selection;
  try {
    selection = parsePurchase({
      plan: params.plan,
      cycle: params.cycle ?? "monthly",
      seats: params.seats ?? 1,
    });
  } catch {
    redirect("/pricing");
  }
  return <PurchaseExperience selection={selection} sandbox={whopSandbox()} />;
}
