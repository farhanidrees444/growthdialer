import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar, Footer } from "@/components/marketing/v2/Chrome";
import { RiskBullets, SectionHead } from "@/components/marketing/v2/Sections";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "./ContactForm";
import { APP_SIGNUP } from "@/components/marketing/v2/copy";
import { MARKETING_SITE } from "@/lib/marketing/navigation";

export const metadata: Metadata = {
  title: { absolute: "Contact Sales — Talk to the GrowthDialer Team" },
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

        {/* What happens after you submit */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <SectionHead
              eyebrow="What happens next"
              title="After you hit send."
              align="left"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  n: '01',
                  title: 'An honest reply',
                  body: 'A real person — not a sequence — replies within one business day. If we’re a bad fit, we’ll say so.',
                },
                {
                  n: '02',
                  title: 'A 20-minute fit call',
                  body: 'We walk through your current outbound workflow and whether GrowthDialer actually fits it. No deck, no discovery theater.',
                },
                {
                  n: '03',
                  title: 'A trial workspace',
                  body: 'If it’s a fit, you get your own workspace and a 7-day trial — your leads, your calls, no credit card.',
                },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <article className="pm-card h-full p-7">
                    <span className="pm-h-display !text-[clamp(1.75rem,3.5vw,2.25rem)] !leading-none text-violet-600/80">
                      {s.n}
                    </span>
                    <h3 className="pm-h-card mt-4">{s.title}</h3>
                    <p className="pm-body mt-3 !text-[14.5px]">{s.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Page-specific closing CTA */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[380px]" />
          <div className="pm-container-narrow relative py-20 text-center sm:py-24">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Skip the call</p>
              <h2 className="pm-h-section-dark mx-auto max-w-2xl">
                Rather just try it yourself?
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                The trial needs no conversation. Spin up a workspace, import a list, and put 7 days of your own calls through the dialer — no credit card.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/pricing" className="pm-btn pm-btn-ghostlight">
                  See pricing first
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
