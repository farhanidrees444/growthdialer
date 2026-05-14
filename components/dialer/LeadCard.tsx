import { motion } from 'framer-motion';
import type { DragEvent } from 'react';
import { Phone, ArrowRight, Zap } from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_booked' | 'no_answer' | 'busy' | 'wrong_number' | 'not_interested';

export interface LeadRecord {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email?: string;
  linkedin?: string;
  ai_score: number;
  status: LeadStatus;
  last_called_at?: string;
  call_attempts: number;
  tags?: string[];
  notes?: string;
  company_size?: string;
  industry?: string;
  revenue?: string;
  activity_summary?: string;
  profile_url?: string;
}

interface LeadCardProps {
  lead: LeadRecord;
  selected: boolean;
  onSelect: () => void;
  onCall: (phone: string) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
}

export default function LeadCard({ lead, selected, onSelect, onCall, onDragStart, onDrop, onDragOver }: LeadCardProps) {
  const scoreColor = lead.ai_score >= 80 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' : lead.ai_score >= 50 ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' : 'bg-red-500/15 text-red-300 border-red-500/20';
  const statusMap: Record<LeadStatus, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    meeting_booked: 'Meeting Booked',
    no_answer: 'No Answer',
    busy: 'Busy',
    wrong_number: 'Wrong Number',
    not_interested: 'Not Interested',
  };
  const statusColor = {
    new: 'bg-slate-700 text-slate-200',
    contacted: 'bg-emerald-500/15 text-emerald-300',
    qualified: 'bg-cyan-500/15 text-cyan-300',
    meeting_booked: 'bg-violet-500/15 text-violet-300',
    no_answer: 'bg-amber-500/15 text-amber-300',
    busy: 'bg-red-500/15 text-red-300',
    wrong_number: 'bg-rose-500/15 text-rose-300',
    not_interested: 'bg-slate-600 text-slate-200',
  }[lead.status];

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={(event) => onDragStart(event, lead.id)}
      onDrop={(event) => onDrop(event, lead.id)}
      onDragOver={onDragOver}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`group rounded-3xl border ${selected ? 'border-emerald-400/40 bg-slate-900/90 shadow-[0_0_25px_rgba(0,255,102,0.08)]' : 'border-white/10 bg-slate-950/70'} p-4 cursor-pointer transition-all duration-300`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{lead.name}</p>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{lead.title}</p>
          <p className="mt-2 text-sm text-slate-300">{lead.company}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCall(lead.phone);
          }}
          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/15"
          aria-label="Call lead"
        >
          <Phone className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2 text-sm text-slate-400">
        <span className="font-semibold text-slate-300">Phone</span>
        <span className="truncate text-slate-200">{lead.phone}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${scoreColor} border-current`}>AI {lead.ai_score}</span>
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusColor}`}>{statusMap[lead.status]}</span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
        <span>{lead.last_called_at ? `Called ${lead.last_called_at}` : 'Never called'}</span>
        <span className="flex items-center gap-1 text-slate-300"><Zap className="h-3.5 w-3.5" />{lead.call_attempts}</span>
      </div>
    </motion.div>
  );
}
