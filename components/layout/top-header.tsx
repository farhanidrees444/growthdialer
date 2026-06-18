'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Gift, HelpCircle, Menu, Search, Sparkles, Upload } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { LeadSearchDialog } from '@/components/LeadSearchDialog';
import { UserMenu } from './user-menu';
import { useMobileNav } from '@/contexts/mobile-nav-context';
import { useLeads } from '@/contexts/leads-context';
import { resolveRouteAccent } from '@/lib/ui/route-accents';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':    { title: 'Dashboard',    subtitle: 'Overview' },
  '/dialer':       { title: 'AI Dialer',    subtitle: 'Outbound calling' },
  '/leads':        { title: 'Leads',        subtitle: 'Pipeline' },
  '/analytics':    { title: 'Analytics',    subtitle: 'Performance' },
  '/recordings':   { title: 'Recordings',   subtitle: 'Call library' },
  '/call-logs':    { title: 'Call Logs',    subtitle: 'Activity history' },
  '/numbers':      { title: 'My Numbers',   subtitle: 'Caller IDs' },
  '/dashboard/integrations': { title: 'Integrations', subtitle: 'Connected apps' },
  '/settings':     { title: 'Settings',     subtitle: 'Workspace' },
  '/team':         { title: 'Team',         subtitle: 'Members' },
  '/coaching':     { title: 'Coaching',     subtitle: 'Live sessions' },
  '/sequences':    { title: 'Sequences',    subtitle: 'Cadences' },
  '/leaderboard':  { title: 'Leaderboard',  subtitle: 'Rankings' },
};

export function TopHeader() {
  const pathname = usePathname();
  const { toggle } = useMobileNav();
  const { setImportOpen } = useLeads();
  const [searchOpen, setSearchOpen] = useState(false);
  const reduce = useReducedMotion();
  const accent = resolveRouteAccent(pathname);

  const pageKey = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k)) ?? '/dashboard';
  const page = PAGE_TITLES[pageKey] ?? PAGE_TITLES['/dashboard'];
  const showImport = pathname.startsWith('/dashboard') || pathname.startsWith('/leads');

  return (
    <>
      <LeadSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <header className="relative z-30 flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-zinc-800/60 bg-zinc-950/[0.92] px-2 shadow-[0_1px_0_rgba(255,255,255,0.03),0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo
            href="/dashboard"
            showText
            size="sm"
            variant="icon-dark"
            framed
            priority
            className="hidden shrink-0 sm:inline-flex"
          />
          <BrandLogo
            href="/dashboard"
            size="xs"
            variant="icon-dark"
            framed
            priority
            className="shrink-0 sm:hidden"
          />
          <div className="hidden h-7 w-px bg-zinc-800/80 lg:block" aria-hidden />

          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle navigation"
            className="flex min-h-10 min-w-10 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100 lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="relative min-w-0">
            <h1 className="truncate text-[15px] font-medium leading-tight text-zinc-100 sm:text-base">
              {page.title}
            </h1>
            <p className="hidden truncate text-xs text-zinc-500 sm:block">{page.subtitle}</p>
            {!reduce && (
              <motion.div
                key={accent.id}
                aria-hidden
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={cn('mt-1.5 hidden h-px w-10 bg-gradient-to-r sm:block', accent.bar)}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
        {showImport && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="hover-brand-glow hidden min-h-9 items-center gap-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:border-violet-500/30 hover:bg-zinc-800/80 sm:flex"
          >
            <Upload size={15} className="flex-shrink-0 text-zinc-400" />
            <span className="hidden sm:inline">Import leads</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden min-h-9 items-center gap-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/55 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100 md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>

        <button
          type="button"
          className="group relative flex min-h-9 items-center gap-1.5 overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-600/20 via-fuchsia-500/10 to-cyan-500/15 px-3 py-2 text-xs font-semibold text-white/85 shadow-[0_0_28px_rgba(124,58,237,0.14)] transition-all hover:border-violet-400/50 hover:text-white"
          aria-label="Ask AI"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-white/15 opacity-0 blur-sm transition-all duration-500 group-hover:left-full group-hover:opacity-100" />
          <Sparkles className="relative h-3.5 w-3.5 text-violet-300" />
          <span className="relative hidden sm:inline">Ask AI</span>
        </button>

        <button
          type="button"
          className="hidden min-h-9 min-w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 sm:flex"
          aria-label="Rewards"
        >
          <Gift className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="hidden min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 md:flex"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden text-xs font-medium xl:inline">Help</span>
        </button>

        <button
          type="button"
          className="relative flex min-h-9 min-w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
        </button>

        <div className="ml-0.5 flex min-h-9 items-center rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-0.5">
          <UserMenu placement="header" />
        </div>
        </div>
      </header>
    </>
  );
}
