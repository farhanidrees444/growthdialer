import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Privacy Policy | GrowthDialer",
  description: "How GrowthDialer collects, uses, and protects your data on the calling platform.",
  alternates: { canonical: "https://growthdialer.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <article className="pm-container-narrow pb-24 pt-36 sm:pt-44">
          <Reveal>
            <p className="pm-eyebrow">Legal</p>
            <h1 className="pm-h-display !text-[clamp(2.2rem,5vw,3.25rem)]">Privacy Policy</h1>
            <p className="pm-small mt-4">Template — final legal copy to be added.</p>
          </Reveal>

          <div className="mt-12 space-y-10">
            <Reveal>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Overview</h2>
                <p className="pm-body mt-3">
                  GrowthDialer respects your privacy. This page describes how we collect, use and protect
                  data when you use our calling platform. [Replace this section with your finalized policy.]
                </p>
              </section>
            </Reveal>
            <Reveal delay={40}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Data we process</h2>
                <p className="pm-body mt-3">
                  Account details you provide at sign-up, call metadata required to place and record calls,
                  recordings and transcripts you choose to capture, and product usage that helps us improve.
                </p>
              </section>
            </Reveal>
            <Reveal delay={60}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">How it&apos;s used</h2>
                <p className="pm-body mt-3">
                  To deliver dialing, recording, transcription and analytics; to secure your account; and to
                  support you. We do not sell your data.
                </p>
              </section>
            </Reveal>
            <Reveal delay={80}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Your choices</h2>
                <p className="pm-body mt-3">
                  You control recording behavior in settings and can request export or deletion of your data
                  at any time.
                </p>
              </section>
            </Reveal>
            <Reveal delay={100}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Contact</h2>
                <p className="pm-body mt-3">
                  Questions? Email{" "}
                  <a href="mailto:privacy@growthdialer.com" className="font-semibold text-violet-700 underline-offset-2 hover:underline">
                    privacy@growthdialer.com
                  </a>.
                </p>
              </section>
            </Reveal>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
