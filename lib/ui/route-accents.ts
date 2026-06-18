export type RouteAccentId =
  | 'dashboard'
  | 'dialer'
  | 'sequences'
  | 'leads'
  | 'calls'
  | 'recordings'
  | 'analytics'
  | 'leaderboard'
  | 'coaching'
  | 'numbers'
  | 'integrations'
  | 'settings'
  | 'team'
  | 'default';

export interface RouteAccent {
  id: RouteAccentId;
  label: string;
  /** Tailwind text color for active icons */
  icon: string;
  /** Active nav pill surface */
  activePill: string;
  /** Left accent bar gradient (Tailwind from/to) */
  bar: string;
  /** Hover glow on nav items */
  hoverGlow: string;
  /** Mobile tab / header active text */
  activeText: string;
  /** Ambient shell variant */
  ambient: RouteAccentId;
}

export const ROUTE_ACCENTS: Record<RouteAccentId, RouteAccent> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'text-violet-400',
    activePill: 'border border-violet-500/20 bg-violet-500/[0.08] shadow-[0_0_24px_rgba(139,92,246,0.12)]',
    bar: 'from-violet-500 to-indigo-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(139,92,246,0.14)]',
    activeText: 'text-violet-300',
    ambient: 'dashboard',
  },
  dialer: {
    id: 'dialer',
    label: 'AI Dialer',
    icon: 'text-violet-400',
    activePill: 'border border-violet-500/25 bg-violet-500/[0.12] shadow-[0_0_28px_rgba(139,92,246,0.18)]',
    bar: 'from-violet-500 to-fuchsia-400',
    hoverGlow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.16)]',
    activeText: 'text-violet-300',
    ambient: 'dialer',
  },
  sequences: {
    id: 'sequences',
    label: 'Sequences',
    icon: 'text-cyan-400',
    activePill: 'border border-cyan-500/20 bg-cyan-500/[0.08] shadow-[0_0_24px_rgba(34,211,238,0.12)]',
    bar: 'from-cyan-500 to-violet-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(34,211,238,0.14)]',
    activeText: 'text-cyan-300',
    ambient: 'sequences',
  },
  leads: {
    id: 'leads',
    label: 'Leads',
    icon: 'text-emerald-400',
    activePill: 'border border-emerald-500/20 bg-emerald-500/[0.08] shadow-[0_0_24px_rgba(52,211,153,0.12)]',
    bar: 'from-emerald-500 to-teal-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(52,211,153,0.14)]',
    activeText: 'text-emerald-300',
    ambient: 'leads',
  },
  calls: {
    id: 'calls',
    label: 'Call Logs',
    icon: 'text-sky-400',
    activePill: 'border border-sky-500/20 bg-sky-500/[0.08] shadow-[0_0_24px_rgba(56,189,248,0.12)]',
    bar: 'from-sky-500 to-cyan-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(56,189,248,0.14)]',
    activeText: 'text-sky-300',
    ambient: 'calls',
  },
  recordings: {
    id: 'recordings',
    label: 'Recordings',
    icon: 'text-emerald-400',
    activePill: 'border border-emerald-500/22 bg-emerald-500/[0.1] shadow-[0_0_24px_rgba(52,211,153,0.14)]',
    bar: 'from-emerald-500 to-green-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(52,211,153,0.14)]',
    activeText: 'text-emerald-300',
    ambient: 'recordings',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    icon: 'text-indigo-400',
    activePill: 'border border-indigo-500/20 bg-indigo-500/[0.08] shadow-[0_0_24px_rgba(99,102,241,0.12)]',
    bar: 'from-indigo-500 to-violet-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(99,102,241,0.14)]',
    activeText: 'text-indigo-300',
    ambient: 'analytics',
  },
  leaderboard: {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: 'text-amber-400',
    activePill: 'border border-amber-500/20 bg-amber-500/[0.08] shadow-[0_0_24px_rgba(245,158,11,0.12)]',
    bar: 'from-amber-500 to-orange-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(245,158,11,0.14)]',
    activeText: 'text-amber-300',
    ambient: 'leaderboard',
  },
  coaching: {
    id: 'coaching',
    label: 'Coaching',
    icon: 'text-rose-400',
    activePill: 'border border-rose-500/20 bg-rose-500/[0.08] shadow-[0_0_24px_rgba(244,63,94,0.12)]',
    bar: 'from-rose-500 to-violet-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(244,63,94,0.14)]',
    activeText: 'text-rose-300',
    ambient: 'coaching',
  },
  numbers: {
    id: 'numbers',
    label: 'Numbers',
    icon: 'text-violet-400',
    activePill: 'border border-violet-500/18 bg-violet-500/[0.07] shadow-[0_0_22px_rgba(139,92,246,0.1)]',
    bar: 'from-violet-500 to-cyan-400',
    hoverGlow: 'hover:shadow-[0_0_16px_rgba(139,92,246,0.12)]',
    activeText: 'text-violet-300',
    ambient: 'numbers',
  },
  integrations: {
    id: 'integrations',
    label: 'Integrations',
    icon: 'text-cyan-400',
    activePill: 'border border-cyan-500/18 bg-cyan-500/[0.07] shadow-[0_0_22px_rgba(34,211,238,0.1)]',
    bar: 'from-cyan-500 to-emerald-400',
    hoverGlow: 'hover:shadow-[0_0_16px_rgba(34,211,238,0.12)]',
    activeText: 'text-cyan-300',
    ambient: 'integrations',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: 'text-zinc-400',
    activePill: 'border border-zinc-600/40 bg-zinc-800/50 shadow-[0_0_16px_rgba(255,255,255,0.04)]',
    bar: 'from-zinc-400 to-zinc-600',
    hoverGlow: 'hover:shadow-[0_0_14px_rgba(255,255,255,0.06)]',
    activeText: 'text-zinc-200',
    ambient: 'settings',
  },
  team: {
    id: 'team',
    label: 'Team',
    icon: 'text-emerald-400',
    activePill: 'border border-emerald-500/18 bg-emerald-500/[0.07] shadow-[0_0_22px_rgba(52,211,153,0.1)]',
    bar: 'from-emerald-500 to-cyan-400',
    hoverGlow: 'hover:shadow-[0_0_16px_rgba(52,211,153,0.12)]',
    activeText: 'text-emerald-300',
    ambient: 'team',
  },
  default: {
    id: 'default',
    label: 'GrowthDialer',
    icon: 'text-violet-400',
    activePill: 'border border-violet-500/20 bg-violet-500/[0.08] shadow-[0_0_24px_rgba(139,92,246,0.12)]',
    bar: 'from-violet-500 to-cyan-400',
    hoverGlow: 'hover:shadow-[0_0_18px_rgba(139,92,246,0.14)]',
    activeText: 'text-violet-300',
    ambient: 'dashboard',
  },
};

