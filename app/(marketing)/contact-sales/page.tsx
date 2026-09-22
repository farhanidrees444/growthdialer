import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the GrowthDialer team about your sales calling setup.",
  alternates: { canonical: "https://growthdialer.com/contact-sales" },
};

export default function ContactSalesPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden px-5 pb-24 pt-36 lg:px-8 lg:pt-44">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="mk-dot-grid mk-fade-grid absolute inset-0" />
          <div className="mk-light-rays absolute inset-x-0 top-0 h-[420px] opacity-70" />
        </div>
        <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mk-eyebrow">Contact</p>
            <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-zinc-950">
              Let&apos;s talk.
            </h1>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-zinc-600">
              Questions about GrowthDialer, a larger team, or custom needs? Send a
              note and we&apos;ll reply within one business day.
            </p>
            <div className="mt-8 space-y-3 text-[14px]">
              <p className="text-zinc-500">
                Prefer email?{" "}
                <a href="mailto:hello@growthdialer.com" className="font-medium text-[#6D28D9] underline-offset-2 hover:underline">
                  hello@growthdialer.com
                </a>
              </p>
              <p className="text-zinc-500">
                Ready to dive in?{" "}
                <a href="https://app.growthdialer.com/signup" className="font-medium text-[#6D28D9] underline-offset-2 hover:underline">
                  Start free
                </a>{" "}
                — no credit card.
              </p>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </MarketingShell>
  );
}
