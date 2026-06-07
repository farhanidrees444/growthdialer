'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Shield } from 'lucide-react';
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
import {
  WEBHOOK_EVENT_TYPES,
  type MarketplaceIntegration,
} from '@/lib/integrations/marketplace-catalog';
import { IntegrationConnectLottie } from './IntegrationConnectLottie';

type ModalPhase = 'form' | 'saving' | 'success';

interface IntegrationModalProps {
  integration: MarketplaceIntegration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connected: boolean;
  webhookConfigured: boolean;
  requested: boolean;
  workspaceId?: string;
  onSaved: () => void;
  onRequested: (id: string) => void;
}

export function IntegrationModal({
  integration,
  open,
  onOpenChange,
  connected,
  webhookConfigured,
  requested,
  workspaceId,
  onSaved,
  onRequested,
}: IntegrationModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('form');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setPhase('form');
    setValues({});
    setEmail('');
  }, []);

  useEffect(() => {
    if (!open || !integration) return;
    resetForm();
    setLoading(true);

    const load = async () => {
      try {
        if (integration.configureMode === 'webhook' || integration.id === 'make') {
          const res = await fetch('/api/webhooks/outgoing');
          if (res.ok) {
            const data = (await res.json()) as { webhook_url?: string };
            if (data.webhook_url) {
              setValues((v) => ({ ...v, webhook_url: data.webhook_url ?? '' }));
            }
          }
        }
        if (integration.configureMode === 'api_key' || integration.id === 'make') {
          const res = await fetch(`/api/integrations/config?provider=${integration.id}`);
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
  }, [open, integration, resetForm]);

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

  async function handleSave() {
    if (!integration) return;
    const item = integration;

    setPhase('saving');

    const minDelay = new Promise((r) => setTimeout(r, 1600));

    try {
      if (isWebhook && item.id !== 'make') {
        const res = await fetch('/api/webhooks/outgoing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
      } else if (item.configureMode === 'api_key' || item.id === 'make') {
        const apiKey = values.api_key?.startsWith('••') ? undefined : values.api_key;
        const res = await fetch('/api/integrations/config', {
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
    const ws = workspaceId ? `?workspace_id=${workspaceId}` : '';
    window.location.href = `/api/integrations/hubspot/authorize${ws}`;
  }

  function handleDisconnect() {
    if (!integration) return;
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
      void fetch('/api/webhooks/outgoing', { method: 'DELETE' }).then(() => {
        toast.success('Webhook removed');
        onSaved();
        onOpenChange(false);
      });
      return;
    }
    void fetch(`/api/integrations/config?provider=${item.id}`, { method: 'DELETE' }).then(() => {
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/40">
              {integration.logo}
            </div>
            <div className="min-w-0 text-left">
              <SheetTitle className="text-base font-medium text-zinc-50">
                {integration.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                {isVote
                  ? 'Request early access'
                  : isOAuth
                    ? 'OAuth connection'
                    : 'Configure connection'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          {phase === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IntegrationConnectLottie />
              <p className="mt-4 text-sm font-medium text-zinc-300">Authenticating…</p>
              <p className="mt-1 text-xs text-zinc-600">Verifying credentials with {integration.name}</p>
            </div>
          )}

          {phase === 'success' && (
            <ConnectionSuccessState integration={integration} />
          )}

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

              {(isWebhook || integration.id === 'make') && integration.id !== 'zapier' && (
                <div className="mt-4 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Events
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

              {loading ? (
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
                  {isAlreadyConnected ? (
                    <>
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
                      Connect with {integration.name}
                    </Button>
                  )}
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

                  {isAlreadyConnected && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
