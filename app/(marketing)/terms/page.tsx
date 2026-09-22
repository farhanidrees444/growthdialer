import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using GrowthDialer — lawful use, accounts, billing, and changes.",
  alternates: { canonical: "https://growthdialer.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <article className="pm-container-narrow pb-24 pt-36 sm:pt-44">
          <Reveal>
            <p className="pm-eyebrow">Legal</p>
            <h1 className="pm-h-display !text-[clamp(2.2rem,5vw,3.25rem)]">Terms of Service</h1>
            <p className="pm-small mt-4">Template — final legal copy to be added.</p>
          </Reveal>

          <div className="mt-12 space-y-10">
            <Reveal>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Using GrowthDialer</h2>
                <p className="pm-body mt-3">
                  By using GrowthDialer you agree to use the service lawfully and to comply with applicable
                  calling regulations (including TCPA and local telemarketing rules) when placing calls.
                  [Replace this section with your finalized terms.]
                </p>
              </section>
            </Reveal>
            <Reveal delay={40}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Accounts</h2>
                <p className="pm-body mt-3">
                  You are responsible for activity under your account and for keeping your credentials secure.
                </p>
              </section>
            </Reveal>
            <Reveal delay={60}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Billing</h2>
                <p className="pm-body mt-3">
                  Paid plans are billed in advance. You can change or cancel your plan from your account
                  settings; changes take effect at the end of the current billing period.
                </p>
              </section>
            </Reveal>
            <Reveal delay={80}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Changes</h2>
                <p className="pm-body mt-3">
                  The product evolves quickly; features may change as we improve. We&apos;ll communicate
                  material changes to these terms.
                </p>
              </section>
            </Reveal>
            <Reveal delay={100}>
              <section>
                <h2 className="pm-h-group !text-[1.3rem]">Contact</h2>
                <p className="pm-body mt-3">
                  Questions? Email{" "}
                  <a href="mailto:legal@growthdialer.com" className="font-semibold text-violet-700 underline-offset-2 hover:underline">
                    legal@growthdialer.com
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
