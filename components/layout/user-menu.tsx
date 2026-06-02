'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { useWorkspace } from '@/contexts/workspace-context';
import { ROLE_LABELS } from '@/lib/auth/permissions';

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const session = useSupabaseSession();
  const { currentRole } = useWorkspace();

  const displayName = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? 'User';
  const email = session?.user?.email ?? '';
  const roleLabel = currentRole ? ROLE_LABELS[currentRole] : 'Agent';
  const avatarInitials = getInitials(displayName);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl p-1 sm:pr-2 transition-colors hover:bg-white/[0.06]"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(186,100%,42%))' }}
        >
          {avatarInitials}
        </div>
        <ChevronDown
          className={`hidden sm:block h-3.5 w-3.5 text-white/40 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 z-50 w-64 overflow-hidden rounded-2xl border border-white/[0.10] bg-black/95 shadow-2xl shadow-black/60 backdrop-blur-2xl"
          >
            {/* User info header */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(186,100%,42%))' }}
              >
                {avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                {email && email !== displayName
                  ? <p className="truncate text-xs text-white/40">{email}</p>
                  : <p className="text-xs text-white/40">{roleLabel}</p>}
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/[0.08]"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
