'use client';

import Link from 'next/link';
import { ArrowRight, Plug } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MarketingPageHero } from '@/components/marketing/live-floor/MarketingPageHero';
import { APP_SIGNUP } from '@/lib/marketing/navigation';
import { FilterTabs } from './FilterTabs';
import { IntegrationGrid } from './IntegrationGrid';
import { IntegrationModal } from './IntegrationModal';
import { useIntegrationsMarketplace } from './useIntegrationsMarketplace';
import type { MarketplaceIntegration } from '@/lib/integrations/marketplace-catalog';

export function MarketingIntegrationsMarketplace() {
  const marketplace = useIntegrationsMarketplace();

  function handleOpen(item: MarketplaceIntegration) {
    marketplace.openIntegration(item);
  }

  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Integrations Marketplace"
        title={<>100+ connectors. One dialer hub.</>}
        description="Connect CRMs, AI voice agents, outbound sequencers, and automations — the stack KrispCall doesn't cover, built for modern revenue teams."
      >
        <a
          href={APP_SIGNUP}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
        >
          Start free <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/docs/api"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-6 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-md hover:border-zinc-700"
        >
          API reference
        </Link>
      </MarketingPageHero>

      <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Plug className="h-4 w-4 text-zinc-600" />
          <span>
            Browse live and upcoming integrations — sign in to connect from your workspace.
          </span>
        </div>

        <FilterTabs
          query={marketplace.query}
          onQueryChange={marketplace.setQuery}
          category={marketplace.category}
          onCategoryChange={marketplace.setCategory}
          resultCount={marketplace.filtered.length}
          sticky={false}
        />

        <IntegrationGrid
          items={marketplace.filtered}
          getConnectionState={marketplace.getConnectionState}
          onOpen={handleOpen}
        />

        {marketplace.filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-600">
            No integrations match your search.
          </p>
        )}
      </section>

      <IntegrationModal
        integration={marketplace.activeIntegration}
        open={marketplace.modalOpen}
        onOpenChange={marketplace.setModalOpen}
        connected={false}
        webhookConfigured={false}
        requested={
          marketplace.activeIntegration
            ? marketplace.requestedIds.has(marketplace.activeIntegration.id)
            : false
        }
        marketingMode
        onSaved={() => void marketplace.refreshStatus()}
        onRequested={marketplace.markRequested}
      />
    </MarketingShell>
  );
}
