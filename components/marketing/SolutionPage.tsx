import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { EarlyAccess } from '@/components/marketing/home/EarlyAccess';
import { JsonLd } from '@/components/marketing/live-floor/JsonLd';
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
              <span className="font-medium">{data.titleAccent}</span>
            </>
          ) : (
            data.title
          )
        }
        description={data.description}
      >
        <a
          href={APP_SIGNUP}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
        >
          Start free <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/features"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"
        >
          See features
        </Link>
      </MarketingPageHero>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {data.pains.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
            >
              <h2 className="font-display text-lg font-medium text-[#F5F5F7]">{p.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-xl">
          <h2 className="font-display text-2xl font-light text-white">What you get on day one</h2>
          <ul className="mt-6 space-y-3">
            {data.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-[15px] text-zinc-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[15px] leading-relaxed text-zinc-500">{data.outcome}</p>
        </div>
      </section>

      <EarlyAccess />
    </MarketingShell>
  );
}
