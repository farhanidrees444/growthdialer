import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using GrowthDialer.",
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-36 lg:px-8 lg:pt-44">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">Legal</p>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.25rem)] font-light tracking-tight text-[#F5F5F7]">
          Terms of Service
        </h1>
        <p className="mt-4 text-[13px] text-zinc-600">Template — final legal copy to be added.</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Using GrowthDialer</h2>
            <p>
              By using GrowthDialer you agree to use the service lawfully and to comply with applicable
              calling regulations (including TCPA and local telemarketing rules) when placing calls.
              [Replace this section with your finalized terms.]
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Accounts</h2>
            <p>
              You are responsible for activity under your account and for keeping your credentials secure.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Billing</h2>
            <p>
              Paid plans are billed in advance. You can change or cancel your plan from your account
              settings; changes take effect at the end of the current billing period.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Changes</h2>
            <p>
              The product evolves quickly; features may change as we improve. We&apos;ll communicate
              material changes to these terms.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Contact</h2>
            <p>
              Questions? Email{" "}
              <a href="mailto:legal@growthdialer.com" className="text-[#8B5CF6] underline-offset-2 hover:underline">
                legal@growthdialer.com
              </a>.
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
