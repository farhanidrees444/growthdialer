'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  Search,
  X,
  Loader2,
  CheckCircle2,
  ThumbsUp,
  Settings2,
  Link2,
  Shield,
  Zap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_INTEGRATIONS,
  WEBHOOK_EVENT_TYPES,
  type MarketplaceCategory,
  type MarketplaceIntegration,
} from '@/lib/integrations/marketplace-catalog';

// ─── Configure dialog (Zapier + Custom Webhooks) ─────────────────────────────

function ConfigureDialog({
  integration,
  onClose,
}: {
  integration: MarketplaceIntegration;
  onClose: () => void;
}) {
  const isZapier = integration.id === 'zapier';
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void fetch('/api/webhooks/outgoing')
      .then((r) => r.json())
      .then((data: { webhook_url?: string }) => {
        if (data.webhook_url) setUrl(data.webhook_url);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/webhooks/outgoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: url,
          webhook_secret: secret || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save');
        return;
      }
      toast.success(isZapier ? 'Zapier hook URL saved' : 'Webhook endpoint saved');
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/webhooks/outgoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'Test failed');
        return;
      }
      toast.success('Test event delivered to your endpoint');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900/80 to-zinc-950 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900"
                style={{ boxShadow: `0 0 24px ${integration.brandColor}22` }}
              >
                {integration.logo}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-50">{integration.name}</h3>
                <p className="text-xs text-zinc-500">
                  {isZapier ? 'Connect via Zapier Catch Hook' : 'Outgoing event delivery'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {isZapier ? (
            <ol className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2">
                <span className="font-mono text-xs text-violet-400">1</span>
                Create a Zap with <strong className="text-zinc-300">Webhooks by Zapier → Catch Hook</strong>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-xs text-violet-400">2</span>
                Copy the custom webhook URL Zapier provides
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-xs text-violet-400">3</span>
                Paste it below — GrowthDialer will POST call events to it
              </li>
            </ol>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-400">
              Add any HTTPS endpoint. We send signed JSON payloads for call lifecycle events.
            </p>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Supported events
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WEBHOOK_EVENT_TYPES.map((ev) => (
                <span
                  key={ev}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400"
                >
                  {ev}
                </span>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="webhook-url" className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {isZapier ? 'Zapier Catch Hook URL' : 'Webhook URL'}
                </label>
                <input
                  id="webhook-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              {!isZapier && (
                <div>
                  <label htmlFor="webhook-secret" className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Signing secret <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    id="webhook-secret"
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Used for X-GrowthDialer-Signature HMAC"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={saving || !url.trim()}
              onClick={() => void handleSave()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Save & connect
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={() => void handleTest()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test
            </button>
          </div>

          {isZapier && (
            <a
              href="https://zapier.com/apps/webhook/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Open Zapier Webhooks docs <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Vote / request access dialog ──────────────────────────────────────────────

function VoteDialog({
  integration,
  onClose,
  onVoted,
}: {
  integration: MarketplaceIntegration;
  onClose: () => void;
  onVoted: (id: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleVote() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), provider: integration.id }),
      });
      if (!res.ok) {
        toast.error('Could not register your vote');
        return;
      }
      setDone(true);
      onVoted(integration.id);
      toast.success(`Vote recorded for ${integration.name}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
            {integration.logo}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-50">Request {integration.name}</h3>
            <p className="text-xs text-zinc-500">Vote to prioritize on our roadmap</p>
          </div>
        </div>

        {done ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-center"
          >
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-200">You&apos;re on the list</p>
            <p className="mt-1 text-xs text-zinc-500">We&apos;ll email you when {integration.name} launches.</p>
          </motion.div>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-400">{integration.description}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mb-4 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
            />
            <button
              type="button"
              disabled={loading || !email.includes('@')}
              onClick={() => void handleVote()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4" />
                  Vote to unlock
                </>
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Integration card ──────────────────────────────────────────────────────────

function MarketplaceCard({
  item,
  connected,
  webhookConfigured,
  voted,
  votePulse,
  onAction,
}: {
  item: MarketplaceIntegration;
  connected: boolean;
  webhookConfigured: boolean;
  voted: boolean;
  votePulse: boolean;
  onAction: () => void;
}) {
  const isConfigured =
    item.id === 'webhooks' || item.id === 'zapier' ? webhookConfigured : connected;

  const ctaLabel =
    item.action === 'connect'
      ? connected
        ? 'Connected'
        : 'Connect'
      : item.action === 'configure'
        ? isConfigured
          ? 'Configured'
          : 'Configure'
        : voted
          ? 'Requested'
          : 'Vote to unlock';

  return (
    <motion.article
      layout
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition-shadow hover:border-zinc-700 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${item.brandColor}12, transparent 70%)`,
        }}
      />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 transition-transform duration-300 group-hover:scale-105"
          style={{ boxShadow: `0 0 0 1px ${item.brandColor}15` }}
        >
          {item.logo}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {item.live && (
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
              Live
            </span>
          )}
          {item.popular && (
            <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
              Popular
            </span>
          )}
          {isConfigured && item.action !== 'vote' && (
            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300">
              Active
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{item.tagline}</p>
        <h3 className="mt-1 text-base font-semibold text-zinc-50">{item.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.description}</p>
      </div>

      <motion.button
        type="button"
        onClick={onAction}
        animate={votePulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className={cn(
          'relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition',
          item.action === 'connect' && connected
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : item.action === 'configure' && isConfigured
              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
              : voted
                ? 'border-zinc-700 bg-zinc-900 text-zinc-400'
                : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800',
        )}
      >
        {item.action === 'connect' && !connected && <Link2 className="h-4 w-4" />}
        {item.action === 'configure' && <Settings2 className="h-4 w-4" />}
        {item.action === 'vote' && !voted && <ThumbsUp className="h-4 w-4" />}
        {voted && item.action === 'vote' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {connected && item.action === 'connect' && <CheckCircle2 className="h-4 w-4" />}
        {ctaLabel}
      </motion.button>
    </motion.article>
  );
}

// ─── Main marketplace ──────────────────────────────────────────────────────────

export function IntegrationsMarketplace() {
  const { currentWorkspace, apiFetch } = useWorkspace();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('all');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<MarketplaceIntegration | null>(null);

  const refreshStatus = useCallback(async () => {
    const [statusRes, hookRes] = await Promise.all([
      apiFetch('/api/integrations/status'),
      fetch('/api/webhooks/outgoing'),
    ]);

    if (statusRes.ok) {
      const data = (await statusRes.json()) as { connected: { provider: string }[] };
      setConnectedProviders((data.connected ?? []).map((c) => c.provider));
    }

    if (hookRes.ok) {
      const hook = (await hookRes.json()) as { configured?: boolean };
      setWebhookConfigured(Boolean(hook.configured));
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

  function handleCardAction(item: MarketplaceIntegration) {
    if (item.action === 'connect' && item.id === 'hubspot') {
      if (connectedProviders.includes('hubspot')) {
        void apiFetch('/api/integrations/hubspot/disconnect', { method: 'POST' }).then(() => {
          toast.success('HubSpot disconnected');
          void refreshStatus();
        });
        return;
      }
      const ws = currentWorkspace?.id ? `?workspace_id=${currentWorkspace.id}` : '';
      window.location.href = `/api/integrations/hubspot/authorize${ws}`;
      return;
    }

    if (item.action === 'configure') {
      setDialog(item);
      return;
    }

    setDialog(item);
  }

  function handleVoted(id: string) {
    setVotedIds((prev) => new Set(prev).add(id));
    setPulseId(id);
    window.setTimeout(() => setPulseId(null), 400);
  }

  const filtered = MARKETPLACE_INTEGRATIONS.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tagline.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const liveCount =
    connectedProviders.length + (webhookConfigured ? 1 : 0);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            title="Integrations Marketplace"
            description="Connect your revenue stack — CRM, automation, and webhooks in one enterprise hub."
            icon={Plug}
            badge={`${liveCount} active`}
          />

          <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search integrations..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                    category === cat.id
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/80 via-zinc-950 to-zinc-900/50 px-5 py-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">Enterprise-ready event pipeline</p>
              <p className="text-xs text-zinc-500">
                HubSpot OAuth is live. Custom webhooks &amp; Zapier deliver signed JSON on call events.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Shield className="h-3.5 w-3.5" />
              HTTPS + optional HMAC signing
            </div>
          </motion.div>

          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  connected={connectedProviders.includes(item.id)}
                  webhookConfigured={webhookConfigured}
                  voted={votedIds.has(item.id)}
                  votePulse={pulseId === item.id}
                  onAction={() => handleCardAction(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-zinc-500">No integrations match your search.</p>
          )}

          <p className="mt-10 text-center text-xs text-zinc-600">
            Need a custom connector?{' '}
            <a href="mailto:support@growthdialer.com" className="text-zinc-400 underline-offset-2 hover:underline">
              Contact sales
            </a>{' '}
            for enterprise SLAs.
          </p>
        </div>
      </main>

      <AnimatePresence>
        {dialog &&
          (dialog.action === 'configure' ? (
            <ConfigureDialog key={dialog.id} integration={dialog} onClose={() => setDialog(null)} />
          ) : dialog.action === 'vote' ? (
            <VoteDialog
              key={dialog.id}
              integration={dialog}
              onClose={() => setDialog(null)}
              onVoted={handleVoted}
            />
          ) : null)}
      </AnimatePresence>
    </>
  );
}
