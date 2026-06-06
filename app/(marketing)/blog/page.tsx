import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Blog — Sales dialer tips & outbound strategy | GrowthDialer',
  description:
    'Practical articles on AI power dialing, parallel dial strategy, CRM hygiene, and B2B outbound from the GrowthDialer team.',
  alternates: { canonical: `${MARKETING_SITE}/blog` },
  openGraph: {
    title: 'GrowthDialer Blog',
    description: 'Outbound sales strategy and dialer mechanics — written by practitioners.',
    url: `${MARKETING_SITE}/blog`,
  },
};

const posts = [
  {
    slug: 'best-ai-sales-dialer-2026',
    title: '7 Best AI Sales Dialers in 2026: Honest Reviews',
    date: 'April 9, 2026',
    excerpt:
      'We tested major AI dialers on connect rate, recording quality, CRM sync, and real per-seat cost — not marketing claims.',
    category: 'Reviews',
    readTime: '18 min',
  },
  {
    slug: 'how-parallel-dialing-works',
    title: 'How Parallel Dialing Raises Connect Rates',
    date: 'April 9, 2026',
    excerpt:
      'Line counts, AMD behavior, and when parallel beats single-line power dial for B2B outbound teams.',
    category: 'Strategy',
    readTime: '16 min',
  },
  {
    slug: 'replace-sdr-team-with-ai',
    title: 'SDR Teams and AI: What Actually Ships Today',
    date: 'April 9, 2026',
    excerpt:
      'Where AI removes dial-and-log busywork versus where humans still own discovery and closing.',
    category: 'Guide',
    readTime: '19 min',
  },
];

export default function BlogPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Blog"
        title={
          <>
            Outbound notes
            <br />
            <span className="font-medium">from the floor.</span>
          </>
        }
        description="Dialer mechanics, CRM hygiene, and AI workflows — short on hype, specific on what we ship in production."
      />

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                  {post.category}
                </span>
                <span className="text-[11px] text-zinc-600">{post.readTime}</span>
              </div>
              <h2 className="mt-4 font-display text-lg font-medium text-[#F5F5F7] group-hover:text-[#A78BFA]">
                {post.title}
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-zinc-500">{post.excerpt}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[11px] text-zinc-600">
                <span>GrowthDialer team</span>
                <span>{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
