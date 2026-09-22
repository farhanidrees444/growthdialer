import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft, Share2, Link2 } from "lucide-react";
import { BlogHonestyBanner } from "@/components/marketing/BlogHonestyBanner";
import {
  ArticleCtaEssay,
  ArticleHeader,
  ArticleJsonLd,
  ArticleShell,
  AuthorCard,
  KeyTakeaways,
  PullQuote,
  RelatedPosts,
  Toc,
} from "../article-shell";

interface BlogPost {
  title: string;
  body: string;
  date: string;
  category: string;
  readTime: string;
  excerpt: string;
  keyTakeaways?: string[];
  toc?: Array<{ id: string; text: string; level: number }>;
  relatedPosts?: Array<{ slug: string; title: string; excerpt: string }>;
}

/**
 * Long-form essays live as static pages under /blog (they predate this
 * template and carry the full editorial layout). This record stays empty
 * until a new essay is written directly for the template — we do not keep
 * stale or placeholder posts here.
 */
const posts: Record<string, BlogPost> = {};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = posts[params.slug];
  if (!post) return {};

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt,
    keywords: `${post.category.toLowerCase()}, sales dialer, b2b sales, ${post.title.toLowerCase()}`,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: ["GrowthDialer team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    other: {
      "article:author": "GrowthDialer team",
      "article:published_time": new Date(post.date).toISOString(),
      "article:section": post.category,
    },
  };
}

/** Lightweight markdown-ish renderer — kit-styled article typography. */
function formatInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>');
}

function renderBody(body: string): { html: string; pullQuotes: string[] } {
  const lines = body.split("\n");
  const out: string[] = [];
  const pullQuotes: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const line of lines) {
    if (line.startsWith("> ")) {
      // Pull quote — collected and rendered as a styled blockquote component
      closeList();
      pullQuotes.push(formatInline(line.replace("> ", "")));
      out.push(`<!--pullquote:${pullQuotes.length - 1}-->`);
    } else if (line.startsWith("## ")) {
      closeList();
      const text = line.replace("## ", "");
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      out.push(
        `<h2 id="${id}" class="pm-h-group mt-14 scroll-mt-28 !text-[1.55rem]">${text}</h2>`
      );
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push('<ul class="mt-5 space-y-2.5">');
        inList = true;
      }
      out.push(
        `<li class="flex items-start gap-2.5 text-[15px] leading-relaxed text-zinc-600"><span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600"></span><span>${formatInline(line.replace("- ", ""))}</span></li>`
      );
    } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      closeList();
      out.push(
        `<p class="mt-8 text-[16.5px] font-bold text-zinc-950">${formatInline(line.replace(/\*\*/g, ""))}</p>`
      );
    } else if (line.startsWith("**")) {
      closeList();
      out.push(`<p class="mt-6 text-[16px] font-semibold text-zinc-900">${formatInline(line)}</p>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      out.push(`<p class="mt-5 text-[16.5px] leading-[1.85] text-zinc-700">${formatInline(line)}</p>`);
    }
  }
  closeList();
  return { html: out.join(""), pullQuotes };
}

/** Splits rendered html on pull-quote markers into content blocks. */
function renderArticle(body: string) {
  const { html, pullQuotes } = renderBody(body);
  const parts = html.split(/<!--pullquote:(\d+)-->/g);
  const blocks: Array<{ type: "html"; html: string } | { type: "quote"; text: string }> = [];
  for (let i = 0; i < parts.length; i += 1) {
    if (i % 2 === 0) {
      if (parts[i]) blocks.push({ type: "html", html: parts[i] });
    } else {
      const q = pullQuotes[Number(parts[i])];
      if (q) blocks.push({ type: "quote", text: q });
    }
  }
  return blocks;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  const shareUrl = `https://growthdialer.com/blog/${params.slug}`;
  const wordCount = post.body.split(/\s+/).length;
  const tocItems = (post.toc ?? []).map((t) => ({ id: t.id, title: t.text }));
  const blocks = renderArticle(post.body);

  return (
    <ArticleShell>
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        slug={params.slug}
        datePublished={new Date(post.date).toISOString()}
      />
      <ArticleHeader
        category={post.category}
        title={post.title}
        lede={post.excerpt}
        date={post.date}
        readTime={post.readTime}
        wordCount={wordCount}
        crumb={post.title}
      />

      <div className="pm-container-narrow pb-24">
        <div className="mt-10">
          <BlogHonestyBanner />
        </div>

        {post.keyTakeaways && post.keyTakeaways.length > 0 && (
          <KeyTakeaways items={post.keyTakeaways} />
        )}

        {/* Mobile / tablet TOC — stacked above the essay */}
        {tocItems.length > 0 && (
          <div className="lg:hidden">
            <Toc items={tocItems} />
          </div>
        )}

        {/* Desktop: essay + sticky TOC rail */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-12">
          <div className="min-w-0">
            {blocks.map((block, i) =>
              block.type === "quote" ? (
                <PullQuote key={i}>
                  <span dangerouslySetInnerHTML={{ __html: block.text }} />
                </PullQuote>
              ) : (
                <div key={i} dangerouslySetInnerHTML={{ __html: block.html }} />
              )
            )}

            {/* Share */}
            <div className="mt-12 flex items-center gap-3 border-t border-zinc-950/[0.08] pt-8">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-500">
                <Share2 className="h-4 w-4" /> Share
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pm-chip hover:border-violet-600/40 hover:text-violet-700"
              >
                X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pm-chip hover:border-violet-600/40 hover:text-violet-700"
              >
                Facebook
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pm-chip hover:border-violet-600/40 hover:text-violet-700"
              >
                LinkedIn
              </a>
              <a
                href={shareUrl}
                className="pm-chip inline-flex items-center gap-1.5 hover:border-violet-600/40 hover:text-violet-700"
              >
                <Link2 className="h-3.5 w-3.5" /> Copy link
              </a>
            </div>

            <AuthorCard />

            {post.relatedPosts && <RelatedPosts posts={post.relatedPosts} />}

            <ArticleCtaEssay title={post.title} />

            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-violet-700 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back to the journal
              </Link>
            </div>
          </div>

          {/* Sticky TOC rail — desktop only */}
          {tocItems.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <nav aria-label="Table of contents" className="rounded-2xl border border-zinc-950/[0.08] bg-zinc-50/60 p-6">
                  <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    On this page
                  </h2>
                  <ul className="mt-4 space-y-1">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block rounded-lg px-2 py-1.5 text-[13.5px] leading-snug text-zinc-600 transition-colors hover:bg-white hover:text-violet-700"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </ArticleShell>
  );
}
