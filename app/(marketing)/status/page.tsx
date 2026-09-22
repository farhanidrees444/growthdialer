import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageSquareWarning } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: { absolute: 'System Status — GrowthDialer uptime' },
  description:
    'Current operational status for the GrowthDialer web app, dialer, call intelligence, and integrations.',
  alternates: { canonical: `${MARKETING_SITE}/status` },
};

const SERVICES = [
  { name: 'Web application', status: 'operational' as const, note: 'Dashboard, dialer, and workspace tools' },
  { name: 'Marketing site', status: 'operational' as const, note: 'growthdialer.com' },
  { name: 'Outbound calling', status: 'operational' as const, note: 'Browser dialer and call routing' },
  { name: 'Account & data', status: 'operational' as const, note: 'Sign-in, leads, and call history' },
  { name: 'Call intelligence', status: 'operational' as const, note: 'Recording, transcription, and AI summaries' },
  { name: 'CRM integration', status: 'operational' as const, note: 'HubSpot call logging' },
];

function StatusDot({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        aria-hidden
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
          status === 'operational' && 'bg-emerald-500',
          status === 'degraded' && 'bg-amber-500',
          status === 'outage' && 'bg-red-500'
        )}
      />
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-2.5 w-2.5 rounded-full',
          status === 'operational' && 'bg-emerald-500',
          status === 'degraded' && 'bg-amber-500',
          status === 'outage' && 'bg-red-500'
        )}
      />
    </span>
  );
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'GrowthDialer System Status',
            url: `${MARKETING_SITE}/status`,
          }}
        />
        <PageHero
          eyebrow="Status"
          title={
            <>
              All systems
              <br />
              operational.
            </>
          }
          lede="High-level health for GrowthDialer product surfaces. We post updates here when customers may be affected."
        />

        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="pm-card overflow-hidden !p-0">
                <div className="flex items-center gap-3 border-b border-zinc-950/[0.06] bg-emerald-500/[0.06] px-6 py-4 sm:px-7">
                  <StatusDot status="operational" />
                  <p className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">
                    All systems operational
                  </p>
                </div>
                <ul className="divide-y divide-zinc-950/[0.06]">
                  {SERVICES.map((s) => (
                    <li key={s.name} className="flex items-start justify-between gap-4 px-6 py-4 sm:px-7">
                      <div>
                        <p className="text-[15px] font-medium tracking-[-0.01em] text-zinc-950">
                          {s.name}
                        </p>
                        <p className="pm-small mt-0.5">{s.note}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 pt-1">
                        <StatusDot status={s.status} />
                        <span className="text-[12px] font-semibold capitalize text-emerald-700">
                          {s.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Page-specific closing note — kept calm and factual */}
            <Reveal delay={80}>
              <section className="mt-10 rounded-[1.4rem] border border-zinc-950/[0.08] bg-zinc-50/60 p-8 text-center sm:p-10">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/10 text-violet-700">
                  <MessageSquareWarning className="h-5 w-5" />
                </span>
                <h2 className="pm-h-card mx-auto mt-5 max-w-xl !text-[1.5rem] leading-tight">
                  Seeing something we aren’t?
                </h2>
                <p className="pm-body mx-auto mt-3 max-w-lg">
                  This page is a static snapshot — we update it during incidents. If a call
                  won’t connect or something looks wrong, tell us what you were doing when
                  it happened.
                </p>
                <Link
                  href="/contact-sales"
                  className="pm-btn pm-btn-primary mt-7 inline-flex"
                >
                  Report an issue <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
