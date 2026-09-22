/**
 * Shared article building blocks for the GrowthDialer blog.
 * Used by the blog index cards, the [slug] template, and the three static post pages.
 */
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { Reveal } from '@/components/ui/reveal';
import { Counter, GlowCard, ScrollProgress } from '@/components/marketing/v2/motion';
import { BlogHonestyBanner } from '@/components/marketing/BlogHonestyBanner';
import { AUTHOR_BIO, BLOG_CTA } from '@/lib/marketing/honest-copy';
import { APP_SIGNUP } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

/* ── Article typography tokens ────────────────────────── */
export const artH2 = 'pm-h-group mt-14 scroll-mt-28 !text-[1.55rem]';
export const artH3 = 'mt-10 font-display text-[1.2rem] font-semibold tracking-tight text-zinc-950';
export const artP = 'pm-body mt-5';
export const artList = 'mt-5 space-y-3';

/* ── Page chrome ──────────────────────────────────────── */
export function ArticleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <ScrollProgress />
        {children}
      </main>
      <Footer />
    </div>
  );
}

/* ── Article header ───────────────────────────────────── */
export function ArticleHeader({
  category,
  title,
  lede,
  date,
  readTime,
  wordCount,
  crumb,
}: {
  category: string;
  title: React.ReactNode;
  lede: string;
  date: string;
  readTime: string;
  wordCount: number;
  crumb: string;
}) {
  return (
    <header className="pm-container-narrow pb-4 pt-36 sm:pt-44">
      <Reveal delay={0}>
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-[13px] text-zinc-500">
          <Link href="/" className="hover:text-violet-700">
            Home
          </Link>
          <span aria-hidden className="text-zinc-300">/</span>
          <Link href="/blog" className="hover:text-violet-700">
            Blog
          </Link>
          <span aria-hidden className="text-zinc-300">/</span>
          <span className="truncate text-zinc-700">{crumb}</span>
        </nav>
        <span className="pm-chip">{category}</span>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="pm-h-display mt-6 !text-[clamp(2rem,4.5vw,3.25rem)]">{title}</h1>
      </Reveal>
      <Reveal delay={160}>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {readTime}
          </span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>{date}</span>
        </div>
      </Reveal>
      <Reveal delay={240}>
        <p className="pm-lead mt-7 max-w-2xl !text-[1.15rem]">{lede}</p>
      </Reveal>
    </header>
  );
}

