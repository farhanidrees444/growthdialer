import Link from "next/link";

export const metadata = {
  title: "Blog",
};

const posts = [
  {
    slug: "parallel-dialing-guide",
    title: "Parallel dialing without burning your team out",
    date: "April 2, 2026",
  },
  {
    slug: "ai-coaching",
    title: "What good AI call coaching looks like on live calls",
    date: "March 18, 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Blog</h1>
      <p className="text-muted-foreground mb-10">Product notes and sales ops ideas.</p>
      <ul className="space-y-6">
        {posts.map((p) => (
          <li key={p.slug} className="border-b border-white/10 pb-6">
            <p className="text-xs text-muted-foreground mb-1">{p.date}</p>
            <Link href={`/blog/${p.slug}`} className="font-display text-lg font-semibold hover:text-brand transition-colors">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
