import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellPlus, Check, Download } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Integrations — HubSpot Live, More on the Way | GrowthDialer',
  description:
    'The HubSpot connector is live today: calls, dispositions, and notes log to contact timelines automatically. Salesforce, Pipedrive, Slack, Zapier, and more are in development — join the waitlist.',
  alternates: { canonical: `${MARKETING_SITE}/integrations` },
  openGraph: {
    title: 'GrowthDialer Integrations',
    description: 'HubSpot is live. Every other connector is honestly labeled in development.',
    url: `${MARKETING_SITE}/integrations`,
    type: 'website',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  crm: 'CRMs',
  communication: 'Communication',
  automation: 'Automation',
  calendar: 'Calendar',
  productivity: 'Productivity',
};

const HUBSPOT_STEPS = [
  { title: 'Authorize in HubSpot', body: 'Connect from Settings → Integrations with standard OAuth — contacts read/write, calls write.' },
  { title: 'Dial as usual', body: 'Nothing changes in the workflow. Reps disposition calls the way they always do.' },
  { title: 'Calls land on timelines', body: 'On every disposition, the call, outcome, and notes log to the matching contact automatically.' },
];

const INTEGRATIONS_FAQS = [
  {
    q: 'Which integrations are live today?',
    a: 'HubSpot. The native OAuth connector is live — connect it from Settings → Integrations and every disposition logs the call, outcome, and notes to the matching contact\u2019s timeline automatically. Every other connector below is in development.',
  },
  {
    q: 'How does the waitlist work?',
    a: 'Tell us which tools you need. We build connectors in waitlist order, and we notify you the moment yours ships. No vaporware — you\u2019ll get a straight answer on timeline.',
  },
  {
    q: 'What about webhooks and API?',
    a: 'The public API and webhook events are on the roadmap alongside the next CRM connectors. Until then, CSV export keeps your data portable.',
  },
] as const;

export default function IntegrationsMarketingPage() {
  const liveCount = INTEGRATION_BRANDS.filter((b) => b.live).length;
  const devCount = INTEGRATION_BRANDS.length - liveCount;
  const categories = Object.keys(CATEGORY_LABELS).filter((c) =>
    INTEGRATION_BRANDS.some((b) => b.category === c),
  );

  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* Hero — light, left-aligned, honest legend */}
        <section className="px-5 pb-14 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
          <div className="pm-container">
            <Reveal>
              <p className="pm-eyebrow">Integrations</p>
              <h1 className="pm-h-display mt-4 max-w-3xl !text-[clamp(2.4rem,5vw,3.9rem)]">
                One live. {devCount} on the way.
              </h1>
              <p className="pm-lead mt-6 max-w-2xl">
                HubSpot connects today — calls, dispositions, and notes land on the matching
                contact&apos;s timeline automatically. Every other connector is in development, built
                in waitlist order. No &ldquo;live&rdquo; badges on things that aren&apos;t.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5" aria-label="Integration status legend">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-[12px] font-bold text-emerald-800">
                  <Check className="h-3.5 w-3.5" />
                  {liveCount} live today
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1.5 text-[12px] font-bold text-amber-800">
                  <BellPlus className="h-3.5 w-3.5" />
                  {devCount} in development
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How HubSpot connects — concrete, code-verified */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <Reveal>
              <h2 className="pm-h-group max-w-xl">How the HubSpot connector works.</h2>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HUBSPOT_STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 80}>
                  <div className="pm-card h-full p-6">
                    <p aria-hidden className="pm-step-num !text-[2.2rem]">0{i + 1}</p>
                    <h3 className="pm-h-card mt-3">{s.title}</h3>
                    <p className="pm-body mt-2 !text-[14px]">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Brand grid — honestly labeled */}
        <div className="pm-section-tight">
          <div className="pm-container">
            <Reveal>
              <h2 className="pm-h-group">Every connector, honestly labeled.</h2>
              <p className="pm-body mt-4 max-w-2xl">
                One card carries a Live badge because the connector shipped. The rest say
                In development because that&apos;s the truth.
              </p>
            </Reveal>
            {categories.map((category) => (
              <div key={category} className="mb-12 mt-10 last:mb-0">
                <Reveal>
                  <h3 className="pm-eyebrow !mb-6">{CATEGORY_LABELS[category]}</h3>
                </Reveal>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {INTEGRATION_BRANDS.filter((b) => b.category === category).map((brand, i) => (
                    <Reveal key={brand.id} delay={(i % 3) * 70}>
                      <article
                        className={
                          brand.live
                            ? 'h-full rounded-[1.4rem] border-2 border-emerald-500/40 bg-emerald-50/40 p-6'
                            : 'pm-card pm-card-hover h-full p-6'
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: `${brand.color}1A`, color: brand.color }}
                          >
                            <brand.Icon className="h-5 w-5" />
                          </span>
                          {brand.live ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800">
                              <Check className="h-3 w-3" />
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-800">
                              <BellPlus className="h-3 w-3" />
                              In development
                            </span>
                          )}
                        </div>
                        <h4 className="pm-h-card mt-4">{brand.name}</h4>
                        <p className="pm-body mt-2 !text-[14px]">{brand.description}</p>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist CTA */}
        <div className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container-narrow text-center">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered">Get notified</p>
              <h2 className="pm-h-section">Your CRM not here — or here, but waitlisted?</h2>
              <p className="pm-lead mx-auto mt-5 max-w-xl">
                Start your trial today — HubSpot users can connect now, and everything exports via
                CSV. Tell us which connector you need and we&apos;ll notify you the day it ships.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/contact-sales" className="pm-btn pm-btn-secondary">
                  <Download className="h-4 w-4" /> Join the waitlist
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="pm-divider">
          <Faq items={INTEGRATIONS_FAQS} eyebrow="FAQ" title="Integration questions, answered straight." />
        </div>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
