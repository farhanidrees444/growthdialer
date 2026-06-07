'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  MARKETPLACE_INTEGRATIONS,
  getIntegrationById,
  type MarketplaceCategory,
  type MarketplaceIntegration,
} from '@/lib/integrations/marketplace-catalog';
import type { CardConnectionState } from './IntegrationCard';

type RefreshOptions = {
  apiFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

export function useIntegrationsMarketplace({ apiFetch }: RefreshOptions = {}) {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('all');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [activeIntegration, setActiveIntegration] = useState<MarketplaceIntegration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchJson = useCallback(
    async (url: string, init?: RequestInit) => {
      const res = apiFetch ? await apiFetch(url, init) : await fetch(url, init);
      return res;
    },
    [apiFetch],
  );

  const refreshStatus = useCallback(async () => {
    try {
      const statusRes = await fetchJson('/api/integrations');
      if (statusRes.ok) {
        const data = (await statusRes.json()) as {
          connected?: { provider: string }[];
          connectedProviders?: string[];
          webhookConfigured?: boolean;
        };
        const providers =
          data.connectedProviders ??
          (data.connected ?? []).map((c) => c.provider);
        setConnectedProviders(providers);
        if (typeof data.webhookConfigured === 'boolean') {
          setWebhookConfigured(data.webhookConfigured);
        }
      }
    } catch {
      // Marketing preview — unauthenticated users skip status
    }
  }, [fetchJson]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      const item = getIntegrationById(openId);
      if (item) {
        setActiveIntegration(item);
        setModalOpen(true);
      }
    }
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

  return {
    query,
    setQuery,
    category,
    setCategory,
    filtered,
    connectedProviders,
    webhookConfigured,
    requestedIds,
    activeIntegration,
    modalOpen,
    setModalOpen,
    liveCount,
    refreshStatus,
    getConnectionState,
    openIntegration,
    markRequested: (id: string) => setRequestedIds((prev) => new Set(prev).add(id)),
  };
}
