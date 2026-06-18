'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Phone,
  Users,
  MoreHorizontal,
  Headphones,
  Settings,
  Building2,
  BarChart2,
  Hash,
  Zap,
  Headset,
  ListOrdered,
  Trophy,
  ScrollText,
  PhoneIncoming,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/workspace-context';
import { resolveMobileTabAccent, resolveRouteAccent } from '@/lib/ui/route-accents';

const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Phone, label: 'Dialer', href: '/dialer' },
  { icon: Users, label: 'Leads', href: '/leads' },
  { icon: BarChart2, label: 'Analytics', href: '/analytics' },
] as const;

type MoreLink = {
  icon: LucideIcon;
  label: string;
  href: string;
  managerOnly?: boolean;
};

type MoreSection = {
  title: string;
  links: MoreLink[];
};

const MORE_SECTIONS: MoreSection[] = [
  {
    title: 'Engage',
    links: [
      { icon: ListOrdered, label: 'Sequences', href: '/sequences' },
      { icon: PhoneIncoming, label: 'Incoming', href: '/incoming' },
    ],
  },
  {
    title: 'Intelligence',
    links: [
      { icon: ScrollText, label: 'Call Logs', href: '/call-logs' },
      { icon: Headphones, label: 'Recordings', href: '/recordings' },
    ],
  },
  {
    title: 'Team',
    links: [
      { icon: Building2, label: 'Team', href: '/team' },
      { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', managerOnly: true },
      { icon: Headset, label: 'Coaching', href: '/coaching/live', managerOnly: true },
    ],
  },
  {
    title: 'Setup',
    links: [
      { icon: Hash, label: 'Numbers', href: '/numbers' },
      { icon: Zap, label: 'Integrations', href: '/dashboard/integrations' },
      { icon: Settings, label: 'Settings', href: '/settings' },
    ],
  },
];

const ALL_MORE_LINKS = MORE_SECTIONS.flatMap((section) => section.links);

function isPrimaryActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMoreLinkActive(pathname: string, searchParams: URLSearchParams, href: string) {
  if (href.includes('?')) {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    const expected = new URLSearchParams(query);
    for (const [key, val] of expected.entries()) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  }

  if (href === '/settings') {
    if (pathname !== '/settings' && !pathname.startsWith('/settings/')) return false;
    return searchParams.get('tab') !== 'calling';
  }

  if (href === '/dashboard') return pathname === '/dashboard';

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const { currentRole } = useWorkspace();
  const canCoach = currentRole && ['owner', 'admin', 'manager'].includes(currentRole);

  const moreActive = ALL_MORE_LINKS.some(
    (link) => (!link.managerOnly || canCoach) && isMoreLinkActive(pathname, searchParams, link.href),
  );

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-white/[0.08] bg-[oklch(0.05_0.005_285)]/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Mobile navigation"
      >
        {PRIMARY_TABS.map(({ icon: Icon, label, href }) => {
          const active = isPrimaryActive(pathname, href);
          const accent = resolveMobileTabAccent(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[var(--bottom-nav-height)] py-2 transition-all duration-200',
                active ? accent.activeText : 'text-slate-500 hover:text-slate-300',
                active && 'drop-shadow-[0_0_8px_rgba(139,92,246,0.25)]',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  className={cn(
                    'absolute top-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-gradient-to-r',
                    accent.bar,
                  )}
                />
              )}
              <Icon className={cn('h-5 w-5', active && accent.icon)} aria-hidden />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[var(--bottom-nav-height)] py-2 transition-colors',
            moreActive ? 'text-[oklch(0.64_0.21_293)]' : 'text-slate-500 hover:text-slate-300',
          )}
          aria-label="More navigation"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
          <span className="text-[11px] font-medium">More</span>
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[min(80vh,640px)] overflow-y-auto rounded-t-2xl border-t border-white/[0.10] bg-[oklch(0.09_0.006_285)] shadow-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              role="dialog"
              aria-label="More navigation"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[oklch(0.09_0.006_285)] px-5 py-4">
                <span className="text-sm font-semibold text-white">Navigate</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-3">
                {MORE_SECTIONS.map((section) => {
                  const visibleLinks = section.links.filter((link) => !link.managerOnly || canCoach);
                  if (visibleLinks.length === 0) return null;

                  return (
                    <div key={section.title}>
                      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                        {section.title}
                      </p>
                      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                        {visibleLinks.map((item) => {
                          const active = isMoreLinkActive(pathname, searchParams, item.href);
                          const accent = resolveRouteAccent(item.href.split('?')[0]);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMoreOpen(false)}
                              className={cn(
                                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                                active
                                  ? cn(accent.activePill, accent.activeText)
                                  : 'text-slate-300 hover:bg-white/[0.05] hover:text-white',
                              )}
                            >
                              <Icon className={cn('h-4 w-4 shrink-0', active && accent.icon)} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
