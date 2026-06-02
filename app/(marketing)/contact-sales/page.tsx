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
      <section className="relative px-5 pb-24 pt-36 lg:px-8 lg:pt-44">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-8 h-[380px] w-[min(90vw,720px)] -translate-x-1/2 rounded-full opacity-[0.08] blur-[120px]"
          style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">Contact</p>
            <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.25rem)] font-light leading-[1.04] tracking-tight text-[#F5F5F7]">
              Let&apos;s talk.
            </h1>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-zinc-400">
              Questions about GrowthDialer, a larger team, or custom needs? Send a
              note and we&apos;ll reply within one business day.
            </p>
            <div className="mt-8 space-y-3 text-[14px]">
              <p className="text-zinc-500">
                Prefer email?{" "}
                <a href="mailto:hello@growthdialer.com" className="text-[#8B5CF6] underline-offset-2 hover:underline">
                  hello@growthdialer.com
                </a>
              </p>
              <p className="text-zinc-500">
                Ready to dive in?{" "}
                <a href="https://app.growthdialer.com/signup" className="text-[#8B5CF6] underline-offset-2 hover:underline">
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
