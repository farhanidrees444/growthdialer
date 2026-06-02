import { motion } from 'framer-motion';
import { Search, Users, SkipForward } from 'lucide-react';
import LeadCard, { LeadRecord } from '@/components/dialer/LeadCard';

interface LeadQueueProps {
  leads: LeadRecord[];
  selectedLeadId: string | null;
  filterMode: 'Queue' | ', 'All Leads' | ', 'Hot Leads';
  onFilterChange: (mode: 'Queue' | ', 'All Leads' | ', 'Hot Leads') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectLead: (lead: LeadRecord) => void;
  onCallLead: (phone: string, lead: LeadRecord) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onSkipNext: () => void;
  tabCounts: { queue: number; all: number; hot: number };
}

const TABS: {
  key: 'Queue' | ', 'All Leads' | ', 'Hot Leads';
  label: string;
  countKey: 'queue' | 'all' | 'hot';
}[] = [
  { key: 'Queue', label: ', 'Queue', countKey: 'queue' },
  { key: 'All Leads', label: ', 'All', countKey: 'all' },
  { key: 'Hot Leads', label: ', 'Hot', countKey: 'hot' },
];

export default function LeadQueue({
  leads,
  selectedLeadId,
  filterMode,
  onFilterChange,
  searchValue,
  onSearchChange,
  onSelectLead,
  onCallLead,
  onReorder,
  onSkipNext,
  tabCounts,
}: LeadQueueProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetId) onReorder(draggedId, targetId);
  };

  return (
    <aside className="flex h-full flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Lead Queue</p>
            <p className="text-xs font-semibold text-white">{leads.length} leads</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSkipNext}
          title="Skip to next lead"
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-300"
        >
          <SkipForward className="h-3 w-3" />
          Skip
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads…"
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.05]"
        />
        {searchValue && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
            {leads.length} results
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
        {TABS.map(({ key, label, countKey }) => (
          <button
            key={key}
            type="button"
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
              filterMode === key
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => onFilterChange(key)}
          >
            <span>{label}</span>
            {tabCounts[countKey] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                  filterMode === key
                    ? 'bg-emerald-500/25 text-emerald-300'
                    : 'bg-white/[0.06] text-slate-500'
                }`}
              >
                {tabCounts[countKey]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="rounded-xl border border-dashed border-white/[0.06] px-6 py-5">
              <p className="text-xs font-medium text-slate-500">No leads match filter</p>
              {searchValue && (
                <p className="mt-1 text-[10px] text-slate-600">Try clearing the search</p>
              )}
            </div>
          </div>
        ) : (
          leads.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.5) }}
            >
              <LeadCard
                lead={lead}
                selected={lead.id === selectedLeadId}
                onSelect={() => onSelectLead(lead)}
                onCall={onCallLead}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              />
            </motion.div>
          ))
        )}
      </div>
    </aside>
  );
}
