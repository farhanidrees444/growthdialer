import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellPlus, Download } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  Faq,
  FinalCta,
  PageHero,
  SectionHead,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Integrations — CRM Connectors on the Roadmap | GrowthDialer',
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
    a: 'None of the native integrations are live yet — they’re all in development and waitlist-only. Today, calls, recordings, transcripts, and disposition history live in your workspace and export via CSV.',
  },
  {
    q: 'How does the waitlist work?',
    a: 'Tell us which tools you need. We build connectors in waitlist order, and we notify you the moment yours ships. No vaporware — you’ll get a straight answer on timeline.',
  },
  {
    q: 'What about webhooks and API?',
    a: 'The public API and webhook events are on the roadmap alongside the first CRM connectors. Until then, CSV export keeps your data portable.',
  },
] as const;

export default function IntegrationsMarketingPage() {
  const categories = Object.keys(CATEGORY_LABELS).filter((c) =>
    INTEGRATION_BRANDS.some((b) => b.category === c),
  );

  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Integrations"
          title={
            <>
              Your stack, connected.
              <br />
              Almost.
            </>
          }
          lede="Native CRM integrations are in development — not vaporware, not demo checkboxes. Join the waitlist for the tools you use and we’ll tell you straight when yours ships."
          cta={{ label: 'Start free trial', href: APP_SIGNUP }}
        />

        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="The roadmap"
              title="Every connector, honestly labeled."
              lede="Everything below is in development and waitlist-only. No “live” badges on things that aren’t."
            />
            {categories.map((category) => (
              <div key={category} className="mb-12 last:mb-0">
                <Reveal>
                  <h3 className="pm-eyebrow !mb-6">{CATEGORY_LABELS[category]}</h3>
                </Reveal>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {INTEGRATION_BRANDS.filter((b) => b.category === category).map((brand, i) => (
                    <Reveal key={brand.id} delay={(i % 3) * 70}>
                      <article className="pm-card pm-card-hover h-full p-6">
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: `${brand.color}1A`, color: brand.color }}
                          >
                            <brand.Icon className="h-5 w-5" />
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-800">
                            <BellPlus className="h-3 w-3" />
                            Waitlist
                          </span>
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
                Start your trial today and export everything via CSV. Tell us which connector you need and
                we’ll notify you the day it ships.
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
