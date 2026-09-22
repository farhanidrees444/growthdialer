import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { EarlyAccess } from "@/components/marketing/home/EarlyAccess";
import { MarketingPageHero } from "@/components/marketing/live-floor/MarketingPageHero";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "GrowthDialer is an early-stage team building an AI sales dialer that turns every call into searchable revenue intelligence.",
  alternates: { canonical: "https://growthdialer.com/about" },
};

const BELIEFS = [
  {
    title: "The call is the data.",
    body: "Reps shouldn't lose insight to bad notes. Every conversation should become a clean, searchable record automatically.",
  },
  {
    title: "Software should do the busywork.",
    body: "Dialing, recording, transcribing, summarizing — the tool handles it so the rep can focus on the human on the line.",
  },
  {
    title: "Honest by default.",
    body: "We only ship what works, say what's real, and mark what's coming. No vanity metrics, no fake logos.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="About"
        title={
          <>
            We&apos;re building the dialer that
            <br />
            <span className="font-semibold">understands every call.</span>
          </>
        }
        description="GrowthDialer is an early-stage product. We started it because outbound calling tools stop at the recording — leaving reps to take notes, guess at sentiment, and forget the follow-up. We think the call itself should become structured, searchable data the moment it ends."
      />

      {/* Beliefs */}
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {BELIEFS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 3) * 70}>
              <div className="mk-card mk-card-hover h-full p-6">
                <h2 className="font-display text-lg font-semibold text-zinc-950">{b.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <EarlyAccess />
    </MarketingShell>
  );
}
