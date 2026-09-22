import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellPlus, Check, Mail } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Faq, RiskBullets } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { Counter } from '@/components/marketing/v2/motion';
import {
  INTEGRATION_BRANDS,
  type IntegrationBrand,
} from '@/lib/marketing/integration-brands';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Integrations — CRM Connectors on the Roadmap',
  description:
    'Native CRM integrations for GrowthDialer are in development — HubSpot, Salesforce, Pipedrive, Slack, Zapier and more. Join the waitlist for your stack.',
  alternates: { canonical: `${MARKETING_SITE}/integrations` },
  openGraph: {
    title: 'GrowthDialer Integrations',
    description: 'CRM and automation connectors in development — join the waitlist for yours.',
    url: `${MARKETING_SITE}/integrations`,
    type: 'website',
  },
};

const CONTACT_EMAIL = 'hello@growthdialer.com';
const requestHref = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

const CATEGORY_LABELS: Record<string, string> = {
  crm: 'CRMs',
  communication: 'Communication',
  automation: 'Automation',
  calendar: 'Calendar',
  productivity: 'Productivity',
};

const INTEGRATIONS_FAQS = [
  {
    q: 'Which integrations are live today?',
    a: 'HubSpot — calls, dispositions, and recordings log to contact timelines after every dial. Everything else on this page is in development and waitlist-only.',
  },
  {
    q: 'How does the waitlist work?',
    a: 'Tell us which tools you need. We build connectors in waitlist order, and we notify you the moment yours ships. No vaporware — you’ll get a straight answer on timeline.',
  },
  {
    q: 'What about webhooks and the API?',
    a: 'Both are on the roadmap alongside the first CRM connectors. Until then, CSV export keeps your data portable.',
  },
] as const;

const WAITLIST_STEPS = [
  {
    num: '01',
    title: 'Tell us your stack',
    body: 'Request the connector you need — one email, thirty seconds.',
  },
  {
    num: '02',
    title: 'We build in waitlist order',
    body: 'The most-requested connectors ship first. No silent roadmap.',
  },
  {
    num: '03',
    title: 'You hear it first',
    body: 'The day your connector ships, you get the email before anyone else.',
  },
];

/* ── Status vocabulary: Live (green) / In development (amber) / Roadmap (neutral) ── */
function StatusChip({ status }: { status: 'live' | 'dev' | 'roadmap' }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800">
        <span className="pm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        Live
      </span>
    );
  }
  if (status === 'dev') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        In development
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
      Roadmap
    </span>
  );
}

function ConnectorCard({ brand }: { brand: IntegrationBrand }) {
  return (
    <article className="pm-card pm-card-hover flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${brand.color}1A`, color: brand.color }}
        >
          <brand.Icon className="h-5 w-5" />
        </span>
        <StatusChip status="dev" />
      </div>
      <h4 className="pm-h-card mt-4">{brand.name}</h4>
      <p className="pm-body mt-2 flex-1 !text-[14px]">{brand.description}</p>
      <a
        href={requestHref(`Waitlist: ${brand.name} integration`)}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d28d9] transition hover:gap-2.5"
      >
        <BellPlus className="h-4 w-4" /> Notify me when it ships
      </a>
    </article>
  );
}

