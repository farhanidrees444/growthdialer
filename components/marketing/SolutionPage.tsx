import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import {
  FinalCta,
  PageHero,
  PricingTeaser,
  SectionHead,
} from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export type SolutionPageData = {
  slug: string;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  pains: { title: string; body: string }[];
  capabilities: string[];
  outcome: string;
};

export function SolutionPage({ data }: { data: SolutionPageData }) {
  const url = `${MARKETING_SITE}/solutions/${data.slug}`;

  return (
    <div className="theme-marketing min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${data.eyebrow} — GrowthDialer`,
          description: data.description,
          url,
          isPartOf: { '@type': 'WebSite', name: 'GrowthDialer', url: MARKETING_SITE },
        }}
      />
      <main>
        <PageHero
          eyebrow={data.eyebrow}
          title={
            <>
              {data.title}
              <br />
              {data.titleAccent}
            </>
          }
          lede={data.description}
          cta={{ label: 'Start free trial', href: APP_SIGNUP }}
        />

        {/* Pains */}
        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Why it hurts"
              title="The problems this team actually has."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {data.pains.map((p, i) => (
                <Reveal key={p.title} delay={(i % 3) * 80}>
                  <article className="pm-card pm-card-hover h-full p-7">
                    <h2 className="pm-h-card">{p.title}</h2>
                    <p className="pm-body mt-3 !text-[14.5px]">{p.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Capabilities + outcome */}
        <div className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="pm-card p-8 sm:p-10">
                <p className="pm-eyebrow !mb-4">What you get on day one</p>
                <ul className="space-y-3">
                  {data.capabilities.map((c) => (
                    <li key={c} className="pm-tick">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="pm-body mt-8 border-t border-zinc-950/[0.07] pt-6 !text-[15px]">{data.outcome}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href="/pricing" className="pm-btn pm-btn-secondary">
                    See pricing
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <PricingTeaser />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
