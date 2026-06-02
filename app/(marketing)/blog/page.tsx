import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrowthDialer Blog — Sales Dialer Tips, AI Sales Strategies & B2B Sales Best Practices",
  description: "Expert insights on AI-powered sales dialing, parallel dialing strategies, sales automation, and B2B sales best practices. Grow your revenue with proven sales ops tactics.",
  keywords: "sales dialer blog, b2b sales tips, ai sales strategies, sales automation, parallel dialing, sales ops",
  openGraph: {
    title: "GrowthDialer Blog — Sales Dialer Tips & B2B Sales Strategies",
    description: "Expert insights on AI-powered sales dialing and B2B sales best practices.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowthDialer Blog — Sales Dialer Tips & B2B Sales Strategies",
    description: "Expert insights on AI-powered sales dialing and B2B sales best practices.",
  },
};

const posts = [
  {
    slug: "best-ai-sales-dialer-2026",
    title: "7 Best AI Sales Dialers in 2026: Honest Reviews & Comparisons",
    date: "April 9, 2026",
    author: "GrowthDialer Sales Team",
    excerpt: "We tested every major AI sales dialer in 2026. Here's our honest, data-backed review of the top 7 platforms — features, pricing, and who each is best for.",
    category: "Reviews",
    readTime: "18 min read",
  },
  {
    slug: "how-parallel-dialing-works",
    title: "How Parallel Dialing 10x's Your Sales Connect Rate in 2026",
    date: "April 9, 2026",
    author: "GrowthDialer Sales Team",
    excerpt: "Parallel dialing lets your team dial 10 prospects simultaneously. Learn exactly how it works, the science behind it, and how to implement it to 10x your connect rates.",
    category: "Strategy",
    readTime: "16 min read",
  },
  {
    slug: "replace-sdr-team-with-ai",
    title: "How to Replace Your SDR Team with AI in 2026 (Complete Guide)",
    date: "April 9, 2026",
    author: "GrowthDialer Sales Team",
    excerpt: "AI is replacing SDR teams at record speed in 2026. Learn the exact process to transition from human SDRs to AI sales agents — with real cost savings and implementation steps.",
    category: "Guide",
    readTime: "19 min read",
  },
  {
    slug: "best-b2b-sales-dialer-2026",
    title: "10 Best B2B Sales Dialer Software in 2026 (Honest Review)",
    date: "April 9, 2026",
    author: "GrowthDialer Team",
    excerpt: "Comprehensive review of the top B2B sales dialers in 2026. We tested 50+ tools to find the best AI-powered dialers for modern sales teams.",
    category: "Reviews",
    readTime: "8 min read",
  },
  {
    slug: "parallel-dialing-guide",
    title: "Parallel Dialing Without Burning Your Team Out",
    date: "April 2, 2026",
    author: "Sarah Chen",
    excerpt: "Master parallel dialing strategies that boost productivity without sacrificing rep wellbeing. Learn the optimal line counts and best practices.",
    category: "Strategy",
    readTime: "5 min read",
  },
  {
    slug: "ai-coaching",
    title: "What Good AI Call Coaching Looks Like on Live Calls",
    date: "March 18, 2026",
    author: "Mike Rodriguez",
    excerpt: "Real-time AI coaching that actually helps reps improve. See examples of effective AI feedback vs generic suggestions.",
    category: "AI",
    readTime: "6 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-zinc-400">
          <Link href="/" className="hover:text-[#06B6D4] transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-300">Blog</span>
        </nav>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#F5F5F7]">
            GrowthDialer Blog
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed">
            Expert insights on AI-powered sales dialing, automation strategies, and B2B sales best practices. Grow your revenue with proven sales ops tactics.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <div className="group h-full border border-white/[0.08] rounded-xl p-6 hover:border-[#06B6D4]/40 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer">
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30">
                    {post.category}
                  </span>
                  <span className="text-xs text-zinc-500">{post.readTime}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-3 text-[#F5F5F7] group-hover:text-[#06B6D4] transition-colors">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-zinc-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-white/[0.06] pt-4">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>

                {/* Read more link */}
                <div className="mt-4 flex items-center gap-2 text-[#06B6D4] group-hover:gap-3 transition-all text-sm font-medium">
                  Read article
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
