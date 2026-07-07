'use client';

import { Plug } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import { FilterTabs } from './FilterTabs';
import { IntegrationGrid } from './IntegrationGrid';
import { IntegrationModal } from './IntegrationModal';
import { useIntegrationsMarketplace } from './useIntegrationsMarketplace';

export function IntegrationsMarketplace() {
  const { apiFetch } = useWorkspace();
  const marketplace = useIntegrationsMarketplace({ apiFetch });

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-[#0A0A0A] px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            title="Integrations Marketplace"
            description="Connect CRMs, AI voice agents, outbound tools, and automations — one enterprise hub."
            icon={Plug}
            badge={`${marketplace.liveCount} active`}
          />

          <FilterTabs
            query={marketplace.query}
            onQueryChange={marketplace.setQuery}
            category={marketplace.category}
            onCategoryChange={marketplace.setCategory}
            resultCount={marketplace.filtered.length}
          />

          <IntegrationGrid
            items={marketplace.filtered}
            getConnectionState={marketplace.getConnectionState}
            onOpen={marketplace.openIntegration}
          />

          {marketplace.filtered.length === 0 && (
            <p className="py-20 text-center text-sm text-zinc-600">
              No integrations match your search.
            </p>
          )}

          <p className="mt-12 pb-6 text-center text-xs text-zinc-700">
            Need a custom connector?{' '}
            <a
              href="mailto:support@growthdialer.com"
              className="text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline"
            >
              Contact sales
            </a>{' '}
            for enterprise SLAs.
          </p>
        </div>
      </main>

      <IntegrationModal
        integration={marketplace.activeIntegration}
        open={marketplace.modalOpen}
        onOpenChange={marketplace.setModalOpen}
        connected={
          marketplace.activeIntegration
            ? marketplace.connectedProviders.includes(marketplace.activeIntegration.id)
            : false
        }
        webhookConfigured={marketplace.webhookConfigured}
        requested={
          marketplace.activeIntegration
            ? marketplace.requestedIds.has(marketplace.activeIntegration.id)
            : false
        }
        onSaved={() => void marketplace.refreshStatus()}
        onRequested={marketplace.markRequested}
      />
    </>
  );
}
