'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Phone, Users, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/workspace-context';

const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Phone, label: 'Dialer', href: '/dialer' },
  { icon: Users, label: 'Leads', href: '/leads' },
] as const;

type MoreLink = {
  icon: typeof Building2;
  label: string;
  href: string;
  managerOnly?: boolean;
};

const MORE_LINKS: MoreLink[] = [
  { icon: Building2, label: 'Team', href: '/team' },
  { icon: ScrollText, label: 'Call Logs', href: '/call-logs' },
  { icon: PhoneIncoming, label: 'Inbound', href: '/settings?tab=calling' },
  { icon: Headphones, label: 'Recordings', href: '/recordings' },
  { icon: ListOrdered, label: 'Sequences', href: '/sequences' },
  { icon: BarChart2, label: 'Analytics', href: '/analytics' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', managerOnly: true },
  { icon: Hash, label: 'Numbers', href: '/numbers' },
  { icon: Headset, label: 'Coaching', href: '/coaching/live', managerOnly: true },
  { icon: Zap, label: 'Integrations', href: '/integrations' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { currentRole } = useWorkspace();
  const canCoach = currentRole && ['owner', 'admin', 'manager'].includes(currentRole);

  const moreActive = MORE_LINKS.some(
    (l) => !l.managerOnly || canCoach ? isActive(pathname, l.href) : false,
  );

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-white/[0.08] bg-[oklch(0.05_0.005_285)]/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Mobile navigation"
      >
        {PRIMARY_TABS.map(({ icon: Icon, label, href }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[var(--bottom-nav-height)] py-2 transition-colors',
                active ? 'text-[oklch(0.64_0.21_293)]' : 'text-slate-500 hover:text-slate-300',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[oklch(0.64_0.21_293)]" />
              )}
              <Icon className="h-5 w-5" aria-hidden />
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
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-white/[0.10] bg-[oklch(0.09_0.006_285)] shadow-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              role="dialog"
              aria-label="More navigation"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
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
              <div className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-3">
                {MORE_LINKS.map((item) => {
                  if (item.managerOnly && !canCoach) return null;
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-[oklch(0.64_0.21_293)]/15 text-[oklch(0.72_0.18_293)]'
                          : 'text-slate-300 hover:bg-white/[0.05] hover:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
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
