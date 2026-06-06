'use client';

import { usePathname } from 'next/navigation';
import { Upload, Menu } from 'lucide-react';
import { UserMenu } from './user-menu';
import { useMobileNav } from '@/contexts/mobile-nav-context';
import { useLeads } from '@/contexts/leads-context';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':    { title: 'Dashboard',    subtitle: 'Overview' },
  '/dialer':       { title: 'AI Dialer',    subtitle: 'Outbound calling' },
  '/leads':        { title: 'Leads',        subtitle: 'Pipeline' },
  '/analytics':    { title: 'Analytics',    subtitle: 'Performance' },
  '/recordings':   { title: 'Recordings',   subtitle: 'Call library' },
  '/call-logs':    { title: 'Call Logs',    subtitle: 'Activity history' },
  '/numbers':      { title: 'My Numbers',   subtitle: 'Caller IDs' },
  '/integrations': { title: 'Integrations', subtitle: 'Connected apps' },
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

  const pageKey = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k)) ?? '/dashboard';
  const page = PAGE_TITLES[pageKey] ?? PAGE_TITLES['/dashboard'];
  const showImport = pathname.startsWith('/dashboard') || pathname.startsWith('/leads');

  return (
    <header className="sticky top-0 z-10 flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-zinc-800/50 bg-zinc-950/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle navigation"
          className="flex min-h-10 min-w-10 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-medium leading-tight text-zinc-100 sm:text-base">
            {page.title}
          </h1>
          <p className="hidden truncate text-xs text-zinc-500 sm:block">{page.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {showImport && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="hover-brand-glow flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-800/50 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-violet-500/30 hover:bg-zinc-800/80"
          >
            <Upload size={15} className="flex-shrink-0 text-zinc-400" />
            <span className="hidden sm:inline">Import leads</span>
          </button>
        )}

        <UserMenu placement="header" />
      </div>
    </header>
  );
}
