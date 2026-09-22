import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, PhoneCall, Rocket, Layers } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: { absolute: 'Customers — Who GrowthDialer Is For' },
  description:
    'Outbound teams use GrowthDialer for power dialing, AI call summaries, HubSpot logging, and manager coaching. No invented testimonials — see who it’s built for and join early access.',
  alternates: { canonical: `${MARKETING_SITE}/customers` },
};

const SDR_POINTS = [
  'Morning power sessions with auto-advance — reps talk, the dialer advances',
  'Eight standard dispositions, so every call is categorized the same way',
  'Connect rate and talk time in analytics, no shadowing every dial',
  'Call summaries and recordings sync to the HubSpot timeline',
];

const FOUNDER_POINTS = [
  'One seat, one tool — no per-seat sprawl while you’re the whole sales team',
  'Every call logged and summarized automatically, no assistant required',
  'Up to five parallel lines when a campaign needs real volume',
  '7-day trial with no credit card — judge it on your own calls',
];

const AGENCY_POINTS = [
  'Isolated workspaces per client — separate numbers, leads, and call logs',
  'Managers switch accounts from a single login',
  'Per-client dispositions keep reporting clean across accounts',
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'GrowthDialer Customer Stories',
            description: 'Who GrowthDialer is built for and how outbound teams use it.',
            url: `${MARKETING_SITE}/customers`,
          }}
        />
        <PageHero
          eyebrow="Customers"
          title={
            <>
              Built for teams who
              <br />
              live on the phone.
            </>
          }
          lede="We’re onboarding our first production teams now. No logo wall, no invented testimonials — just the three workflows GrowthDialer was built around. Detailed stories publish only when customers opt in."
          cta={{ label: 'Start your pilot', href: APP_SIGNUP }}
        />

        {/* ── Persona 01: SDR teams — numbered editorial row ── */}
        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Who it’s for"
              title="The floors GrowthDialer was built on."
              align="left"
            />
            <Reveal>
              <div className="grid gap-8 border-y border-zinc-950/[0.08] py-10 sm:py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
                <div>
                  <span className="pm-h-display !text-[clamp(2.5rem,5vw,3.5rem)] !leading-none text-violet-600/80">01</span>
                  <h3 className="pm-h-section mt-4 !text-[clamp(1.4rem,2.6vw,1.9rem)]">SDR teams</h3>
                  <p className="pm-body mt-4 max-w-md">
                    In-house outbound pods running morning power sessions. Reps need volume without chaos; managers need honest numbers without hovering.
                  </p>
                  <Link
                    href="/solutions/sdr-teams"
                    className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-700 hover:underline"
                  >
                    The SDR playbook <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <ul className="space-y-5">
                  {SDR_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3.5 border-b border-zinc-950/[0.06] pb-5 last:border-0 last:pb-0">
                      <span className="pm-tick mt-0.5 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="pm-body">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* ── Persona 02: founders — asymmetric offset card ── */}
            <Reveal delay={60}>
              <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-10">
                <div className="rounded-3xl bg-violet-700 p-8 text-white sm:p-10 lg:col-span-7 lg:col-start-1">
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-violet-200" />
                    <p className="pm-eyebrow !text-violet-200">02 · Founders doing founder-led sales</p>
                  </div>
                  <h3 className="pm-h-card mt-5 !text-white !text-[clamp(1.4rem,2.6vw,1.9rem)]">
                    You are the demos, the dials, and the follow-ups.
                  </h3>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-violet-100">
                    Founder-led outbound doesn’t need an enterprise suite — it needs a dialer that doesn’t create admin work for the person already doing everything.
                  </p>
                  <ul className="mt-7 space-y-3.5">
                    {FOUNDER_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                        <span className="text-[14.5px] leading-relaxed text-violet-50">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={APP_SIGNUP} className="pm-btn mt-8 bg-white text-violet-800 hover:bg-violet-50">
                    Start free — no credit card <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="flex flex-col justify-center lg:col-span-5">
                  <PhoneCall className="h-8 w-8 text-violet-600" />
                  <p className="pm-h-card mt-5 !text-[1.25rem] leading-snug">
                    “Does it work for a team of one?”
                  </p>
                  <p className="pm-body mt-3">
                    That’s the team size we optimize around first. If the dialer creates more work than it removes for a solo founder, it fails our bar — no matter how well it scales.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* ── Persona 03: agencies — full-width workspace band ── */}
            <Reveal delay={60}>
              <div className="mt-12 overflow-hidden rounded-3xl border border-zinc-950/[0.08] bg-zinc-50/70">
                <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:gap-12">
                  <div>
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-violet-700" />
                      <p className="pm-eyebrow">03 · Agencies</p>
                    </div>
                    <h3 className="pm-h-section mt-4 !text-[clamp(1.4rem,2.6vw,1.9rem)]">
                      One login. Every client kept separate.
                    </h3>
                    <p className="pm-body mt-4 max-w-md">
                      Outbound agencies run campaigns for multiple clients at once. GrowthDialer keeps each client’s numbers, leads, and call logs isolated — while your team works from a single login.
                    </p>
                    <Link
                      href="/contact-sales"
                      className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-700 hover:underline"
                    >
                      Talk to us about an agency pilot <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <ul className="flex flex-col justify-center gap-4">
                    {AGENCY_POINTS.map((point, i) => (
                      <li
                        key={point}
                        className="pm-card flex items-start gap-4 p-5 lg:ml-10"
                        style={i === 1 ? { marginLeft: 0 } : undefined}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600/10 font-semibold text-[13px] text-violet-700">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="pm-body !text-[14.5px]">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Honest note */}
        <section className="pm-dark mt-4">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[380px]" />
          <div className="pm-container relative py-20 text-center sm:py-24">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">No fake social proof</p>
              <h2 className="pm-h-section-dark mx-auto max-w-2xl">
                You won’t find invented testimonials here.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                No “2,400 happy teams.” No five-star badges without a source. We publish a customer
                story only when a real team gives us real numbers — until then, judge us on a 7-day
                trial of your own calls.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-ghostlight">
                  Become an early story
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
