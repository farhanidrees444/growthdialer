'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Brain, FileText, Hash, LayoutDashboard, Phone, Settings,
  Trophy, Upload, Users, Zap, Search, Mic, Radio,
  PhoneOff, MicOff, Pause, Play, Building2, UserPlus, Check,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useLeads } from '@/contexts/leads-context';
import { useOutboundCall } from '@/hooks/use-outbound-call';
import { useWebPhone } from '@/contexts/webphone-context';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/workspace-context';
import { navigateWithTransition, setLeadTransitionId } from '@/lib/ui/lead-transition';
import { cn } from '@/lib/utils';

interface AppCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeadHit {
  id: string;
  name: string;
  phone: string;
  company?: string | null;
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { href: '/dialer', label: 'AI Dialer', icon: Phone, keywords: 'dial call power' },
  { href: '/sequences', label: 'Sequences', icon: Zap, keywords: 'cadence outreach' },
  { href: '/leads', label: 'Leads', icon: Users, keywords: 'contacts prospects' },
  { href: '/call-logs', label: 'Call Logs', icon: FileText, keywords: 'history' },
  { href: '/recordings', label: 'Recordings', icon: Mic, keywords: 'audio playback' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, keywords: 'stats metrics' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, keywords: 'rank team' },
  { href: '/coaching', label: 'Coaching', icon: Brain, keywords: 'manager review' },
  { href: '/numbers', label: 'My Numbers', icon: Hash, keywords: 'phone caller id' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Radio, keywords: 'crm sync' },
  { href: '/settings', label: 'Settings', icon: Settings, keywords: 'preferences account' },
  { href: '/inbound', label: 'Inbound Calling', icon: Phone, keywords: 'inbound forward voicemail' },
];

export function AppCommandPalette({ open, onOpenChange }: AppCommandPaletteProps) {
  const router = useRouter();
  const { setImportOpen } = useLeads();
  const startOutboundCall = useOutboundCall();
  const { callStatus, isMuted, isOnHold, toggleMute, toggleHold, hangup } = useWebPhone();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const callLive = callStatus === 'active' || callStatus === 'held';
  const otherWorkspaces = workspaces.filter((w) => w.id !== workspaceId);
  const [query, setQuery] = useState('');
  const [leadHits, setLeadHits] = useState<LeadHit[]>([]);
  const [searching, setSearching] = useState(false);

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      setQuery('');
      fn();
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setLeadHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !workspaceId || query.trim().length < 2) {
      setLeadHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createClient();
        const q = query.trim();
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, company')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%,company.ilike.%${q}%`)
          .limit(8);
        if (!cancelled) setLeadHits((data ?? []) as LeadHit[]);
      } catch {
        if (!cancelled) setLeadHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, workspaceId]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.includes(q) ||
        item.href.includes(q),
    );
  }, [query]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search pages, leads, and actions"
      className={cn(
        'max-w-xl border border-white/[0.10] bg-[oklch(0.085_0.006_285)]/98 p-0 shadow-2xl shadow-black/60 backdrop-blur-2xl',
      )}
    >
      <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        placeholder="Search pages, leads, actions…"
        value={query}
        onValueChange={setQuery}
        className="text-white placeholder:text-white/30"
      />
      <CommandList className="max-h-[min(60vh,420px)]">
        <CommandEmpty>
          {searching ? 'Searching…' : 'No results — try a lead name or page.'}
        </CommandEmpty>

        {callLive && (
          <>
            <CommandGroup heading="On this call">
              <CommandItem
                onSelect={() => run(() => toggleMute())}
                className="gap-2 aria-selected:bg-white/[0.06]"
              >
                {isMuted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4 text-emerald-400" />}
                {isMuted ? 'Unmute' : 'Mute'}
                <CommandShortcut>M</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => toggleHold())}
                className="gap-2 aria-selected:bg-white/[0.06]"
              >
                {isOnHold ? <Play className="h-4 w-4 text-emerald-400" /> : <Pause className="h-4 w-4 text-amber-400" />}
                {isOnHold ? 'Resume call' : 'Hold call'}
                <CommandShortcut>H</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => hangup())}
                className="gap-2 aria-selected:bg-white/[0.06]"
              >
                <PhoneOff className="h-4 w-4 text-red-400" />
                End call
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="bg-white/[0.06]" />
          </>
        )}

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => router.push('/dialer'))}
            className="gap-2 aria-selected:bg-white/[0.06]"
          >
            <Phone className="h-4 w-4 text-[#06B6D4]" />
            Start power dial
            <CommandShortcut>P on dialer</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => setImportOpen(true))}
            className="gap-2 aria-selected:bg-white/[0.06]"
          >
            <Upload className="h-4 w-4 text-[#8B5CF6]" />
            Import leads
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => router.push('/numbers'))}
            className="gap-2 aria-selected:bg-white/[0.06]"
          >
            <Hash className="h-4 w-4 text-emerald-400" />
            Buy a number
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => router.push('/team'))}
            className="gap-2 aria-selected:bg-white/[0.06]"
          >
            <UserPlus className="h-4 w-4 text-[#06B6D4]" />
            Invite teammate
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => window.dispatchEvent(new CustomEvent('gd:open-shortcuts')))}
            className="gap-2 aria-selected:bg-white/[0.06]"
          >
            <Search className="h-4 w-4 text-slate-400" />
            Keyboard shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {leadHits.length > 0 && (
          <>
            <CommandSeparator className="bg-white/[0.06]" />
            <CommandGroup heading="Leads">
              {leadHits.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.name} ${lead.phone} ${lead.company ?? ''}`}
                  onSelect={() =>
                    run(() => {
                      setLeadTransitionId(lead.id);
                      navigateWithTransition(router, `/leads/${lead.id}`);
                    })
                  }
                  className="gap-2 aria-selected:bg-white/[0.06]"
                >
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span className="flex-1 truncate">{lead.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{lead.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {otherWorkspaces.length > 0 && (
          <>
            <CommandSeparator className="bg-white/[0.06]" />
            <CommandGroup heading="Switch workspace">
              {workspaces.map((ws) => (
                <CommandItem
                  key={ws.id}
                  value={`workspace ${ws.name}`}
                  onSelect={() => run(() => { void setCurrentWorkspace(ws); })}
                  className="gap-2 aria-selected:bg-white/[0.06]"
                >
                  <Building2 className="h-4 w-4 text-[#8B5CF6]" />
                  <span className="flex-1 truncate">{ws.name}</span>
                  {ws.id === workspaceId && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator className="bg-white/[0.06]" />
        <CommandGroup heading="Navigate">
          {filteredNav.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => run(() => router.push(item.href))}
              className="gap-2 aria-selected:bg-white/[0.06]"
            >
              <item.icon className="h-4 w-4 text-[#8B5CF6]" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {leadHits.length > 0 && (
          <>
            <CommandSeparator className="bg-white/[0.06]" />
            <CommandGroup heading="Call lead">
              {leadHits.slice(0, 4).map((lead) => (
                <CommandItem
                  key={`call-${lead.id}`}
                  onSelect={() =>
                    run(() => {
                      startOutboundCall(lead.phone, {
                        id: lead.id,
                        name: lead.name,
                        company: lead.company ?? '',
                        phone: lead.phone,
                        title: '',
                        ai_score: 0,
                        status: 'new',
                        call_attempts: 0,
                      });
                      router.push('/dialer');
                    })
                  }
                  className="gap-2 aria-selected:bg-white/[0.06]"
                >
                  <Phone className="h-4 w-4 text-[#06B6D4]" />
                  Call {lead.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
