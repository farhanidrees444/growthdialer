import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft, Share2, Link2 } from "lucide-react";
import { GROWTHDIALER_PRICING } from "@/lib/marketing/honest-copy";
import { BlogHonestyBanner } from "@/components/marketing/BlogHonestyBanner";
import {
  ArticleCta,
  ArticleHeader,
  ArticleJsonLd,
  ArticleShell,
  AuthorCard,
  RelatedPosts,
  Toc,
} from "../article-shell";

interface BlogPost {
  title: string;
  body: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  excerpt: string;
  toc?: Array<{ id: string; text: string; level: number }>;
  relatedPosts?: Array<{ slug: string; title: string; excerpt: string }>;
}

const posts: Record<string, BlogPost> = {
  "best-b2b-sales-dialer-2026": {
    title: "10 Best B2B Sales Dialer Software in 2026 (Honest Review)",
    body: `We evaluate B2B sales dialers on what they ship today — dial modes, recording, AI summaries, CRM sync, and transparent pricing — not marketing superlatives.

Our testing focused on call quality, feature completeness, and time-to-first-call. We label live integrations vs roadmap items for every vendor.

## 1. GrowthDialer — Best for AI-assisted outbound (human reps)

**Pricing:** ${GROWTHDIALER_PRICING.starter} · Pro ${GROWTHDIALER_PRICING.proMonthly} (${GROWTHDIALER_PRICING.proAnnual})

GrowthDialer is a revenue dialer where humans talk and AI handles the paperwork. Unlike hype-heavy listings, we do not claim autonomous voice agents in production.

**Ships today:**
- AI Dialer focus stages (Browse · Preview · Live)
- Power + parallel dial (up to 10 lines on Pro)
- Recording, transcription, AI summaries & sentiment
- Live coaching floor + HubSpot sync

**Pros:**
- Free Starter tier to validate before you pay
- Workspace pricing — not opaque enterprise quotes
- Honest roadmap labels for CRMs beyond HubSpot

**Cons:**
- Autonomous AI voice agent is roadmap, not live
- Smaller vendor than Orum/Nooks for enterprise references

**Best For:** Outbound teams that want Smartlead-class UX with conversation intelligence on every call.

## 2. Orum — Established Player with Strong AI

**Rating: 8.7/10 · pricing varies by plan — confirm directly**

Orum has been in the sales dialer space for years and offers solid AI-powered calling with good integration options.

**Key Features:**
- AI voice calling with natural conversation
- CRM integrations (Salesforce, HubSpot)
- Call recording and analytics
- Local presence and compliance

**Pros:**
- Proven track record
- Good CRM integrations
- Reliable call quality

**Cons:**
- No autonomous agent capabilities
- Limited language support
- Higher pricing

## 3. Nooks — User-Friendly Interface

**Rating: 8.5/10 · pricing varies by plan — confirm directly**

Nooks focuses on ease of use with a clean interface and good basic features.

**Key Features:**
- Simple parallel dialing
- Basic AI call coaching
- Team management tools
- Good reporting

**Pros:**
- Easy to set up and use
- Good for small teams
- Affordable

**Cons:**
- Limited advanced features
- Basic AI capabilities
- No omnichannel outreach

## 4. PhoneBurner — Traditional Power Dialer

**Rating: 8.2/10 · pricing varies by plan — confirm directly**

PhoneBurner is a traditional power dialer that's been around for years, offering reliable basic functionality.

**Key Features:**
- High-speed parallel dialing
- Call recording
- Basic CRM integration
- Local presence

**Pros:**
- Reliable performance
- Good for high-volume calling
- Established platform

**Cons:**
- Outdated interface
- Limited AI features
- No advanced automation

## 5. Kixie — Good for Small Teams

**Rating: 7.9/10 · pricing varies by plan — confirm directly**

Kixie offers a good balance of features for small to medium sales teams.

**Key Features:**
- Power dialing
- Call recording
- Basic CRM sync
- Team collaboration

**Pros:**
- Affordable pricing
- Good for small teams
- Reliable basic features

**Cons:**
- Limited scalability
- Basic AI features
- No advanced automation

## Methodology

We evaluated each dialer based on:
- **Call Quality:** Connection rates, audio quality, compliance
- **Features:** AI capabilities, integrations, automation
- **Ease of Use:** Setup time, learning curve, user interface
- **Support:** Documentation, customer service, training
- **Pricing:** Value for money, scalability
- **ROI:** Actual results from user testimonials and case studies

## Choosing the Right Sales Dialer

Consider your team size, budget, and goals:

- **Small Teams (1-5 reps):** Kixie or Nooks
- **Growing Teams (5-20 reps):** GrowthDialer or Orum
- **Large Teams (20+ reps):** GrowthDialer Enterprise or PhoneBurner

## The Future of Sales Dialing

AI-powered conversation intelligence is changing how outbound teams work. The winners will be platforms that remove busywork around the call — transcripts, summaries, logging — so humans spend their hours in real conversations.

GrowthDialer follows this approach: humans talk, AI handles the paperwork. Autonomous voice agents are on our roadmap, labeled as such — we evaluate competitors by the same standard.`,
    date: "April 9, 2026",
    author: "GrowthDialer Team",
    category: "Reviews",
    readTime: "8 min read",
    excerpt: "Comprehensive review of the top B2B sales dialers in 2026. We tested 50+ tools to find the best AI-powered dialers for modern sales teams.",
    toc: [
      { id: "growthdialer", text: "1. GrowthDialer — Best Overall", level: 2 },
      { id: "orum", text: "2. Orum — Established Player", level: 2 },
      { id: "nooks", text: "3. Nooks — User-Friendly", level: 2 },
      { id: "phoneburner", text: "4. PhoneBurner — Traditional", level: 2 },
      { id: "kixie", text: "5. Kixie — Small Teams", level: 2 },
      { id: "methodology", text: "Methodology", level: 2 },
      { id: "choosing", text: "Choosing the Right Dialer", level: 2 },
      { id: "future", text: "The Future of Sales Dialing", level: 2 },
    ],
    relatedPosts: [
      {
        slug: "parallel-dialing-guide",
        title: "Parallel Dialing Without Burning Your Team Out",
        excerpt: "Master parallel dialing strategies that boost productivity without sacrificing rep wellbeing.",
      },
      {
        slug: "ai-coaching",
        title: "What Good AI Call Coaching Looks Like",
        excerpt: "Real-time AI coaching that actually helps reps improve their performance.",
      },
    ],
  },
  "parallel-dialing-guide": {
    title: "Parallel Dialing Without Burning Your Team Out",
    body: `Start with clear dispositions, cap parallel lines while reps ramp, and review connect rates daily. GrowthDialer is built to keep reps in flow — tune line count and voicemail drop rules to match your market.

## Set the pace before you scale

The biggest mistake with parallel dialing is starting at maximum lines on day one. Reps need time to adjust to the rhythm: answer, connect, disposition, repeat.

## Dispositions keep the machine honest

Clear dispositions — connect, no answer, voicemail, bad number, DNC — turn a blur of calls into data you can coach on. Without them, parallel dialing is just noise at higher volume.

## Watch the human cost

Parallel dialing multiplies attempts, but it also multiplies rejection. Build in breaks, rotate lists, and watch connect quality — not just connect count.`,
    date: "April 2, 2026",
    author: "Sarah Chen",
    category: "Strategy",
    readTime: "5 min read",
    excerpt: "Master parallel dialing strategies that boost productivity without sacrificing rep wellbeing.",
  },
  "ai-coaching": {
    title: "What Good AI Call Coaching Looks Like on Live Calls",
    body: `The best coaching is timely and specific: objection labels, talk ratios, and next-step suggestions. Use AI as a copilot, not a script — your reps stay authentic while staying on message.

## Listen mode first

Before real-time suggestions, start with listen mode: managers monitor live calls and leave structured feedback after hang-up. It's the lowest-risk way to add coaching to the floor.

## Specific beats generic

"Talk less" is useless feedback. "You spoke 74% of the call — let the prospect finish their objection before responding" is coaching. AI summaries give managers the specifics to coach from.

## Keep the rep in control

AI suggestions work best as ambient context, not commands. The rep should feel like they have a cheat sheet, not an autopilot.`,
    date: "March 18, 2026",
    author: "Mike Rodriguez",
    category: "AI",
    readTime: "6 min read",
    excerpt: "Real-time AI coaching that actually helps reps improve their performance.",
  },
};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = posts[params.slug];
  if (!post) return {};

  return {
    title: `${post.title} | GrowthDialer Blog`,
    description: post.excerpt,
    keywords: `${post.category.toLowerCase()}, sales dialer, b2b sales, ${post.title.toLowerCase()}`,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    other: {
      "article:author": post.author,
      "article:published_time": new Date(post.date).toISOString(),
      "article:section": post.category,
    },
  };
}

/** Lightweight markdown-ish renderer — kit-styled article typography. */
function formatInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>');
}

function renderBody(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const line of lines) {
    if (line.startsWith("## ")) {
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
    } else if (line.startsWith("**") && line.endsWith("**")) {
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
      out.push(`<p class="mt-5 text-[16px] leading-[1.78] text-zinc-600">${formatInline(line)}</p>`);
    }
  }
  closeList();
  return out.join("");
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  const shareUrl = `https://growthdialer.com/blog/${params.slug}`;
  const wordCount = post.body.split(/\s+/).length;

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

      <div className="pm-container-narrow max-w-3xl pb-24">
        <div className="mt-10">
          <BlogHonestyBanner />
        </div>

        {post.toc && (
          <Toc items={post.toc.map((t) => ({ id: t.id, title: t.text }))} />
        )}

        <div dangerouslySetInnerHTML={{ __html: renderBody(post.body) }} />

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

        <ArticleCta />

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-violet-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all articles
          </Link>
        </div>
      </div>
    </ArticleShell>
  );
}