const NAV_ITEM_ACCENT: Record<string, RouteAccentId> = {
  dashboard: 'dashboard',
  dialer: 'dialer',
  sequences: 'sequences',
  leads: 'leads',
  calls: 'calls',
  inbound: 'calls',
  'call-logs': 'calls',
  recordings: 'recordings',
  analytics: 'analytics',
  leaderboard: 'leaderboard',
  coaching: 'coaching',
  numbers: 'numbers',
  integrations: 'integrations',
  settings: 'settings',
};

export function getNavItemAccent(itemId: string): RouteAccent {
  const key = NAV_ITEM_ACCENT[itemId] ?? 'default';
  return ROUTE_ACCENTS[key];
}

export function resolveRouteAccent(pathname: string): RouteAccent {
  if (pathname.startsWith('/dialer')) return ROUTE_ACCENTS.dialer;
  if (pathname.startsWith('/sequences')) return ROUTE_ACCENTS.sequences;
  if (pathname.startsWith('/leads')) return ROUTE_ACCENTS.leads;
  if (pathname.startsWith('/calls')) return ROUTE_ACCENTS.calls;
  if (pathname.startsWith('/live-floor')) return ROUTE_ACCENTS.calls;
  if (pathname.startsWith('/inbound')) return ROUTE_ACCENTS.calls;
  if (pathname.startsWith('/call-logs')) return ROUTE_ACCENTS.calls;
  if (pathname.startsWith('/recordings')) return ROUTE_ACCENTS.recordings;
  if (pathname.startsWith('/analytics')) return ROUTE_ACCENTS.analytics;
  if (pathname.startsWith('/leaderboard')) return ROUTE_ACCENTS.leaderboard;
  if (pathname.startsWith('/coaching')) return ROUTE_ACCENTS.coaching;
  if (pathname.startsWith('/numbers')) return ROUTE_ACCENTS.numbers;
  if (pathname.startsWith('/dashboard/integrations')) return ROUTE_ACCENTS.integrations;
  if (pathname.startsWith('/integrations')) return ROUTE_ACCENTS.integrations;
  if (pathname.startsWith('/team')) return ROUTE_ACCENTS.team;
  if (pathname.startsWith('/settings')) return ROUTE_ACCENTS.settings;
  if (pathname === '/dashboard') return ROUTE_ACCENTS.dashboard;
  return ROUTE_ACCENTS.default;
}

export function resolveMobileTabAccent(href: string): RouteAccent {
  if (href === '/dashboard') return ROUTE_ACCENTS.dashboard;
  if (href === '/dialer') return ROUTE_ACCENTS.dialer;
  if (href === '/leads') return ROUTE_ACCENTS.leads;
  if (href === '/analytics') return ROUTE_ACCENTS.analytics;
  return ROUTE_ACCENTS.default;
}