export default function IntegrationsMarketingPage() {
  const live = INTEGRATION_BRANDS.filter((b) => b.live);
  const inDev = INTEGRATION_BRANDS.filter((b) => !b.live);
  const categories = Object.keys(CATEGORY_LABELS).filter((c) =>
    inDev.some((b) => b.category === c),
  );

  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* ── Hero: the board of record ─────────────────────────── */}
        <section className="relative overflow-hidden px-5 pb-12 pt-36 sm:pb-16 sm:pt-44 lg:px-8">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="pm-dot-grid pm-fade-hero absolute inset-0 opacity-70" />
            <div className="pm-glow-top absolute inset-x-0 top-0 h-[420px]" />
          </div>
          <div className="pm-container-narrow relative text-center">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered">Integrations · Live status</p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="pm-h-display">
                Every connector,
                <br />
                honestly labeled.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="pm-lead mx-auto mt-6 max-w-2xl">
                One integration is live today. Nine more are in development and
                waitlist-only. This page is the board of record — no live badges
                on things that aren&apos;t.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                  <span className="pm-pulse-dot h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  <Counter to={live.length} /> live
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-600/20 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <Counter to={inDev.length} /> in development
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-950/[0.10] bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />0 pretending
                </span>
              </div>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </a>
                <a href={requestHref('Integration request')} className="pm-btn pm-btn-secondary">
                  <Mail className="h-4 w-4" /> Request an integration
                </a>
              </div>
              <RiskBullets className="mt-6 justify-center" />
            </Reveal>
          </div>
        </section>

        {/* ── Live now ──────────────────────────────────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container">
            <Reveal>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h2 className="pm-h-group">Live now</h2>
                <StatusChip status="live" />
              </div>
            </Reveal>
            {live.map((brand, i) => (
              <Reveal key={brand.id} delay={i * 80}>
                <article className="relative overflow-hidden rounded-3xl border border-emerald-600/20 bg-gradient-to-br from-emerald-50/80 via-white to-white p-8 sm:p-10">
                  <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-4">
                        <span
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${brand.color}1A`, color: brand.color }}
                        >
                          <brand.Icon className="h-7 w-7" />
                        </span>
                        <div>
                          <h3 className="font-display text-2xl font-semibold tracking-tight text-zinc-950">
                            {brand.name}
                          </h3>
                          <p className="mt-0.5 text-sm font-medium text-emerald-700">
                            Connected in one click, inside your trial
                          </p>
                        </div>
                      </div>
                      <p className="pm-body mt-5">{brand.description}</p>
                      <ul className="mt-5 space-y-2.5">
                        {[
                          'Calls log to contact timelines automatically',
                          'Dispositions sync after every dial',
                          'Recordings attached where your team already works',
                        ].map((point) => (
                          <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-700">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="shrink-0">
                      <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                        Connect {brand.name} <ArrowRight className="h-4 w-4" />
                      </a>
                      <p className="pm-caption mt-3 text-center sm:text-left">
                        7-day trial · No credit card
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── In development: the status board ──────────────────── */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <Reveal>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="pm-h-group">In development</h2>
                <StatusChip status="dev" />
              </div>
              <p className="pm-body max-w-2xl">
                Being built now, waitlist open. Join the list for your stack and
                we&apos;ll tell you straight when yours ships — most-requested
                first.
              </p>
            </Reveal>
            {categories.map((category) => (
              <div key={category} className="mb-12 mt-10 last:mb-0">
                <Reveal>
                  <h3 className="pm-eyebrow !mb-6">{CATEGORY_LABELS[category]}</h3>
                </Reveal>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inDev
                    .filter((b) => b.category === category)
                    .map((brand, i) => (
                      <Reveal key={brand.id} delay={(i % 3) * 70} className="h-full">
                        <ConnectorCard brand={brand} />
                      </Reveal>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Roadmap ───────────────────────────────────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container">
            <Reveal>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="pm-h-group">On the roadmap</h2>
                <StatusChip status="roadmap" />
              </div>
              <p className="pm-body max-w-2xl">
                Requested, not started. These move up the moment teams ask for
                them — starting with yours.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Public API',
                  body: 'Programmatic access to calls, recordings, and dispositions.',
                },
                {
                  title: 'Webhooks',
                  body: 'Real-time events on call ended, disposition set, meeting booked.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 70} className="h-full">
                  <article className="pm-card flex h-full flex-col p-6 opacity-90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="pm-h-card">{item.title}</h4>
                      <StatusChip status="roadmap" />
                    </div>
                    <p className="pm-body mt-2 flex-1 !text-[14px]">{item.body}</p>
                    <a
                      href={requestHref(`Waitlist: ${item.title}`)}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d28d9] transition hover:gap-2.5"
                    >
                      <BellPlus className="h-4 w-4" /> Notify me when it ships
                    </a>
                  </article>
                </Reveal>
              ))}
              <Reveal delay={140} className="h-full">
                <a
                  href={requestHref('Integration request')}
                  className={cn(
                    'group flex h-full flex-col justify-between rounded-2xl border-2 border-dashed',
                    'border-[#6d28d9]/30 bg-[#6d28d9]/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#6d28d9]/60 hover:bg-[#6d28d9]/[0.07] hover:shadow-xl',
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="pm-h-card">Your stack here</h4>
                      <StatusChip status="roadmap" />
                    </div>
                    <p className="pm-body mt-2 !text-[14px]">
                      Don&apos;t see your CRM? One email puts it on the board —
                      and on the build list.
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d28d9] transition group-hover:gap-2.5">
                    <Mail className="h-4 w-4" /> Request an integration <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── How the waitlist works ────────────────────────────── */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <Reveal>
              <p className="pm-eyebrow">The waitlist</p>
              <h2 className="pm-h-section mt-4 max-w-2xl">How your connector gets built.</h2>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {WAITLIST_STEPS.map((step, i) => (
                <Reveal key={step.num} delay={i * 90} className="h-full">
                  <div className="pm-card h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <p className="font-display text-sm font-bold tracking-[0.18em] text-[#6d28d9]">
                      {step.num}
                    </p>
                    <h3 className="pm-h-card mt-3">{step.title}</h3>
                    <p className="pm-body mt-2 !text-[14px]">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <div className="pm-divider">
          <Faq
            items={INTEGRATIONS_FAQS}
            eyebrow="FAQ"
            title="Integration questions, answered straight."
          />
        </div>

        {/* ── Page-specific final CTA ───────────────────────────── */}
        <section className="pm-dark">
          <div aria-hidden className="pm-dark-grid absolute inset-0" />
          <div aria-hidden className="pm-dark-glow absolute inset-x-0 top-0 h-[420px]" />
          <div className="pm-container relative py-24 text-center sm:py-32">
            <Reveal>
              <p className="pm-eyebrow pm-eyebrow-centered !text-violet-300">Integrations</p>
              <h2 className="pm-h-section-dark mx-auto max-w-3xl">
                Start with HubSpot live.
                <br />
                Shape what ships next.
              </h2>
              <p className="pm-lead-dark mx-auto mt-5 max-w-xl">
                Connect the one CRM that&apos;s ready today — and put your stack
                on the board for tomorrow.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={APP_SIGNUP} className="pm-btn pm-btn-white">
                  Start your 7-day trial — no credit card <ArrowRight className="h-4 w-4" />
                </a>
                <a href={requestHref('Integration request')} className="pm-btn pm-btn-ghostlight">
                  <Mail className="h-4 w-4" /> Request an integration
                </a>
              </div>
              <RiskBullets dark className="mt-8 justify-center" />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
