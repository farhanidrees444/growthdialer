'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, ExternalLink, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { APP_SIGNIN, APP_SIGNUP } from '@/lib/marketing/navigation';
import {
  WEBHOOK_EVENT_TYPES,
  type MarketplaceIntegration,
} from '@/lib/integrations/marketplace-catalog';
import { IntegrationConnectLottie } from './IntegrationConnectLottie';
import { IntegrationLogo } from './IntegrationLogo';

type ModalPhase = 'form' | 'saving' | 'success';

interface IntegrationModalProps {
  integration: MarketplaceIntegration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connected: boolean;
  webhookConfigured: boolean;
  requested: boolean;
  workspaceId?: string;
  marketingMode?: boolean;
  onSaved: () => void;
  onRequested: (id: string) => void;
}

function WebhookSecretBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const copy = () => {
    void navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-zinc-300"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
      </div>
      <code className="block break-all font-mono text-[12px] text-zinc-300">{value}</code>
      {hint && <p className="mt-2 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

export function IntegrationModal({
  integration,
  open,
  onOpenChange,
  connected,
  webhookConfigured,
  requested,
  workspaceId,
  marketingMode = false,
  onSaved,
  onRequested,
}: IntegrationModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('form');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedSecret, setSavedSecret] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setPhase('form');
    setValues({});
    setEmail('');
    setSavedSecret(null);
  }, []);

  useEffect(() => {
    if (!open || !integration || marketingMode) return;
    resetForm();
    setLoading(true);

    const load = async () => {
      try {
        if (integration.configureMode === 'webhook' || integration.id === 'make') {
          const res = await fetch('/api/integrations');
          if (res.ok) {
            const data = (await res.json()) as { webhook_url?: string; has_secret?: boolean };
            if (data.webhook_url) {
              setValues((v) => ({ ...v, webhook_url: data.webhook_url ?? '' }));
            }
            if (data.has_secret) {
              setSavedSecret('••••••••••••••••');
            }
          }
        }
        if (integration.configureMode === 'api_key' || integration.id === 'make') {
          const res = await fetch(`/api/integrations?provider=${integration.id}`);
          if (res.ok) {
            const data = (await res.json()) as { has_key?: boolean; webhook_url?: string };
            if (data.webhook_url) {
              setValues((v) => ({ ...v, webhook_url: data.webhook_url ?? '' }));
            }
            if (data.has_key) {
              setValues((v) => ({ ...v, api_key: '••••••••••••' }));
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, integration, marketingMode, resetForm]);

  if (!integration) return null;

  const isWebhook = integration.configureMode === 'webhook';
  const isOAuth = integration.configureMode === 'oauth';
  const isVote = integration.configureMode === 'vote';
  const isAlreadyConnected =
    isOAuth
      ? connected
      : isWebhook && integration.id !== 'make'
        ? webhookConfigured
        : connected;

  const appConnectHref = `${APP_SIGNIN}?next=${encodeURIComponent(`/dashboard/integrations?open=${integration.id}`)}`;

  async function handleSave() {
    if (!integration || marketingMode) return;
    const item = integration;

    setPhase('saving');
    const minDelay = new Promise((r) => setTimeout(r, 1600));

    try {
      if (isWebhook && item.id !== 'make') {
        const res = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: item.id,
            webhook_url: values.webhook_url ?? '',
            webhook_secret: values.webhook_secret || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setPhase('form');
          toast.error((data as { error?: string }).error ?? 'Failed to save');
          return;
        }
        if (values.webhook_secret?.trim()) {
          setSavedSecret(values.webhook_secret.trim());
        }
      } else if (item.configureMode === 'api_key' || item.id === 'make') {
        const apiKey = values.api_key?.startsWith('••') ? undefined : values.api_key;
        const res = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: item.id,
            api_key: apiKey,
            webhook_url: values.webhook_url || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setPhase('form');
          toast.error((data as { error?: string }).error ?? 'Failed to save connection');
          return;
        }
      }

      await minDelay;
      setPhase('success');
      toast.success(`${item.name} connected`);
      onSaved();
      window.setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1200);
    } catch {
      setPhase('form');
      toast.error('Connection failed — please try again');
    }
  }

  async function handleVote() {
    if (!integration) return;
    const item = integration;

    if (!email.includes('@')) return;
    setPhase('saving');
    try {
      const res = await fetch('/api/integrations/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), provider: item.id }),
      });
      if (!res.ok) {
        setPhase('form');
        toast.error('Could not register your request');
        return;
      }
      await new Promise((r) => setTimeout(r, 1400));
      setPhase('success');
      onRequested(item.id);
      toast.success(`Request recorded for ${item.name}`);
      window.setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1000);
    } catch {
      setPhase('form');
      toast.error('Something went wrong');
    }
  }

  function handleOAuthConnect() {
    if (marketingMode) {
      window.location.href = appConnectHref;
      return;
    }
    const ws = workspaceId ? `?workspace_id=${workspaceId}` : '';
    window.location.href = `/api/integrations/hubspot/authorize${ws}`;
  }

  function handleDisconnect() {
    if (!integration || marketingMode) return;
    const item = integration;

    if (item.id === 'hubspot') {
      void fetch('/api/integrations/hubspot/disconnect', { method: 'POST' }).then(() => {
        toast.success('HubSpot disconnected');
        onSaved();
        onOpenChange(false);
      });
      return;
    }
    if (isWebhook && item.id !== 'make') {
      void fetch('/api/integrations?webhook=1', { method: 'DELETE' }).then(() => {
        toast.success('Webhook removed');
        onSaved();
        onOpenChange(false);
      });
      return;
    }
    void fetch(`/api/integrations?provider=${item.id}`, { method: 'DELETE' }).then(() => {
      toast.success(`${item.name} disconnected`);
      onSaved();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-zinc-800/60 bg-zinc-950 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2">
              <IntegrationLogo
                name={integration.name}
                logoDomain={integration.logoDomain}
                brandColor={integration.brandColor}
              />
            </div>
            <div className="min-w-0 text-left">
              <SheetTitle className="text-base font-medium text-zinc-50">
                {integration.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                {marketingMode
                  ? 'Preview — sign in to connect'
                  : isVote
                    ? 'Request early access'
                    : isOAuth
                      ? 'OAuth connection'
                      : 'Configure connection'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          {marketingMode && !isVote && (
            <div className="mb-5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-[13px] text-violet-200">
              Create a free workspace to connect {integration.name} and sync call events in real
              time.
              <div className="mt-3 flex gap-2">
                <a
                  href={APP_SIGNUP}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
                >
                  Start free
                </a>
                <Link
                  href={appConnectHref}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {phase === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IntegrationConnectLottie />
              <p className="mt-4 text-sm font-medium text-zinc-300">Authenticating…</p>
              <p className="mt-1 text-xs text-zinc-600">
                Verifying credentials with {integration.name}
              </p>
            </div>
          )}

          {phase === 'success' && <ConnectionSuccessState integration={integration} />}

          {phase === 'form' && (
            <>
              <p className="text-sm leading-relaxed text-zinc-400">{integration.description}</p>

              <div className="mt-5 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Setup checklist
                </p>
                <ol className="space-y-2">
                  {integration.setupSteps.map((step, i) => (
                    <li key={step} className="flex gap-2.5 text-[13px] text-zinc-400">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-medium text-zinc-500">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {(isWebhook || integration.id === 'make') && (
                <div className="mt-4 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Outgoing events (Zapier &amp; webhooks)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WEBHOOK_EVENT_TYPES.map((ev) => (
                      <span
                        key={ev}
                        className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-500"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {loading && !marketingMode ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                </div>
              ) : isVote ? (
                <div className="mt-5 space-y-3">
                  {requested ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-center">
                      <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-200">You&apos;re on the list</p>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="border-zinc-800/60 bg-zinc-900/40 text-zinc-100"
                      />
                      <Button
                        className="w-full bg-zinc-100 text-zinc-950 hover:bg-white"
                        disabled={!email.includes('@')}
                        onClick={() => void handleVote()}
                      >
                        Request Early Access
                      </Button>
                    </>
                  )}
                </div>
              ) : isOAuth ? (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Shield className="h-3.5 w-3.5" />
                    Secure OAuth — we never store your HubSpot password
                  </div>
                  {isAlreadyConnected && !marketingMode ? (
                    <>
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                        Connected
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-zinc-800 text-zinc-400"
                        onClick={handleDisconnect}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-zinc-100 text-zinc-950 hover:bg-white"
                      onClick={handleOAuthConnect}
                    >
                      {marketingMode ? 'Sign in to connect' : `Connect with ${integration.name}`}
                    </Button>
                  )}
                </div>
              ) : marketingMode ? (
                <div className="mt-5">
                  <Link
                    href={appConnectHref}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white"
                  >
                    Configure in workspace
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {integration.fields?.map((field) => (
                    <div key={field.id}>
                      <label
                        htmlFor={`field-${field.id}`}
                        className="mb-1.5 block text-xs font-medium text-zinc-500"
                      >
                        {field.label}
                        {field.optional && (
                          <span className="text-zinc-700"> (optional)</span>
                        )}
                      </label>
                      <Input
                        id={`field-${field.id}`}
                        type={field.type}
                        value={values[field.id] ?? ''}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.id]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="border-zinc-800/60 bg-zinc-900/40 font-mono text-sm text-zinc-100"
                      />
                    </div>
                  ))}

                  {savedSecret && (
                    <WebhookSecretBlock
                      label="Webhook signing secret"
                      value={savedSecret}
                      hint="Verify payloads with HMAC-SHA256 using the X-GrowthDialer-Signature header."
                    />
                  )}

                  {isAlreadyConnected && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Connected
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      className="w-full bg-zinc-100 text-zinc-950 hover:bg-white"
                      disabled={
                        !isAlreadyConnected &&
                        Boolean(
                          integration.fields?.some(
                            (f) => !f.optional && !(values[f.id]?.trim()),
                          ),
                        )
                      }
                      onClick={() => void handleSave()}
                    >
                      Save Connection
                    </Button>
                    {isWebhook && isAlreadyConnected && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-zinc-800 text-zinc-400"
                        onClick={() =>
                          void fetch('/api/integrations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'test' }),
                          }).then(async (res) => {
                            const data = await res.json().catch(() => ({}));
                            if (res.ok) toast.success('Test event delivered');
                            else toast.error((data as { error?: string }).error ?? 'Test failed');
                          })
                        }
                      >
                        Send test event
                      </Button>
                    )}
                    {isAlreadyConnected && (
                      <Button
                        variant="outline"
                        className="w-full border-zinc-800 text-zinc-400"
                        onClick={handleDisconnect}
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {integration.docsUrl && phase === 'form' && !isVote && (
                <a
                  href={integration.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-600 transition hover:text-zinc-400"
                >
                  View documentation <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ConnectionSuccessState({ integration }: { integration: MarketplaceIntegration }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-400" />
      <p className={cn('mt-4 text-sm font-medium text-zinc-200')}>
        {integration.name} is ready
      </p>
      <p className="mt-1 text-xs text-zinc-600">Connection verified successfully</p>
    </div>
  );
}
