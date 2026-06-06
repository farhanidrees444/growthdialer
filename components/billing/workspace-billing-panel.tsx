'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Loader2, Sparkles, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { WORKSPACE_PLANS, type WorkspacePlanId } from '@/lib/billing/workspace-plans';
import { cn } from '@/lib/utils';

interface BillingPayload {
  workspace: {
    plan: string;
    max_seats: number;
    billing_status: string;
    stripe_subscription_id: string | null;
  };
  plan: { label: string; monthlyPrice: number | null; description: string };
  seats: { activeMembers: number; pendingInvites: number; totalUsed: number };
  canManageBilling: boolean;
}

const UPGRADE_PLANS: WorkspacePlanId[] = ['pro', 'team'];

export function WorkspaceBillingPanel() {
  const { currentWorkspace, refreshWorkspaces, can } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingPayload | null>(null);

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/billing`);
      if (res.ok) setBilling(await res.json() as BillingPayload);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => { void load(); }, [load]);

  async function startCheckout(plan: WorkspacePlanId) {
    if (!currentWorkspace) return;
    setBusy(plan);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not start checkout');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error('Checkout failed');
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    if (!currentWorkspace) return;
    setBusy('portal');
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/billing/portal`, {
        method: 'POST',
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not open billing portal');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error('Portal failed');
    } finally {
      setBusy(null);
    }
  }

  if (!currentWorkspace) {
    return <p className="text-sm text-white/25">No workspace selected</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing…
      </div>
    );
  }

  const currentPlan = (billing?.workspace.plan ?? currentWorkspace.plan) as WorkspacePlanId;
  const planDef = WORKSPACE_PLANS[currentPlan] ?? WORKSPACE_PLANS.free;
  const canManage = billing?.canManageBilling ?? can('MANAGE_BILLING');
  const seats = billing?.seats ?? { activeMembers: 1, pendingInvites: 0, totalUsed: 1 };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/10 via-transparent to-emerald-600/8 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current plan</p>
            <h3 className="mt-1 text-xl font-bold text-white">{planDef.label}</h3>
            <p className="mt-1 text-sm text-slate-400">{planDef.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {planDef.monthlyPrice === null ? 'Custom' : planDef.monthlyPrice === 0 ? '$0' : `$${planDef.monthlyPrice}`}
            </p>
            {planDef.monthlyPrice !== null && planDef.monthlyPrice > 0 && (
              <p className="text-xs text-slate-500">/ month · workspace</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>{seats.totalUsed} / {billing?.workspace.max_seats ?? currentWorkspace.max_seats} seats used</span>
          {billing?.workspace.billing_status && billing.workspace.billing_status !== 'active' && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300 capitalize">
              {billing.workspace.billing_status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {canManage && billing?.workspace.stripe_subscription_id && (
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={busy === 'portal'}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            {busy === 'portal' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Manage subscription
          </button>
        )}
      </div>

      {canManage && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Upgrade workspace</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {UPGRADE_PLANS.map((planId) => {
              const p = WORKSPACE_PLANS[planId];
              const isCurrent = currentPlan === planId;
              const Icon = planId === 'pro' ? Sparkles : Users;
              return (
                <div
                  key={planId}
                  className={cn(
                    'rounded-xl border p-4',
                    isCurrent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] bg-white/[0.02]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-violet-400" />
                    <p className="text-sm font-bold text-white">{p.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.max_seats} seats · ${p.monthlyPrice}/mo</p>
                  <button
                    type="button"
                    disabled={isCurrent || busy === planId}
                    onClick={() => void startCheckout(planId)}
                    className="mt-3 w-full rounded-lg border border-violet-500/30 bg-violet-500/10 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/15 disabled:opacity-40"
                  >
                    {busy === planId ? (
                      <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                    ) : isCurrent ? (
                      'Current plan'
                    ) : (
                      `Upgrade to ${p.label}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-600">
            14-day trial on paid plans. Seats and plan limits update automatically after checkout.
          </p>
        </div>
      )}

      {!canManage && (
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
          <p className="text-xs text-white/35 leading-relaxed">
            Only workspace owners can change billing. Ask your owner to upgrade if you need more seats.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => { void refreshWorkspaces(); void load(); }}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
      >
        <Zap className="h-3 w-3" /> Refresh plan status
      </button>
    </div>
  );
}
