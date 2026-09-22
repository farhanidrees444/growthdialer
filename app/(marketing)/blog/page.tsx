import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, Clock } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { SectionHead } from '@/components/marketing/v2/Sections';
import { Reveal } from '@/components/ui/reveal';
import { Counter } from '@/components/marketing/v2/motion';
import { APP_SIGNUP } from '@/components/marketing/v2/copy';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Blog — Outbound Strategy & Dialer Mechanics',
  description:
    'Practical articles on AI power dialing, parallel dial strategy, CRM hygiene, and B2B outbound from the GrowthDialer team.',
  alternates: { canonical: `${MARKETING_SITE}/blog` },
  openGraph: {
    title: 'GrowthDialer Blog',
    description: 'Outbound sales strategy and dialer mechanics — written by practitioners.',
    url: `${MARKETING_SITE}/blog`,
  },
};

type Post = {
  slug: string;
  no: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  topic: string;
  topicBlurb: string;
};

const POSTS: Post[] = [
  {
    slug: 'best-ai-sales-dialer-2026',
    no: '01',
    title: '7 Best AI Sales Dialers in 2026: Honest Reviews',
    excerpt:
      'We evaluated the major AI dialers on what they ship today — dial modes, recording quality, CRM sync, and real workspace cost. No vendor benchmarks we can’t verify, no star ratings we didn’t earn.',
    date: 'April 9, 2026',
    readTime: '18 min read',
    topic: 'Buying guides',
    topicBlurb: 'How to choose a dialer without trusting vendor slides.',
  },
  {
    slug: 'how-parallel-dialing-works',
    no: '02',
    title: 'How Parallel Dialing Raises Connect Volume',
    excerpt:
      'Line math, AMD behavior, voicemail drop, and compliance — plus a worked example you can plug your own numbers into. Illustrative throughout; your list decides your real numbers.',
    date: 'April 9, 2026',
    readTime: '16 min read',
    topic: 'Dialer mechanics',
    topicBlurb: 'How the machine works, in plain language.',
  },
  {
    slug: 'replace-sdr-team-with-ai',
    no: '03',
    title: 'SDR Teams and AI: What Actually Ships Today',
    excerpt:
      'Where AI removes dial-and-log busywork versus where humans still own discovery and closing. Honest cost math using GrowthDialer Pro — no autonomous-agent hype.',
    date: 'April 9, 2026',
    readTime: '19 min read',
    topic: 'Outbound strategy',
    topicBlurb: 'Running a floor that humans and AI share.',
  },
];

const TOPICS = [
  {
    name: 'Dialer mechanics',
    blurb: 'Line counts, AMD, voicemail drop, compliance — how the machine works, in plain language.',
  },
  {
    name: 'Outbound strategy',
    blurb: 'List building, ramp plans, and running a floor that humans and AI share.',
  },
  {
    name: 'Buying guides',
    blurb: 'How to evaluate a dialer on what it ships today — not its marketing page.',
  },
];

const FACTS = [
  { value: '3', label: 'Dialing modes — manual, power, parallel' },
  { value: '8', label: 'Disposition outcomes built in' },
  { value: '5', label: 'Parallel lines per rep on Pro' },
  { value: '7-day', label: 'Free trial — no credit card' },
];

const [featured] = POSTS;

