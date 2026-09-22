import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, GitBranch, Mic, PhoneCall, Plug2, Upload, Users } from 'lucide-react';
import { DOC_SECTIONS } from '@/lib/marketing/docs-data';
import { Navbar, Footer } from '@/components/marketing/v2/Chrome';
import { FinalCta, PageHero, SectionHead } from '@/components/marketing/v2/Sections';
import { JsonLd } from '@/components/marketing/v2/JsonLd';
import { Reveal } from '@/components/ui/reveal';
import { APP_SIGNUP, MARKETING_SITE } from '@/lib/marketing/navigation';

export const metadata: Metadata = {
  title: 'Documentation — Setup & dialer guides',
  description:
    'GrowthDialer docs: workspace setup, AI Dialer, power dial, lead import, HubSpot integration, recordings, and team roles.',
  alternates: { canonical: `${MARKETING_SITE}/docs` },
};

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'getting-started': BookOpen,
  dialer: PhoneCall,
  leads: Upload,
  recordings: Mic,
  integrations: Plug2,
  team: Users,
  api: GitBranch,
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <Navbar />
      <main>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            name: 'GrowthDialer Documentation',
            description: 'Product documentation for GrowthDialer AI sales dialer.',
            url: `${MARKETING_SITE}/docs`,
          }}
        />
        <PageHero
          eyebrow="Documentation"
          title={
            <>
              Everything you need
              <br />
              to run your floor.
            </>
          }
          lede="Practical guides tied to what ships today — not a wiki of promises. Start free and follow along in your workspace."
          cta={{ label: 'Create workspace', href: APP_SIGNUP }}
        />

        <div className="pm-section-tight">
          <div className="pm-container">
            <SectionHead
              eyebrow="Contents"
              title="Find it fast."
              lede="Seven sections, each mapped to the product as it works today."
              align="left"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {DOC_SECTIONS.map((section, i) => {
                const Icon = SECTION_ICONS[section.id] ?? BookOpen;
                return (
                  <Reveal key={section.id} delay={(i % 2) * 70}>
                    <article id={section.id} className="pm-card pm-card-hover h-full scroll-mt-32 p-7">
                      <Link href={section.href} className="group block">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h2 className="pm-h-card mt-5 flex items-center gap-2">
                          {section.title}
                          <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-violet-700" />
                        </h2>
                        <p className="pm-body mt-2 !text-[14.5px]">{section.description}</p>
                      </Link>
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {section.topics.map((t) => (
                          <li key={t} className="pm-chip !text-[11px]">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
