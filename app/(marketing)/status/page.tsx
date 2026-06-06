import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

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
  const color =
    status === 'operational'
      ? 'bg-emerald-500'
      : status === 'degraded'
        ? 'bg-amber-500'
        : 'bg-red-500';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />;
}

export default function StatusPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GrowthDialer System Status',
          url: `${MARKETING_SITE}/status`,
        }}
      />
      <MarketingPageHero
        eyebrow="Status"
        title={
          <>
            All systems
            <br />
            <span className="font-medium">operational.</span>
          </>
        }
        description="High-level health for GrowthDialer product surfaces. We post updates here when customers may be affected."
      />

      <section className="mx-auto max-w-2xl px-5 pb-12 lg:px-8">
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          {SERVICES.map((s) => (
            <li key={s.name} className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[15px] font-medium text-[#F5F5F7]">{s.name}</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">{s.note}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                <StatusDot status={s.status} />
                <span className="text-[12px] capitalize text-emerald-400">{s.status}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="flex items-center gap-2 text-[13px] text-zinc-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Last checked: page load
          </p>
          <Link href="/contact-sales" className="text-[13px] font-medium text-[#A78BFA] hover:underline">
            Report an issue → contact support
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
