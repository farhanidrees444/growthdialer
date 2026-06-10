'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, UserPlus, LogIn } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

interface InviteDetails {
  email: string;
  role: Role;
  workspace_name: string;
}

type PageState = 'loading' | 'ready' | 'accepted' | 'error';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const session = useSupabaseSession();

  const [state, setState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);

  // Wait for session to resolve before fetching
  useEffect(() => {
    if (session !== undefined) setSessionResolved(true);
  }, [session]);

  // Fetch invite details once session is resolved
  useEffect(() => {
    if (!sessionResolved) return;
    void (async () => {
      try {
        const res = await fetch(`/api/invitations/${token}/accept`);
        const data = await res.json() as { email?: string; role?: string; workspace_name?: string; error?: string };
        if (!res.ok) {
          setErrorMsg(data.error ?? 'Invitation not found or expired');
          setState('error');
          return;
        }
        setInvite({ email: data.email!, role: data.role as Role, workspace_name: data.workspace_name! });
        setState('ready');
      } catch {
        setErrorMsg('Failed to load invitation');
        setState('error');
      }
    })();
  }, [token, sessionResolved]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' });
      const data = await res.json() as { ok?: boolean; workspace?: { id: string }; error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to accept invitation');
        setState('error');
        return;
      }
      if (data.workspace?.id) {
        try { localStorage.setItem('gd-current-workspace', data.workspace.id); } catch { /* ignore */ }
      }
      setState('accepted');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setErrorMsg('Unexpected error. Please try again.');
      setState('error');
    } finally {
      setAccepting(false);
    }
  }

  const isLoggedIn = !!session;
  const emailMismatch = isLoggedIn && invite && session!.user.email?.toLowerCase() !== invite.email.toLowerCase();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[oklch(0.05_0.005_285)]">
      {/* BG gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 opacity-[0.10] blur-3xl rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.64 0.21 293) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <BrandLogo showText width={148} height={32} className="mb-8 justify-center" />

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[oklch(0.09_0.006_285)] p-8 shadow-2xl">
          {/* Loading */}
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Loading invitation…</p>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-7 w-7 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Invitation unavailable</h2>
                <p className="mt-1 text-sm text-slate-400">{errorMsg}</p>
              </div>
              <Link
                href="/dashboard"
                className="mt-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Go to dashboard →
              </Link>
            </div>
          )}

          {/* Accepted */}
          {state === 'accepted' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10"
              >
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </motion.div>
              <div>
                <h2 className="text-lg font-bold text-white">Welcome to {invite?.workspace_name}!</h2>
                <p className="mt-1 text-sm text-slate-400">Redirecting you to the dashboard…</p>
              </div>
            </div>
          )}

          {/* Ready — invitation details + action */}
          {state === 'ready' && invite && (
            <>
              {/* Invite badge */}
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                <UserPlus className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Workspace Invitation
                </span>
              </div>

              <h1 className="mb-1 text-2xl font-bold text-white">
                Join{' '}
                <span className="text-emerald-400">{invite.workspace_name}</span>
              </h1>
              <p className="mb-6 text-sm text-slate-400">
                You've been invited to collaborate as a team member.
              </p>

              {/* Role card */}
              <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Your Role
                </p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold',
                    ROLE_COLORS[invite.role],
                  )}
                >
                  {ROLE_LABELS[invite.role]}
                </span>
                <p className="mt-2 text-[11px] text-slate-600">
                  Invitation sent to <span className="text-slate-400">{invite.email}</span>
                </p>
              </div>

              {/* Email mismatch warning */}
              {emailMismatch && (
                <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  <strong className="font-semibold">Wrong account.</strong> This invitation was sent
                  to <span className="font-medium">{invite.email}</span> but you're signed in as{' '}
                  <span className="font-medium">{session!.user.email}</span>. Please sign in with the correct email.
                </div>
              )}

              {/* Action: logged in */}
              {isLoggedIn && !emailMismatch && (
                <motion.button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  whileHover={!accepting ? { scale: 1.01 } : {}}
                  whileTap={!accepting ? { scale: 0.99 } : {}}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                  style={{ background: 'linear-gradient(135deg, #059669, #7C3AED)' }}
                >
                  {accepting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {accepting ? 'Joining…' : `Accept & Join ${invite.workspace_name}`}
                </motion.button>
              )}

              {/* Action: not logged in */}
              {!isLoggedIn && (
                <div className="space-y-3">
                  <p className="text-center text-xs text-slate-500">Sign in to accept this invitation</p>
                  <Link
                    href={`/login?redirect=/accept-invite/${token}`}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white shadow-xl transition"
                    style={{ background: 'linear-gradient(135deg, #059669, #7C3AED)' }}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in to Accept
                  </Link>
                  <Link
                    href={`/signup?redirect=/accept-invite/${token}&email=${encodeURIComponent(invite.email)}`}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.10] bg-white/[0.04] py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Link>
                </div>
              )}

              {/* Email mismatch: offer sign out */}
              {emailMismatch && (
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] py-3 text-sm font-medium text-white transition hover:bg-white/[0.07]"
                >
                  Sign out and use a different account
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Invitation expires in 7 days.{' '}
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-400 transition-colors">
            Go to dashboard
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
