import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GrowthDialer handles your data.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-36 lg:px-8 lg:pt-44">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">Legal</p>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.25rem)] font-light tracking-tight text-[#F5F5F7]">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[13px] text-zinc-600">Template — final legal copy to be added.</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Overview</h2>
            <p>
              GrowthDialer respects your privacy. This page describes how we collect, use and protect
              data when you use our calling platform. [Replace this section with your finalized policy.]
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Data we process</h2>
            <p>
              Account details you provide at sign-up, call metadata required to place and record calls,
              recordings and transcripts you choose to capture, and product usage that helps us improve.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">How it&apos;s used</h2>
            <p>
              To deliver dialing, recording, transcription and analytics; to secure your account; and to
              support you. We do not sell your data.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Your choices</h2>
            <p>
              You control recording behavior in settings and can request export or deletion of your data
              at any time.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-medium text-[#F5F5F7]">Contact</h2>
            <p>
              Questions? Email{" "}
              <a href="mailto:privacy@growthdialer.com" className="text-[#8B5CF6] underline-offset-2 hover:underline">
                privacy@growthdialer.com
              </a>.
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
