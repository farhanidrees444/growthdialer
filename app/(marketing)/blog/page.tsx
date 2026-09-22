import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Clock } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Blog — Outbound Strategy & Dialer Mechanics | GrowthDialer',
  description:
    'Practical articles on AI power dialing, parallel dial strategy, CRM hygiene, and B2B outbound from the GrowthDialer team.',
  alternates: { canonical: `${MARKETING_SITE}/blog` },
  openGraph: {
    title: 'GrowthDialer Blog',
    description: 'Outbound sales strategy and dialer mechanics — written by practitioners.',
    url: `${MARKETING_SITE}/blog`,
  },
};

const POSTS = [
  {
    slug: 'best-ai-sales-dialer-2026',
    title: '7 Best AI Sales Dialers in 2026: Honest Reviews',
    date: 'April 9, 2026',
    excerpt:
      'We evaluated major AI dialers on connect rate, recording quality, CRM sync, and real per-seat cost — not marketing claims.',
    category: 'Reviews',
    readTime: '18 min read',
  },
  {
    slug: 'how-parallel-dialing-works',
    title: 'How Parallel Dialing Raises Connect Rates',
    date: 'April 9, 2026',
    excerpt:
      'Line counts, AMD behavior, and when parallel beats single-line power dial for B2B outbound teams.',
    category: 'Strategy',
    readTime: '16 min read',
  },
  {
    slug: 'replace-sdr-team-with-ai',
    title: 'SDR Teams and AI: What Actually Ships Today',
    date: 'April 9, 2026',
    excerpt:
      'Where AI removes dial-and-log busywork versus where humans still own discovery and closing.',
    category: 'Guide',
    readTime: '19 min read',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Blog"
          title={
            <>
              Outbound notes
              <br />
              from the floor.
            </>
          }
          lede="Dialer mechanics, CRM hygiene, and AI workflows — short on hype, specific on what we ship in production."
        />

        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Latest"
              title="Start with these."
              align="left"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {POSTS.map((post, i) => (
                <Reveal key={post.slug} delay={i * 80}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="pm-card pm-card-hover group flex h-full flex-col p-7"
                  >
                    <div className="flex items-center justify-between">
                      <span className="pm-chip">{post.category}</span>
                      <span className="pm-caption inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="pm-h-card mt-5">{post.title}</h2>
                    <p className="pm-body mt-3 flex-1 !text-[14.5px]">{post.excerpt}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-zinc-950/[0.06] pt-4">
                      <span className="pm-caption">GrowthDialer team · {post.date}</span>
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-violet-700">
                        Read
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
