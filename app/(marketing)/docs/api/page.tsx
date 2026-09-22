import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'API Reference',
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
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="API Reference"
          title={
            <>
              Pipe call events
              <br />
              into your stack.
            </>
          }
          lede="Workspace-scoped REST endpoints power the dashboard today. Webhook delivery for call.completed is on the roadmap — join the waitlist from Integrations."
        />

        <div className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <article className="pm-card p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-700">
                    <Lock className="h-5 w-5" />
                  </span>
                  <h2 className="pm-h-card">Authentication</h2>
                </div>
                <p className="pm-body mt-4 !text-[14.5px]">
                  Browser sessions use secure workspace auth cookies. Server-to-server integrations
                  should use a service token from your workspace settings (Enterprise) or contact us
                  for early API access.
                </p>
              </article>
            </Reveal>

            <Reveal delay={80}>
              <div className="pm-card mt-4 overflow-hidden !p-0">
                <h2 className="pm-h-card border-b border-zinc-950/[0.06] px-7 py-5 !text-[1.15rem]">
                  Core endpoints
                </h2>
                <ul className="divide-y divide-zinc-950/[0.06]">
                  {ENDPOINTS.map((e) => (
                    <li key={e.path} className="px-7 py-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={cn(
                            'rounded-md px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide',
                            e.method === 'GET'
                              ? 'bg-emerald-500/12 text-emerald-700'
                              : 'bg-violet-600/10 text-violet-700'
                          )}
                        >
                          {e.method}
                        </span>
                        <code className="rounded-md bg-zinc-950/[0.04] px-2.5 py-1 font-mono text-[13px] text-zinc-800">
                          {e.path}
                        </code>
                      </div>
                      <p className="pm-body mt-2.5 !text-[14px]">{e.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <p className="pm-body mt-8 text-center">
                Full OpenAPI spec ships with{' '}
                <Link href="/docs" className="font-semibold text-violet-700 hover:underline">
                  Documentation
                </Link>
                . See also{' '}
                <Link
                  href="/integrations"
                  className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline"
                >
                  Integrations <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
