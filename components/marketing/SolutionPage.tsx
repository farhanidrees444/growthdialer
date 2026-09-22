import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

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
    <MarketingShell>
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
      <MarketingPageHero
        eyebrow={data.eyebrow}
        title={
          data.titleAccent ? (
            <>
              {data.title}
              <br />
              <span className="font-semibold">{data.titleAccent}</span>
            </>
          ) : (
            data.title
          )
        }
        description={data.description}
      >
        <a href={APP_SIGNUP} className="mk-btn mk-btn-primary">
          Start free <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/features" className="mk-btn mk-btn-secondary">
          See features
        </Link>
      </MarketingPageHero>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {data.pains.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 70}>
              <article className="mk-card mk-card-hover h-full p-6">
                <h2 className="font-display text-lg font-semibold text-zinc-950">{p.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <Reveal className="mx-auto max-w-3xl">
          <div className="mk-card p-8">
            <h2 className="mk-h-section !text-[1.75rem]">What you get on day one</h2>
            <ul className="mt-6 space-y-3">
              {data.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-[15px] text-zinc-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[15px] leading-relaxed text-zinc-600">{data.outcome}</p>
          </div>
        </Reveal>
      </section>

      <EarlyAccess />
    </MarketingShell>
  );
}
