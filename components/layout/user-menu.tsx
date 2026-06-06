'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/lib/supabase/hooks';
import { useWorkspace } from '@/contexts/workspace-context';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserMenuProps {
  /** header = compact in top bar; sidebar = full-width footer profile */
  placement?: 'header' | 'sidebar';
  collapsed?: boolean;
}

export function UserMenu({ placement = 'header', collapsed = false }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    right?: number;
    left?: number;
    width?: number;
    bottom?: number;
  }>({ top: 64, right: 16 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const session = useSupabaseSession();
  const { currentRole } = useWorkspace();

  const displayName = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? 'User';
  const email = session?.user?.email ?? '';
  const roleLabel = currentRole ? ROLE_LABELS[currentRole] : 'Agent';
  const avatarInitials = getInitials(displayName);
  const isSidebar = placement === 'sidebar';

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      if (isSidebar) {
        setCoords({
          bottom: window.innerHeight - r.top + 8,
          left: r.left,
          width: r.width,
        });
      } else {
        setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right });
      }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, isSidebar]);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const dropdownStyle = isSidebar
    ? {
        position: 'fixed' as const,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
      }
    : {
        position: 'fixed' as const,
        top: coords.top,
        right: coords.right,
      };

  return (
    <div className={cn('relative', isSidebar && 'w-full')}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className={cn(
          'transition-colors',
          isSidebar
            ? cn(
                'flex w-full items-center gap-2.5 rounded-lg border border-zinc-800/50 px-2.5 py-2 text-left hover:bg-zinc-800/30',
                collapsed && 'justify-center px-2',
              )
            : 'flex items-center gap-1.5 rounded-lg p-1 sm:pr-2 hover:bg-zinc-800/40',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-medium text-zinc-100">
          {avatarInitials}
        </div>
        {isSidebar && !collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
            <p className="truncate text-[11px] text-zinc-500">{roleLabel}</p>
          </div>
        )}
        {!isSidebar && (
          <ChevronDown
            className={cn(
              'hidden h-3.5 w-3.5 text-zinc-500 transition-transform duration-150 sm:block',
              open && 'rotate-180',
            )}
          />
        )}
        {isSidebar && !collapsed && (
          <ChevronDown
            className={cn('h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform', open && 'rotate-180')}
          />
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-[90]" aria-hidden onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: isSidebar ? 6 : -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: isSidebar ? 6 : -6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  style={dropdownStyle}
                  className={cn(
                    'z-[100] overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900 shadow-xl shadow-black/40 backdrop-blur-md',
                    isSidebar ? 'w-56' : 'w-64',
                  )}
                >
                  <div className="flex items-center gap-3 border-b border-zinc-800/50 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-sm font-medium text-zinc-100">
                      {avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {email && email !== displayName ? email : roleLabel}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-400/90 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
