import Link from "next/link";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; body: string }> = {
  "parallel-dialing-guide": {
    title: "Parallel dialing without burning your team out",
    body: `Start with clear dispositions, cap parallel lines while reps ramp, and review connect rates daily. GrowthDialer is built to keep reps in flow — tune line count and voicemail drop rules to match your market.`,
  },
  "ai-coaching": {
    title: "What good AI call coaching looks like on live calls",
    body: `The best coaching is timely and specific: objection labels, talk ratios, and next-step suggestions. Use AI as a copilot, not a script — your reps stay authentic while staying on message.`,
  },
};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  return (
    <article className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <Link href="/blog" className="text-sm text-brand hover:underline mb-6 inline-block">
        ← Back to blog
      </Link>
      <h1 className="font-display text-3xl font-bold mb-6">{post.title}</h1>
      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{post.body}</p>
    </article>
  );
}
