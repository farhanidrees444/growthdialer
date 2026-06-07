'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Plug } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import {
  MARKETPLACE_INTEGRATIONS,
  type MarketplaceCategory,
  type MarketplaceIntegration,
} from '@/lib/integrations/marketplace-catalog';
import { IntegrationCard, type CardConnectionState } from './IntegrationCard';
import { IntegrationFilters } from './IntegrationFilters';
import { IntegrationModal } from './IntegrationModal';

export function IntegrationsMarketplace() {
  const { currentWorkspace, apiFetch } = useWorkspace();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('all');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [activeIntegration, setActiveIntegration] = useState<MarketplaceIntegration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refreshStatus = useCallback(async () => {
    const [statusRes, hookRes, configRes] = await Promise.all([
      apiFetch('/api/integrations/status'),
      fetch('/api/webhooks/outgoing'),
      fetch('/api/integrations/config'),
    ]);

    if (statusRes.ok) {
      const data = (await statusRes.json()) as { connected: { provider: string }[] };
      setConnectedProviders((data.connected ?? []).map((c) => c.provider));
    }

    if (hookRes.ok) {
      const hook = (await hookRes.json()) as { configured?: boolean };
      setWebhookConfigured(Boolean(hook.configured));
    }

    if (configRes.ok) {
      const cfg = (await configRes.json()) as { connected?: string[] };
      if (cfg.connected?.length) {
        setConnectedProviders((prev) => [...new Set([...prev, ...cfg.connected!])]);
      }
    }
  }, [apiFetch]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (searchParams.get('connected') === 'hubspot') {
      toast.success('HubSpot connected — calls will log after disposition');
      void refreshStatus();
    }
    if (searchParams.get('error')?.startsWith('hubspot')) {
      toast.error('HubSpot connection failed');
    }
  }, [searchParams, refreshStatus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MARKETPLACE_INTEGRATIONS.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  function getConnectionState(item: MarketplaceIntegration): CardConnectionState {
    if (requestedIds.has(item.id)) return 'requested';

    if (item.configureMode === 'oauth') {
      return connectedProviders.includes(item.id) ? 'connected' : 'idle';
    }

    if (item.configureMode === 'webhook') {
      if (item.id === 'zapier' || item.id === 'webhooks') {
        return webhookConfigured ? 'configured' : 'idle';
      }
    }

    if (item.configureMode === 'api_key' || item.id === 'make') {
      return connectedProviders.includes(item.id) ? 'connected' : 'idle';
    }

    return 'idle';
  }

  function openIntegration(item: MarketplaceIntegration) {
    setActiveIntegration(item);
    setModalOpen(true);
  }

  const liveCount = useMemo(() => {
    let count = connectedProviders.length;
    if (webhookConfigured && !connectedProviders.includes('zapier')) count += 1;
    return count;
  }, [connectedProviders, webhookConfigured]);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-[#0A0A0A] px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            title="Integrations Marketplace"
            description="Connect CRMs, AI voice agents, outbound tools, and automations — one enterprise hub."
            icon={Plug}
            badge={`${liveCount} active`}
          />

          <IntegrationFilters
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
            resultCount={filtered.length}
          />

          <motion.div
            layout
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <IntegrationCard
                  key={item.id}
                  integration={item}
                  connectionState={getConnectionState(item)}
                  onOpen={() => openIntegration(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
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
        integration={activeIntegration}
        open={modalOpen}
        onOpenChange={setModalOpen}
        connected={activeIntegration ? connectedProviders.includes(activeIntegration.id) : false}
        webhookConfigured={webhookConfigured}
        requested={activeIntegration ? requestedIds.has(activeIntegration.id) : false}
        workspaceId={currentWorkspace?.id}
        onSaved={() => void refreshStatus()}
        onRequested={(id) => setRequestedIds((prev) => new Set(prev).add(id))}
      />
    </>
  );
}
