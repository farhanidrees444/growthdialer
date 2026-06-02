'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import type { Workspace } from '@/contexts/workspace-context';

const PLAN_OPTIONS = [
  {
    id: 'free',
    label: 'Free',
    price: '$0',
    period: '/mo',
    seats: '1 seat',
    features: ['1 agent', 'Power dialer'Call recordings', 'Basic analytics'],
    gradient: 'from-slate-600/20 to-slate-700/20',
    border: 'border-white/[0.08]',
    badge: null,
  },
  {
    id: 'pro',
    label: 'Pro',
    price: '$49',
    period: '/mo',
    seats: 'Up to 3 seats',
    features: ['3 agents', 'AI brief + coaching'Team analytics', 'Priority support'],
    gradient: 'from-violet-600/20 to-blue-600/20',
    border: 'border-violet-500/30',
    badge: 'Most Popular',
  },
  {
    id: 'team',
    label: 'Team',
    price: '$99',
    period: '/mo',
    seats: 'Up to 10 seats',
    features: ['10 agents', 'Full coaching suite'Workspace analytics', 'Custom integrations'],
    gradient: 'from-emerald-600/20 to-teal-600/20',
    border: 'border-emerald-500/30',
    badge: null,
  },
] as const;

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { refreshWorkspaces, setCurrentWorkspace } = useWorkspace();

  const [name, setName] = useState('');
  const [plan, setPlan] = useState<'free' | ', 'pro' | ', 'team'>(', 'free');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) { setError('Workspace name is required'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': ', 'application/json' },
        body: JSON.stringify({ name: name.trim(), plan }),
      });
      const data = await res.json() as { workspace?: Workspace; error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to create workspace'); return; }
      if (data.workspace) {
        await refreshWorkspaces();
        await setCurrentWorkspace(data.workspace);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[oklch(0.056_0.018_286)]">
      {/* BG gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 opacity-[0.12] blur-3xl rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.82 0.27 153) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #059669, hsl(262,80%,50%))'' }}>
              <Zap className="h-4.5 w-4.5 text-white" fill="white" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Growth<span className="text-emerald-400">Dialer</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Set up your workspace</h1>
          <p className="mt-2 text-slate-400">A workspace is where your team makes calls, shares leads, and coaches each other.</p>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-semibold text-slate-300">
            Workspace name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Acme Sales Team"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 transition"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        {/* Plan selector */}
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-slate-300">Choose plan</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLAN_OPTIONS.map((opt) => (
              <motion.button
                key={opt.id}
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setPlan(opt.id)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  plan === opt.id ? opt.border + ' bg-gradient-to-br ' + opt.gradient : ', 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]'
                }`}
              >
                {opt.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {opt.badge}
                  </span>
                )}
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-xl font-bold text-white">{opt.price}</span>
                  <span className="text-xs text-slate-500 mb-0.5">{opt.period}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-0.5">{opt.label}</p>
                <p className="text-xs text-slate-500 mb-3">{opt.seats}</p>
                <ul className="space-y-1">
                  {opt.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Create button */}
        <motion.button
          type="button"
          onClick={handleCreate}
          disabled={busy || !name.trim()}
          whileHover={!busy && name.trim() ? { scale: 1.01 } : {}}
          whileTap={!busy && name.trim() ? { scale: 0.99 } : {}}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition"
          style={{ background: 'linear-gradient(135deg, #059669, hsl(262,80%,50%))'' }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Creating…' : ', 'Create Workspace'}
        </motion.button>

        <p className="mt-4 text-center text-xs text-slate-600">
          You can change your plan or invite team members at any time.
        </p>
      </motion.div>
    </div>
  );
}
