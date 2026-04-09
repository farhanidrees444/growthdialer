import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            GrowthDialer Blog
          </h1>
          <p className="text-xl text-muted-foreground">
            Expert insights on AI-powered sales dialing, automation strategies, and B2B sales best practices.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {posts.map((post) => (
            <Card key={post.slug} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </div>
                <CardTitle className="group-hover:text-blue-400 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
