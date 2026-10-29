import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ownedSubscription } from "@/lib/billing/owned-subscription";
import { getWhop, whopReady } from "@/lib/billing/whop";
export const dynamic = "force-dynamic";
export default async function Receipt({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!whopReady()) notFound();
  const owned = await ownedSubscription();
  if (!owned) redirect("/billing");
  const { id } = await params;
  if (!/^pay_[a-zA-Z0-9]+$/.test(id)) notFound();
  const payment = await getWhop()
    .payments.retrieve({ id })
    .catch(() => null);
  if (
    !payment ||
    payment.membership_id !== owned.membershipId ||
    payment.account_id !== process.env.WHOP_COMPANY_ID
  )
    notFound();
  function amount(value: { amount: string; currency: string } | null) {
    return value
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: value.currency,
        }).format(Number(value.amount))
      : "—";
  }
  return (
    <main className="overflow-y-auto p-6 md:p-12 flex-1">
      <article className="mx-auto max-w-xl rounded-2xl bg-white p-8 md:p-12 text-zinc-950">
        <Link href="/billing" className="text-xs text-zinc-500">
          ← Back to billing
        </Link>
        <div className="mt-10 flex justify-between">
          <h1 className="text-2xl font-semibold">Payment receipt</h1>
          <span className="text-sm font-semibold">GrowthDialer</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 break-all">{payment.id}</p>
        <dl className="my-8 space-y-4 text-sm">
          <div className="flex justify-between gap-6">
            <dt>Account</dt>
            <dd>{owned.user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Date</dt>
            <dd>
              {new Date(
                payment.paid_at || payment.created_at,
              ).toLocaleDateString("en-US", { dateStyle: "long" })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Status</dt>
            <dd className="capitalize">{payment.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Payment method</dt>
            <dd>
              {payment.payment_instrument?.display_name || "Secure payment"}
            </dd>
          </div>
        </dl>
        <div className="border-y border-zinc-200 py-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{amount(payment.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{amount(payment.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{amount(payment.total)}</span>
          </div>
        </div>
        <p className="mt-8 text-xs leading-relaxed text-zinc-500">
          This receipt reflects the payment record. Contact support if you need
          a tax invoice or have a billing question.
        </p>
      </article>
    </main>
  );
}
