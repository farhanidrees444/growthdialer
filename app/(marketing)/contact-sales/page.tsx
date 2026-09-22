import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { RiskBullets } from "@/components/marketing/v2/Sections";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "./ContactForm";
import { APP_SIGNUP } from "@/components/marketing/v2/copy";
import { MARKETING_SITE } from "@/lib/marketing/navigation";

export const metadata: Metadata = {
  title: "Contact Sales — Talk to the GrowthDialer Team",
  description:
    "Questions about GrowthDialer, a larger team, or custom needs? Send a note and we'll reply within one business day.",
  alternates: { canonical: `${MARKETING_SITE}/contact-sales` },
};

export default function ContactSalesPage() {
  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-5 pb-24 pt-36 sm:pt-44 lg:px-8">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
            <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
          </div>
          <div className="pm-container relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <p className="pm-eyebrow">Contact sales</p>
                <h1 className="pm-h-display !text-[clamp(2.2rem,4.5vw,3.25rem)]">Let&apos;s talk.</h1>
                <p className="pm-lead mt-5 max-w-md">
                  Questions about GrowthDialer, a larger team, or custom needs? Send a
                  note and we&apos;ll reply within one business day.
                </p>
                <ul className="mt-8 space-y-4">
                  <li>
                    <p className="pm-small font-semibold uppercase tracking-[0.14em]">Prefer email?</p>
                    <a href="mailto:hello@growthdialer.com" className="mt-1 inline-block font-medium text-[#6d28d9] underline-offset-2 hover:underline">
                      hello@growthdialer.com
                    </a>
                  </li>
                  <li>
                    <p className="pm-small font-semibold uppercase tracking-[0.14em]">Ready to dive in?</p>
                    <a href={APP_SIGNUP} className="mt-1 inline-block font-medium text-[#6d28d9] underline-offset-2 hover:underline">
                      Start free
                    </a>
                    <span className="pm-small"> — no credit card.</span>
                  </li>
                </ul>
                <RiskBullets className="mt-10" />
              </Reveal>
              <Reveal delay={140}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
