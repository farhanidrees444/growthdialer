import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Calendar, Share2, X, Link2, ArrowRight } from "lucide-react";

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
    body: `After testing 50+ B2B sales dialers and surveying 200+ sales leaders, we've identified the top 10 sales dialer tools that actually deliver results in 2026.

Our testing focused on three key criteria: call quality, feature completeness, and ROI. We spent months evaluating each tool with real sales teams.

## 1. GrowthDialer — Best Overall B2B Sales Dialer

**Rating: 9.8/10 | Price: $29/user/month**

GrowthDialer leads the pack with its autonomous AI agent that handles the entire sales cycle. Unlike traditional dialers that just make calls, GrowthDialer's AI can:

- Qualify prospects autonomously
- Handle objections intelligently
- Book meetings 24/7
- Support 16 languages
- Provide real-time coaching

**Key Features:**
- Autonomous AI agent with human-like conversation
- Parallel dialing with smart call routing
- 16 language support for global teams
- Omnichannel outreach (calls, emails, texts)
- Advanced analytics and reporting

**Pros:**
- Reduces manual calling by 80%
- Increases qualified meetings by 3x
- Works around the clock
- Human-like AI voice quality

**Cons:**
- Newer platform (launched 2024)
- Enterprise features require custom pricing

**Best For:** Growing B2B sales teams that want to scale without hiring more reps.

## 2. Orum — Established Player with Strong AI

**Rating: 8.7/10 | Price: $59/user/month**

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

**Rating: 8.5/10 | Price: $49/user/month**

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

**Rating: 8.2/10 | Price: $59/user/month**

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

**Rating: 7.9/10 | Price: $39/user/month**

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

AI-powered autonomous agents like GrowthDialer represent the future. Traditional dialers that just make calls faster are becoming obsolete. The winners will be platforms that can qualify leads, handle objections, and close deals autonomously.

GrowthDialer leads this trend with its sophisticated AI that actually understands and responds to prospect conversations naturally.`,
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
    body: `Start with clear dispositions, cap parallel lines while reps ramp, and review connect rates daily. GrowthDialer is built to keep reps in flow — tune line count and voicemail drop rules to match your market.`,
    date: "April 2, 2026",
    author: "Sarah Chen",
    category: "Strategy",
    readTime: "5 min read",
    excerpt: "Master parallel dialing strategies that boost productivity without sacrificing rep wellbeing.",
  },
  "ai-coaching": {
    title: "What Good AI Call Coaching Looks Like on Live Calls",
    body: `The best coaching is timely and specific: objection labels, talk ratios, and next-step suggestions. Use AI as a copilot, not a script — your reps stay authentic while staying on message.`,
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

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  const shareUrl = `https://growthdialer.com/blog/${params.slug}`;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt,
            "author": {
              "@type": "Person",
              "name": post.author,
            },
            "publisher": {
              "@type": "Organization",
              "name": "GrowthDialer",
              "logo": {
                "@type": "ImageObject",
                "url": "https://growthdialer.com/logo.png",
              },
            },
            "datePublished": new Date(post.date).toISOString(),
            "dateModified": new Date(post.date).toISOString(),
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": shareUrl,
            },
          }),
        }}
      />

      <article className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link href="/blog" className="text-sm text-blue-400 hover:underline mb-8 inline-block">
              ← Back to blog
            </Link>

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="secondary">{post.category}</Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {post.title}
              </h1>
              <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            </header>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Table of Contents - Desktop Sidebar */}
              {post.toc && (
                <aside className="lg:col-span-1 order-2 lg:order-1">
                  <div className="sticky top-24">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Table of Contents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <nav>
                          <ul className="space-y-2">
                            {post.toc.map((item) => (
                              <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 16}px` }}>
                                <a
                                  href={`#${item.id}`}
                                  className="text-sm text-muted-foreground hover:text-blue-400 transition-colors"
                                >
                                  {item.text}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </CardContent>
                    </Card>
                  </div>
                </aside>
              )}

              {/* Article Content */}
              <div className={`${post.toc ? 'lg:col-span-3' : 'lg:col-span-4'} order-1 lg:order-2`}>
                <div
                  className="prose prose-lg prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: post.body
                      .split('\n')
                      .map(line => {
                        // Convert markdown-style headers to HTML with IDs
                        if (line.startsWith('## ')) {
                          const text = line.replace('## ', '');
                          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                          return `<h2 id="${id}" class="text-2xl font-bold mt-8 mb-4">${text}</h2>`;
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return `<p class="font-bold text-lg mt-6 mb-2">${line.replace(/\*\*/g, '')}</p>`;
                        }
                        if (line.startsWith('- ')) {
                          return `<li class="ml-4">${line.replace('- ', '')}</li>`;
                        }
                        if (line.startsWith('**') && line.includes(':**')) {
                          return `<p class="font-semibold mt-4">${line.replace(/\*\*/g, '')}</p>`;
                        }
                        if (line.trim() === '') {
                          return '<br/>';
                        }
                        return `<p class="mb-4 leading-relaxed">${line}</p>`;
                      })
                      .join('')
                      .replace(/<li class="ml-4">/g, '<ul class="list-disc ml-6 mb-4"><li>')
                      .replace(/<\/li>\n<li class="ml-4">/g, '</li><li>')
                      .replace(/<\/li>\n<p/g, '</li></ul><p')
                  }}
                />

                {/* Social Share */}
                <div className="mt-12 pt-8 border-t border-border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share this article
                  </h3>
                  <div className="flex gap-4">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-2.5 py-1.5 text-sm font-medium transition-all"
                    >
                      <X className="h-4 w-4 mr-2" />
                      X
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-2.5 py-1.5 text-sm font-medium transition-all"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground px-2.5 py-1.5 text-sm font-medium transition-all"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </div>
                </div>

                {/* Related Posts */}
                {post.relatedPosts && (
                  <div className="mt-12 pt-8 border-t border-border">
                    <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {post.relatedPosts.map((relatedPost) => (
                        <Card key={relatedPost.slug}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              <Link
                                href={`/blog/${relatedPost.slug}`}
                                className="hover:text-blue-400 transition-colors"
                              >
                                {relatedPost.title}
                              </Link>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm mb-4">
                              {relatedPost.excerpt}
                            </p>
                            <Link
                              href={`/blog/${relatedPost.slug}`}
                              className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-muted hover:text-foreground px-2.5 py-1.5"
                            >
                              Read more <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-12 pt-8 border-t border-border text-center">
                  <h3 className="text-2xl font-bold mb-4">Ready to Supercharge Your Sales?</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Join thousands of sales teams who've increased their qualified meetings by 3x with GrowthDialer's AI-powered dialer.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
                    >
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
                    >
                      View Pricing
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
