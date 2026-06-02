'use client';

import { usePathname } from 'next/navigation';
import { Upload, Sparkles, HelpCircle, Bell, Menu } from 'lucide-react';
import { UserMenu } from './user-menu';
import { useMobileNav } from '@/contexts/mobile-nav-context';
import { useLeads } from '@/contexts/leads-context';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':    { title: 'Dashboard',    subtitle: 'Your calling command center' },
  '/dialer':       { title: 'AI Dialer',    subtitle: 'Make calls, faster' },
  '/leads':        { title: 'Leads',        subtitle: 'Manage your pipeline' },
  '/analytics':    { title: 'Analytics',    subtitle: 'Performance insights' },
  '/recordings':   { title: 'Recordings',   subtitle: 'Calls with AI analysis' },
  '/numbers':      { title: 'My Numbers',   subtitle: 'Your calling identity' },
  '/integrations': { title: 'Integrations', subtitle: 'Connect your tools' },
  '/settings':     { title: 'Settings',     subtitle: 'Account & workspace' },
  '/team':         { title: 'Team',         subtitle: 'Workspace members' },
  '/coaching':     { title: 'Coaching',     subtitle: 'Real-time call coaching' },
  '/sequences':    { title: 'Sequences',    subtitle: 'Multi-step outreach cadences' },
};

export function TopHeader() {
  const pathname = usePathname();
  const { toggle } = useMobileNav();
  const { setImportOpen } = useLeads();

  const pageKey = Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) ?? '/dashboard';
  const page = PAGE_TITLES[pageKey] ?? PAGE_TITLES['/dashboard'];
  const showImport = pathname.startsWith('/dashboard') || pathname.startsWith('/leads');

  return (
    <header
      className="flex flex-shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8
                 h-16 border-b border-white/[0.06] sticky top-0 z-10
                 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02]
                 backdrop-blur-xl"
    >
      {/* Left: mobile hamburger + page title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle navigation"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl
                     text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-white sm:text-lg leading-tight">
            {page.title}
          </h1>
          <p className="hidden truncate text-xs text-white/40 sm:block">
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Right: action cluster */}
      <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">

        {/* Import leads — dashboard + leads only */}
        {showImport && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white
                       bg-gradient-to-r from-violet-600 to-cyan-500
                       hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
          >
            <Upload size={15} className="flex-shrink-0" />
            <span className="hidden sm:inline">Import leads</span>
          </button>
        )}

        {/* Ask AI — premium glassy pill, hidden on mobile */}
        <button
          type="button"
          aria-label="Ask AI"
          className="relative hidden sm:flex items-center gap-1.5 overflow-hidden rounded-xl
                     border border-violet-500/30 px-3 py-2 text-sm font-medium text-white
                     bg-gradient-to-r from-violet-600/15 to-cyan-500/15
                     hover:border-violet-400/50 transition-all group"
        >
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-r
                       from-violet-500/0 via-violet-500/10 to-cyan-500/0
                       opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden
          />
          <Sparkles size={15} className="relative text-violet-400" />
          <span className="relative">Ask AI</span>
        </button>

        {/* Help */}
        <button
          type="button"
          aria-label="Help"
          className="flex items-center gap-1.5 rounded-xl p-2 lg:px-3
                     text-white/55 hover:text-white/90 hover:bg-white/[0.06] transition-all"
        >
          <HelpCircle size={18} />
          <span className="hidden lg:inline text-sm">Help</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl p-2 text-white/55 hover:text-white/90
                     hover:bg-white/[0.06] transition-all"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden />
        </button>

        {/* Divider */}
        <span className="hidden sm:block w-px h-6 bg-white/[0.08] mx-0.5" aria-hidden />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
