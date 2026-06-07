import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'API Reference | GrowthDialer',
  description:
    'GrowthDialer REST API and webhooks for call events, leads, and workspace data. Authentication and endpoint overview.',
  alternates: { canonical: `${MARKETING_SITE}/docs/api` },
};

const ENDPOINTS = [
  { method: 'GET', path: '/api/leads', desc: 'List leads in the active workspace (auth required).' },
  { method: 'POST', path: '/api/leads', desc: 'Create a lead with phone, name, and custom fields.' },
  { method: 'GET', path: '/api/calls', desc: 'Call history with disposition, duration, and recording URL.' },
  { method: 'POST', path: '/api/calls/disposition', desc: 'Save disposition and advance power-dial queue.' },
  { method: 'POST', path: '/api/leads/import', desc: 'CSV import with column mapping.' },
];

export default function ApiReferencePage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="API Reference"
        title={
          <>
            Pipe call events
            <br />
            <span className="font-medium">into your stack.</span>
          </>
        }
        description="Workspace-scoped REST endpoints power the dashboard today. Webhook delivery for call.completed is on the roadmap — join the waitlist from Integrations."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
            <h2 className="font-display text-xl font-medium text-[#F5F5F7]">Authentication</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
              Browser sessions use secure workspace auth cookies. Server-to-server integrations should use a
              service token from your workspace settings (Enterprise) or contact us for early API access.
            </p>
          </article>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <h2 className="border-b border-white/[0.06] px-6 py-4 font-display text-lg font-medium text-[#F5F5F7]">
              Core endpoints
            </h2>
            <ul className="divide-y divide-white/[0.06]">
              {ENDPOINTS.map((e) => (
                <li key={e.path} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                      {e.method}
                    </span>
                    <code className="font-mono text-[13px] text-zinc-300">{e.path}</code>
                  </div>
                  <p className="mt-2 text-[14px] text-zinc-500">{e.desc}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 text-center text-[14px] text-zinc-500">
            Full OpenAPI spec ships with{' '}
            <Link href="/docs" className="text-[#A78BFA] hover:underline">
              Documentation
            </Link>
            . See also{' '}
            <Link href="/integrations" className="text-[#A78BFA] hover:underline">
              Integrations
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
