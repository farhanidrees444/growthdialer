import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { CompareVsTemplate } from '@/components/marketing/v2/CompareVs';
import {
  getAllCompetitorSlugs,
  getCompetitorBySlug,
} from '@/lib/marketing/pseo-competitors';
import { buildVsJsonLd, buildVsPageMetadata } from '@/lib/marketing/pseo-content';

type PageProps = {
  params: Promise<{ competitor: string }>;
};

export async function generateStaticParams() {
  return getAllCompetitorSlugs().map((competitor) => ({ competitor }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { competitor: slug } = await params;
  const competitor = getCompetitorBySlug(slug);
  if (!competitor) {
    return { title: 'Comparison Not Found', robots: { index: false } };
  }
  return buildVsPageMetadata(competitor);
}

export default async function VsCompetitorPage({ params }: PageProps) {
  const { competitor: slug } = await params;
  const competitor = getCompetitorBySlug(slug);
  if (!competitor) notFound();

  const jsonLd = buildVsJsonLd(competitor);

  return (
    <>
      {jsonLd.map((schema) => (
        <JsonLd key={schema['@type'] as string} data={schema} />
      ))}
      <CompareVsTemplate competitor={competitor} basePath="vs" />
    </>
  );
}
