import { motion } from 'framer-motion';
import { Search, Filter, SkipForward } from 'lucide-react';
import LeadCard, { LeadRecord } from '@/components/dialer/LeadCard';

interface LeadQueueProps {
  leads: LeadRecord[];
  selectedLeadId: string | null;
  filterMode: 'Queue' | 'All Leads' | 'Hot Leads';
  onFilterChange: (mode: 'Queue' | 'All Leads' | 'Hot Leads') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectLead: (lead: LeadRecord) => void;
  onCallLead: (phone: string, lead: LeadRecord) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onSkipNext: () => void;
  leadCount: string;
}

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
  leadCount,
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
            <Filter className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Lead Queue</p>
            <p className="text-xs font-semibold text-white">{leadCount} leads</p>
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
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
        {(['Queue', 'All Leads', 'Hot Leads'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
              filterMode === mode
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => onFilterChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] p-6 text-center">
            <p className="text-xs text-slate-600">No leads match filter.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selected={lead.id === selectedLeadId}
              onSelect={() => onSelectLead(lead)}
              onCall={onCallLead}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            />
          ))
        )}
      </div>
    </aside>
  );
}