function PostMeta({ post, light = false }: { post: Post; light?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] ${
        light ? 'text-violet-200' : 'text-zinc-500'
      }`}
    >
      <span className="font-semibold text-violet-700">{post.topic}</span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {post.readTime}
      </span>
      <span>By the GrowthDialer team</span>
      <span>{post.date}</span>
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        {/* ── Editorial masthead ─────────────────────────────── */}
        <header className="pm-container pt-36 sm:pt-44">
          <div className="border-t-2 border-zinc-950 pt-6">
              <Reveal delay={0}>
                <p className="pm-eyebrow">The Outbound Journal</p>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="pm-h-display mt-5 max-w-3xl">
                  Notes from the sales floor.
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="pm-lead mt-6 max-w-2xl">
                  Long-form essays on dialer mechanics, outbound strategy, and what we&apos;re
                  shipping — written by the team that builds the dialer, labeled honestly
                  throughout.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">By the GrowthDialer team</span>
                  <span aria-hidden className="text-zinc-300">·</span>
                  <span>{POSTS.length} essays</span>
                  <span aria-hidden className="text-zinc-300">·</span>
                  <span>No fake authors, no borrowed testimonials</span>
                </div>
              </Reveal>
            </div>
        </header>

        {/* ── Featured essay ─────────────────────────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container">
            <Reveal>
              <Link
                href={`/blog/${featured.slug}`}
                className="group relative block overflow-hidden rounded-3xl border border-zinc-950/[0.08] bg-zinc-950 p-8 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_-24px_rgba(109,40,217,0.45)] sm:p-12 lg:p-16"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl"
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-violet-200">
                      Featured essay · № {featured.no}
                    </span>
                    <ArrowUpRight className="h-6 w-6 text-violet-300 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                  <h2 className="mt-8 max-w-3xl font-display text-[clamp(1.9rem,4.5vw,3.4rem)] font-semibold leading-[1.08] tracking-tight">
                    {featured.title}
                  </h2>
                  <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-zinc-300">
                    {featured.excerpt}
                  </p>
                  <div className="mt-8">
                    <PostMeta post={featured} light />
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-violet-300">
                    Read the essay
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── Topic rails ────────────────────────────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Topics"
              title="Browse by what you’re trying to learn."
              align="left"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {TOPICS.map((topic, ti) => {
                const topicPosts = POSTS.filter((p) => p.topic === topic.name);
                return (
                  <Reveal key={topic.name} delay={ti * 80}>
                    <div className="pm-card flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                      <p className="font-display text-[1.05rem] font-semibold tracking-tight text-zinc-950">
                        {topic.name}
                      </p>
                      <p className="pm-small mt-2 flex-1">{topic.blurb}</p>
                      <div className="mt-6 space-y-4 border-t border-zinc-950/[0.06] pt-5">
                        {topicPosts.map((post) => (
                          <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group block"
                          >
                            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                              Essay № {post.no} · {post.readTime}
                            </p>
                            <p className="mt-1.5 text-[15px] font-semibold leading-snug text-zinc-950 group-hover:text-violet-700">
                              {post.title}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── The rest of the archive ────────────────────────── */}
        <section className="pm-section-tight pm-divider bg-zinc-50/60">
          <div className="pm-container">
            <SectionHead eyebrow="The archive" title="Every essay, newest first." align="left" />
            <div className="divide-y divide-zinc-950/[0.07] border-y border-zinc-950/[0.07]">
              {POSTS.map((post, i) => (
                <Reveal key={post.slug} delay={i * 60}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid gap-3 py-7 sm:grid-cols-[72px_1fr_auto] sm:items-baseline sm:gap-6"
                  >
                    <span className="font-display text-[13px] font-semibold tracking-[0.18em] text-zinc-400">
                      № {post.no}
                    </span>
                    <span>
                      <span className="block text-[1.25rem] font-semibold leading-snug tracking-tight text-zinc-950 group-hover:text-violet-700">
                        {post.title}
                      </span>
                      <span className="mt-2 block max-w-2xl text-[14.5px] leading-relaxed text-zinc-600">
                        {post.excerpt}
                      </span>
                      <span className="mt-3 block">
                        <PostMeta post={post} />
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-700 sm:justify-self-end">
                      Read
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Verified facts band ────────────────────────────── */}
        <section className="pm-section-tight">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="rounded-3xl border border-zinc-950/[0.08] bg-white p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <p className="pm-eyebrow pm-eyebrow-centered">The facts we build on</p>
                <div className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
                  {FACTS.map((f, fi) => {
                    const m = f.value.match(/^(\d+)(.*)$/);
                    return (
                      <Reveal key={f.label} delay={fi * 80}>
                        <div className="text-center">
                          <p className="font-display text-[2rem] font-semibold tracking-tight text-violet-700">
                            {m ? (
                              <Counter to={Number(m[1])} suffix={m[2]} />
                            ) : (
                              f.value
                            )}
                          </p>
                          <p className="pm-small mt-1.5">{f.label}</p>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
                <p className="pm-caption mt-8 text-center">
                  Shipped and verifiable in the product today — not marketing projections.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Page-specific CTA ──────────────────────────────── */}
        <section className="pm-section-tight pm-divider">
          <div className="pm-container-narrow">
            <Reveal>
              <div className="overflow-hidden rounded-3xl bg-zinc-950 p-8 text-center text-white sm:p-12">
                <p className="pm-eyebrow !text-violet-300 pm-eyebrow-centered">
                  From reading to dialing
                </p>
                <h2 className="mx-auto mt-4 max-w-xl font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold leading-[1.12] tracking-tight">
                  Read the journal. Then run your own floor.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-300">
                  Every essay here was written about the dialer we ship. Start free, import a
                  list, and test the mechanics on your own calls — 7 days, no credit card.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={APP_SIGNUP}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-violet-500"
                  >
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                  >
                    See the product tour
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
