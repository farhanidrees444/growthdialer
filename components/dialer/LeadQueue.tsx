import { motion } from 'framer-motion';
import { Search, Filter, Download } from 'lucide-react';
import LeadCard, { LeadRecord } from '@/components/dialer/LeadCard';

interface LeadQueueProps {
  leads: LeadRecord[];
  selectedLeadId: string | null;
  filterMode: 'Queue' | 'All Leads' | 'Hot Leads';
  onFilterChange: (mode: 'Queue' | 'All Leads' | 'Hot Leads') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectLead: (lead: LeadRecord) => void;
  onCallLead: (phone: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  leadCount: string;
}

export default function LeadQueue({ leads, selectedLeadId, filterMode, onFilterChange, searchValue, onSearchChange, onSelectLead, onCallLead, onReorder, leadCount }: LeadQueueProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
  };

  return (
    <aside className="flex h-full flex-col rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_50px_rgba(0,255,102,0.06)] backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(0,255,102,0.12)]">
          <Filter className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lead queue</p>
          <p className="text-lg font-semibold text-white">Queue & hot prospects</p>
        </div>
      </div>

      <div className="mb-4 rounded-3xl border border-white/10 bg-slate-900/80 p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search leads"
            className="w-full rounded-3xl border border-transparent bg-slate-950/90 py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:border-emerald-400/30 focus:ring-emerald-400/20"
          />
        </label>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 rounded-3xl border border-white/10 bg-slate-900/80 p-3 text-sm text-slate-300">
        {(['Queue', 'All Leads', 'Hot Leads'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`rounded-2xl px-3 py-2 transition ${filterMode === mode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            onClick={() => onFilterChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
        <span>{leadCount}</span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">Priority</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-2">
        {leads.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 p-6 text-center text-slate-500">
            No leads match the current filter.
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
              onDragOver={(event) => event.preventDefault()}
            />
          ))
        )}
      </div>

      <div className="mt-4 rounded-3xl border border-emerald-400/15 bg-slate-900/80 p-4 text-sm text-slate-300 shadow-[0_0_20px_rgba(0,255,102,0.06)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Leads</p>
            <p className="text-lg font-semibold text-white">{leadCount}</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-2 text-emerald-300 transition hover:bg-emerald-500/25">
            <Download className="h-4 w-4" /> Import leads
          </button>
        </div>
        <p className="text-xs text-slate-400">Drag leads to reprioritize and keep the hottest prospects ready.</p>
      </div>
    </aside>
  );
}
