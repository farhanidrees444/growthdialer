import { NextResponse } from "next/server";
import { ownedSubscription } from "@/lib/billing/owned-subscription";
import { getWhop, whopReady } from "@/lib/billing/whop";
export async function GET() {
  if (!whopReady()) return NextResponse.json({ entries: [], available: false });
  const owned = await ownedSubscription();
  if (!owned) return NextResponse.json({ entries: [], available: false });
  try {
    const payments = await getWhop().payments.list({
      account_id: process.env.WHOP_COMPANY_ID!,
      membership_id: owned.membershipId,
      first: 12,
    });
    const entries = payments.data
      .filter(
        (p) =>
          p.membership_id === owned.membershipId &&
          p.account_id === process.env.WHOP_COMPANY_ID,
      )
      .map((p) => ({
        id: p.id,
        date: p.paid_at || p.created_at,
        amount: p.total?.amount ?? p.subtotal?.amount ?? null,
        currency: p.total?.currency ?? p.currency,
        status: p.status,
        paymentMethod: p.payment_instrument?.display_name ?? null,
      }));
    return NextResponse.json(
      { entries, available: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Payment history is temporarily unavailable. Your subscription is unchanged.",
      },
      { status: 502 },
    );
  }
}
