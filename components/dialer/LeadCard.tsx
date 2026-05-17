import { motion } from 'framer-motion';
import type { DragEvent } from 'react';
import { Phone, Zap } from 'lucide-react';

type LeadStatus =
  | 'new'
  | 'queued'
  | 'contacted'
  | 'connected'
  | 'qualified'
  | 'meeting_booked'
  | 'no_answer'
  | 'busy'
  | 'wrong_number'
  | 'not_interested'
  | 'callback'
  | 'do_not_call';

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
  dnc?: boolean;
}

interface LeadCardProps {
  lead: LeadRecord;
  selected: boolean;
  onSelect: () => void;
  onCall: (phone: string, lead: LeadRecord) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  queued: 'Queued',
  contacted: 'Contacted',
  connected: 'Connected',
  qualified: 'Qualified',
  meeting_booked: 'Meeting Booked',
  no_answer: 'No Answer',
  busy: 'Busy',
  wrong_number: 'Wrong Number',
  not_interested: 'Not Interested',
  callback: 'Callback',
  do_not_call: 'Do Not Call',
};

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: 'bg-slate-700/60 text-slate-200',
  queued: 'bg-blue-500/15 text-blue-300',
  contacted: 'bg-amber-500/15 text-amber-300',
  connected: 'bg-emerald-500/15 text-emerald-300',
  qualified: 'bg-cyan-500/15 text-cyan-300',
  meeting_booked: 'bg-violet-500/15 text-violet-300',
  no_answer: 'bg-amber-500/15 text-amber-300',
  busy: 'bg-red-500/15 text-red-300',
  wrong_number: 'bg-rose-500/15 text-rose-300',
  not_interested: 'bg-slate-600/60 text-slate-300',
  callback: 'bg-cyan-500/15 text-cyan-300',
  do_not_call: 'bg-rose-900/50 text-rose-300',
};

export default function LeadCard({
  lead,
  selected,
  onSelect,
  onCall,
  onDragStart,
  onDrop,
  onDragOver,
}: LeadCardProps) {
  const scoreColor =
    lead.ai_score >= 80
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
      : lead.ai_score >= 50
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
      : 'bg-red-500/15 text-red-300 border-red-500/25';

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={(e) => onDragStart(e as unknown as DragEvent<HTMLDivElement>, lead.id)}
      onDrop={(e) => onDrop(e, lead.id)}
      onDragOver={onDragOver}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
        selected
          ? 'border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_20px_rgba(34,197,94,0.12)]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{lead.name}</p>
          <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-slate-500">
            {lead.title}
          </p>
          <p className="mt-1.5 truncate text-xs text-slate-300">{lead.company}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCall(lead.phone, lead);
          }}
          className="shrink-0 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2 text-emerald-400 transition-all duration-200 hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]"
          aria-label={`Call ${lead.name}`}
        >
          <Phone className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2.5 truncate text-xs text-slate-400">{lead.phone || 'No phone'}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${scoreColor}`}>
          AI {lead.ai_score}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            STATUS_COLOR[lead.status] ?? 'bg-slate-700/60 text-slate-300'
          }`}
        >
          {STATUS_LABEL[lead.status] ?? lead.status}
        </span>
        {lead.call_attempts > 0 && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
            <Zap className="h-3 w-3" />
            {lead.call_attempts}
          </span>
        )}
      </div>
    </motion.div>
  );
}
