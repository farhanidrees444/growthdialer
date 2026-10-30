import Link from "next/link";
import { notFound } from "next/navigation";
import { BillingWorkspace } from "@/components/billing/billing-workspace";
export const dynamic = "force-dynamic";
export default function BillingPreview() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <main className="bill-preview-shell">
      <nav className="bill-preview-nav">
        <Link href="/pricing" className="font-semibold tracking-tight">
          GrowthDialer<span className="text-cyan-200">.</span>
        </Link>
        <span className="bill-preview-label">Design preview · No payments</span>
      </nav>
      <BillingWorkspace preview />
    </main>
  );
}
