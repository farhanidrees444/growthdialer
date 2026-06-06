import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SolutionPage } from '@/components/marketing/SolutionPage';
import { SOLUTION_PAGES } from '@/lib/marketing/solutions';
import { MARKETING_SITE } from '@/lib/marketing/navigation';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(SOLUTION_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = SOLUTION_PAGES[slug];
  if (!data) return {};
  return {
    title: `${data.eyebrow} — GrowthDialer`,
    description: data.description,
    alternates: { canonical: `${MARKETING_SITE}/solutions/${slug}` },
    openGraph: {
      title: `${data.eyebrow} | GrowthDialer`,
      description: data.description,
      url: `${MARKETING_SITE}/solutions/${slug}`,
    },
  };
}

export default async function SolutionRoutePage({ params }: Props) {
  const { slug } = await params;
  const data = SOLUTION_PAGES[slug];
  if (!data) notFound();
  return <SolutionPage data={data} />;
}
