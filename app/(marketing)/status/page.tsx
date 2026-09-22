import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { PageHero } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'System Status — GrowthDialer uptime',
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
                <div className="flex items-center gap-3 border-b border-zinc-950/[0.06] bg-emerald-500/[0.06] px-6 py-4">
                  <StatusDot status="operational" />
                  <p className="text-[14px] font-semibold text-zinc-950">
                    All systems operational
                  </p>
                </div>
                <ul className="divide-y divide-zinc-950/[0.06]">
                  {SERVICES.map((s) => (
                    <li key={s.name} className="flex items-start justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="text-[15px] font-medium text-zinc-950">{s.name}</p>
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
            <Reveal delay={80}>
              <div className="mt-8 text-center">
                <p className="pm-small">
                  Static snapshot — we update this page during incidents.
                </p>
                <Link
                  href="/contact-sales"
                  className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-violet-700 hover:underline"
                >
                  Report an issue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
