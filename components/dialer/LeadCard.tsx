import { motion } from 'framer-motion';
import type { DragEvent } from 'react';
import { Phone } from 'lucide-react';
import TimezonePill from '@/components/dialer/TimezonePill';

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

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getAvatarGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-teal-500';
  if (score >= 50) return 'from-amber-500 to-orange-500';
  return 'from-slate-500 to-slate-600';
}

function getBadge(lead: LeadRecord): { label: string; dotColor: string; textColor: string } {
  if (lead.dnc || lead.status === 'do_not_call') {
    return { label: 'DNC', dotColor: 'bg-red-400', textColor: 'text-red-400' };
  }
  if (lead.status === 'meeting_booked') {
    return { label: 'Meeting', dotColor: 'bg-violet-400', textColor: 'text-violet-400' };
  }
  if (
    lead.status === 'not_interested' ||
    lead.status === 'wrong_number' ||
    lead.status === 'busy' ||
    lead.status === 'no_answer'
  ) {
    return { label: 'Done', dotColor: 'bg-slate-500', textColor: 'text-slate-500' };
  }
  if (lead.status === 'callback') {
    return { label: 'Callback', dotColor: 'bg-blue-400', textColor: 'text-blue-400' };
  }
  if (lead.status === 'connected' || lead.status === 'qualified') {
    return { label: 'Interested', dotColor: 'bg-emerald-400', textColor: 'text-emerald-400' };
  }
  if ((lead.call_attempts ?? 0) > 0) {
    return { label: 'Attempted', dotColor: 'bg-amber-400', textColor: 'text-amber-400' };
  }
  return { label: 'New', dotColor: 'bg-emerald-400', textColor: 'text-emerald-400' };
}

export default function LeadCard({
  lead,
  selected,
  onSelect,
  onCall,
  onDragStart,
  onDrop,
  onDragOver,
}: LeadCardProps) {
  const initials = getInitials(lead.name);
  const gradient = getAvatarGradient(lead.ai_score);
  const badge = getBadge(lead);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={(e) => onDragStart(e as unknown as DragEvent<HTMLDivElement>, lead.id)}
      onDrop={(e) => onDrop(e, lead.id)}
      onDragOver={onDragOver}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl border p-3 transition-all duration-200 ${
        selected
          ? 'border-emerald-500/40 bg-emerald-500/[0.07] shadow-[0_0_16px_rgba(34,197,94,0.12)]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-white/[0.04] hover:shadow-[0_4px_16px_rgba(34,197,94,0.06)]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-[11px] font-bold text-white shadow-sm`}
        >
          {initials}
        </div>

        {/* Name + company */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-white">{lead.name}</p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-500">
            {[lead.company, lead.title].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Call button — visible on hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCall(lead.phone, lead);
          }}
          className="shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-1.5 text-emerald-400 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:border-emerald-400/40 hover:bg-emerald-500/15"
          aria-label={`Call ${lead.name}`}
        >
          <Phone className="h-3 w-3" />
        </button>
      </div>

      {/* Phone + status badge */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-emerald-400/70">{lead.phone || '—'}</span>
          {lead.phone && <TimezonePill phone={lead.phone} />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
          <span className={`text-[10px] font-semibold ${badge.textColor}`}>{badge.label}</span>
          {(lead.call_attempts ?? 0) > 0 && (
            <span className="text-[10px] text-slate-600"> · {lead.call_attempts}×</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
