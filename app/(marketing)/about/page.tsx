import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { EarlyAccess } from "@/components/marketing/home/EarlyAccess";

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
      {/* Hero */}
      <section className="relative px-5 pt-36 lg:px-8 lg:pt-44">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-8 h-[420px] w-[min(90vw,820px)] -translate-x-1/2 rounded-full opacity-[0.09] blur-[120px]"
          style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">About</p>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.75rem)] font-light leading-[1.04] tracking-tight text-[#F5F5F7]">
            We&apos;re building the dialer that
            <br />
            <span className="font-medium">understands every call.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400">
            GrowthDialer is an early-stage product. We started it because outbound
            calling tools stop at the recording — leaving reps to take notes,
            guess at sentiment, and forget the follow-up. We think the call itself
            should become structured, searchable data the moment it ends.
          </p>
        </div>
      </section>

      {/* Beliefs */}
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {BELIEFS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
              <h2 className="font-display text-lg font-medium text-[#F5F5F7]">{b.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <EarlyAccess />
    </MarketingShell>
  );
}
