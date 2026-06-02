'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, Phone, ChevronRight, Users } from 'lucide-react';
import type { LeadRecord } from '@/components/dialer/LeadCard';

type LocalFilter = 'Queue' | ', 'Hot' | ', 'Callbacks';

interface UpNextQueueProps {
  leads: LeadRecord[];
  selectedLeadId: string | null;
  onSelectLead: (lead: LeadRecord) => void;
  onCallLead: (phone: string, lead: LeadRecord) => void;
}

function scoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-teal-400';
  if (score >= 50) return 'from-amber-500 to-orange-400';
  return 'from-slate-500 to-slate-600';
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function applyFilter(leads: LeadRecord[], filter: LocalFilter, search: string): LeadRecord[] {
  let list = [...leads];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.phone.includes(q),
    );
  }

  if (filter === 'Queue') {
    list = list.filter(
      (l) =>
        !l.dnc &&
        l.status !== 'do_not_call' &&
        (l.status === 'new' ||
          l.status === 'queued' ||
          (l.status === 'contacted' && (l.call_attempts ?? 0) < 3)),
    );
  } else if (filter === 'Hot') {
    list = list.filter(
      (l) =>
        l.status === 'callback' ||
        l.status === 'meeting_booked' ||
        l.status === 'connected' ||
        (l.tags ?? []).includes('hot'),
    );
  } else if (filter === 'Callbacks') {
    list = list.filter((l) => l.status === 'callback');
  }

  return list;
}

const TABS: { key: LocalFilter; label: string }[] = [
  { key: 'Queue', label: ', 'Queue' },
  { key: 'Hot', label: ', 'Hot' },
  { key: 'Callbacks', label: ', 'Callbacks' },
];

const staggerList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};
const cardTransition = { duration: 0.22, ease: 'easeOut' as const };

function CompactLeadCard({
  lead,
  selected,
  onSelect,
  onCall,
}: {
  lead: LeadRecord;
  selected: boolean;
  onSelect: () => void;
  onCall: () => void;
}) {
  return (
    <motion.div
      variants={cardAnim}
      whileHover={{ scale: 1.015 }}
      transition={cardTransition}
      onClick={onSelect}
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
        selected
          ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
          : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${scoreGradient(lead.ai_score)} text-xs font-bold text-white shadow-sm`}
      >
        {getInitials(lead.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white leading-tight">{lead.name}</p>
        <p className="truncate text-[11px] text-slate-500 leading-tight">
          {lead.company}
          {lead.phone ? ` · ${lead.phone.replace(/^\+1/')}` : ''}
        </p>
      </div>

      {/* Call button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onCall(); }}
        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-emerald-500/15"
        title={`Call ${lead.name}`}
      >
        <Phone className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export default function UpNextQueue({ leads, selectedLeadId, onSelectLead, onCallLead }: UpNextQueueProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<LocalFilter>('Queue');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => applyFilter(leads, filter, search), [leads, filter, search]);
  const top3 = filtered.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Up Next</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-400">
            {filtered.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/leads')}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/25"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              filter === key
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top 3 cards */}
      {top3.length > 0 ? (
        <motion.div
          key={`${filter}-${search}`}
          variants={staggerList}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2"
        >
          {top3.map((lead) => (
            <CompactLeadCard
              key={lead.id}
              lead={lead}
              selected={lead.id === selectedLeadId}
              onSelect={() => onSelectLead(lead)}
              onCall={() => onCallLead(lead.phone, lead)}
            />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-8 text-center">
          <Users className="mb-2 h-6 w-6 text-slate-600" />
          <p className="text-xs text-slate-500">No leads in this filter</p>
        </div>
      )}

      {filtered.length > 3 && (
        <button
          type="button"
          onClick={() => router.push('/leads')}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
        >
          View all {filtered.length} leads →
        </button>
      )}
    </div>
  );
}