/* ── Stats strip ──────────────────────────────────────── */
export function ArticleStats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="pm-card mt-10 grid grid-cols-1 gap-6 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:grid-cols-3">
      {items.map((s, si) => {
        const m = s.value.match(/^(\d+)(.*)$/);
        return (
          <Reveal key={s.label} delay={60 + si * 80} className="sm:border-l sm:border-zinc-950/[0.06] sm:pl-6 sm:first:border-0 sm:first:pl-0">
            <p className="pm-stat-num !text-[1.9rem]">
              {m ? <Counter to={Number(m[1])} suffix={m[2]} /> : s.value}
            </p>
            <p className="pm-small mt-1.5">{s.label}</p>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ── Key takeaways ────────────────────────────────────── */
export function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <Reveal>
      <div className="mt-10 rounded-2xl border border-violet-600/20 bg-violet-600/[0.04] p-7 sm:p-8">
        <h2 className="font-display text-[1.15rem] font-semibold tracking-tight text-violet-800">
          Key takeaways
        </h2>
        <ul className="mt-5 space-y-3.5">
          {items.map((item, i) => (
            <Reveal key={i} as="li" delay={i * 60}>
              <span className="flex items-start gap-3 text-[14.5px] leading-relaxed text-zinc-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/* ── Table of contents ────────────────────────────────── */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  return (
    <Reveal>
      <nav aria-label="Table of contents" className="pm-card mt-10 p-7">
        <h2 className="font-display text-[1.1rem] font-semibold tracking-tight text-zinc-950">
          On this page
        </h2>
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-violet-700"
              >
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-700" />
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </Reveal>
  );
}

/* ── Callouts (pro tip / warning) ─────────────────────── */
export function Callout({
  tone = 'violet',
  title,
  children,
}: {
  tone?: 'violet' | 'amber';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mt-8 rounded-2xl border p-6 sm:p-7',
        tone === 'violet'
          ? 'border-violet-600/20 bg-violet-600/[0.04]'
          : 'border-amber-500/25 bg-amber-500/[0.06]'
      )}
    >
      <h3
        className={cn(
          'text-[15px] font-bold',
          tone === 'violet' ? 'text-violet-800' : 'text-amber-700'
        )}
      >
        {title}
      </h3>
      <div
        className={cn(
          'mt-2 text-[14.5px] leading-relaxed',
          tone === 'violet' ? 'text-zinc-700' : 'text-zinc-700'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Static FAQ block ─────────────────────────────────── */
export function FaqStatic({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mt-6 space-y-3">
      {items.map((item, i) => (
        <Reveal key={item.q} delay={i * 60}>
          <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-[16px] font-semibold text-zinc-950">{item.q}</h3>
            <p className="pm-body mt-2 !text-[14.5px]">{item.a}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── Author card ──────────────────────────────────────── */
export function AuthorCard() {
  return (
    <Reveal>
      <div className="pm-card mt-14 flex flex-col gap-5 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600/10 font-display text-xl font-bold text-violet-700">
          G
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-zinc-950">Written by the GrowthDialer team</h3>
          <p className="pm-body mt-2 !text-[14px]">{AUTHOR_BIO}</p>
          <Link href="/about" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-violet-700 hover:underline">
            Learn more about our team <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Related posts ────────────────────────────────────── */
export function RelatedPosts({ posts }: { posts: { slug: string; title: string; excerpt: string }[] }) {
  return (
    <div className="mt-14">
      <h2 className="pm-h-group !text-[1.35rem]">Related articles</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {posts.map((p, pi) => (
          <Reveal key={p.slug} delay={pi * 80}>
            <Link
              href={`/blog/${p.slug}`}
              className="pm-card pm-card-hover group block h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <h3 className="text-[15.5px] font-semibold leading-snug text-zinc-950">
                {p.title}
              </h3>
              <p className="pm-small mt-2">{p.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-violet-700">
                Read more
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ── Article-end CTA ──────────────────────────────────── */
export function ArticleCta() {
  return (
    <Reveal>
      <GlowCard>
        <div className="pm-card mt-14 overflow-hidden p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-10">
          <h2 className="pm-h-group !text-[1.6rem]">Put it to work on your floor.</h2>
          <p className="pm-body mx-auto mt-3 max-w-xl">{BLOG_CTA}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
              Start free trial <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/pricing" className="pm-btn pm-btn-secondary">
              View pricing
            </Link>
          </div>
          <p className="pm-small mt-5">7-day free trial · No credit card · Cancel anytime</p>
        </div>
      </GlowCard>
    </Reveal>
  );
}

/* ── Essay-end CTA (ties the read back to the product) ─── */
export function ArticleCtaEssay({ title }: { title: string }) {
  return (
    <Reveal>
      <GlowCard>
        <div className="mt-14 overflow-hidden rounded-3xl border border-violet-600/20 bg-gradient-to-br from-violet-600/[0.07] via-white to-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-12">
          <p className="pm-eyebrow pm-eyebrow-centered">From the journal, to the floor</p>
          <h2 className="pm-h-group mx-auto mt-4 max-w-xl !text-[1.7rem]">
            Try the dialer this essay is about.
          </h2>
          <p className="pm-body mx-auto mt-4 max-w-xl">
            &ldquo;{title}&rdquo; was written about the product we ship — not a hypothetical one.
            Run it on your own list for 7 days and judge it on your own calls.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={APP_SIGNUP} className="pm-btn pm-btn-primary">
              Start free trial <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/demo" className="pm-btn pm-btn-secondary">
              See the product tour
            </Link>
          </div>
          <p className="pm-small mt-5">7-day free trial · No credit card · Cancel anytime</p>
        </div>
      </GlowCard>
    </Reveal>
  );
}

/* ── Pull quote ───────────────────────────────────────── */
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <blockquote className="my-12 border-l-[3px] border-violet-600 pl-6 sm:pl-8">
        <p className="font-display text-[1.45rem] font-medium leading-[1.4] tracking-tight text-zinc-950">
          {children}
        </p>
      </blockquote>
    </Reveal>
  );
}

/* ── Honesty banner re-export ─────────────────────────── */
export function Honesty() {
  return (
    <div className="mt-10">
      <BlogHonestyBanner />
    </div>
  );
}

/* ── Article JSON-LD ──────────────────────────────────── */
export function ArticleJsonLd({
  title,
  description,
  slug,
  datePublished,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
}) {
  const shareUrl = `https://growthdialer.com/blog/${slug}`;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          author: { '@type': 'Organization', name: 'GrowthDialer team', url: 'https://growthdialer.com' },
          publisher: {
            '@type': 'Organization',
            name: 'GrowthDialer',
            logo: { '@type': 'ImageObject', url: 'https://growthdialer.com/logo.png' },
          },
          datePublished,
          dateModified: datePublished,
          mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
        }),
      }}
    />
  );
}
