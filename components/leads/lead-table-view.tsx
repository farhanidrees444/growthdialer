'use client';

import { Phone, Mail, ExternalLink, MoreHorizontal, Clock, Pencil, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TableLead {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  status: string;
  tags: string[] | null;
  call_attempts: number | null;
  last_called_at: string | null;
  linkedin: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:            { bg: 'bg-slate-500/15',   text: ', 'text-slate-300' },
  queued:         { bg: 'bg-blue-500/15',    text: ', 'text-blue-300' },
  contacted:      { bg: 'bg-amber-500/15',   text: ', 'text-amber-300' },
  connected:      { bg: 'bg-emerald-500/15', text: ', 'text-emerald-300' },
  callback:       { bg: 'bg-amber-500/15',   text: ', 'text-amber-300' },
  meeting_booked: { bg: 'bg-violet-500/15',  text: ', 'text-violet-300' },
  not_interested: { bg: 'bg-red-500/15',     text: ', 'text-red-400' },
  do_not_call:    { bg: 'bg-rose-900/40',    text: ', 'text-rose-400' },
  wrong_number:   { bg: 'bg-red-500/15',     text: ', 'text-red-400' },
};

function formatRelative(iso: string | null) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: ', 'short', day: ', 'numeric' });
}

function RowMenu({ lead, onCall, onView, onEdit, onDelete }: {
  lead: TableLead;
  onCall: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 hover:text-white hover:border-white/10 transition"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-8 z-50 min-w-[140px] rounded-xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)] py-1 shadow-2xl"
          >
            {[
              { icon: <Phone className="h-3.5 w-3.5" />, label: 'Call', onClick: onCall, className: ', 'text-emerald-400' },
              { icon: <Eye className="h-3.5 w-3.5" />, label: 'View', onClick: onView },
              { icon: <Pencil className="h-3.5 w-3.5" />, label: 'Edit', onClick: onEdit },
              { icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Delete', onClick: onDelete, className: ', 'text-red-400 hover:bg-red-500/10' },
            ].map(({ icon, label, onClick, className }) => (
              <button
                key={label}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onClick(); }}
                className={cn('flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-300 hover:bg-white/[0.05] transition', className)}
              >
                {icon}
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  leads: TableLead[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  onCall: (lead: TableLead) => void;
  onView: (lead: TableLead) => void;
  onEdit: (lead: TableLead) => void;
  onDelete: (lead: TableLead) => void;
}

export function LeadTableView({
  leads, selectedIds, onToggleSelect, onSelectAll, allSelected,
  onCall, onView, onEdit, onDelete,
}: Props) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/[0.07]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected && leads.length > 0}
                onChange={onSelectAll}
                className="h-3.5 w-3.5 rounded border-white/[0.20] bg-white/[0.05] accent-emerald-500 cursor-pointer"
              />
            </th>
            {['Name', 'Company'Phone', 'Status'Tags', 'Last Contact'Calls''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const selected = selectedIds.has(lead.id);
            const { bg: sBg, text: sText } = STATUS_COLORS[lead.status] ?? { bg: 'bg-slate-500/15', text: ', 'text-slate-300' };
            return (
              <tr
                key={lead.id}
                onClick={() => onView(lead)}
                className={cn(
                  'cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]',
                  selected && 'bg-emerald-500/5',
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => { e.stopPropagation(); onToggleSelect(lead.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 rounded border-white/[0.20] bg-white/[0.05] accent-emerald-500 cursor-pointer"
                  />
                </td>
                <td className="max-w-[180px] px-4 py-3">
                  <p className="truncate font-semibold text-white">{lead.name}</p>
                </td>
                <td className="max-w-[140px] px-4 py-3">
                  <p className="truncate text-slate-400">{lead.company ?? '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-slate-400">{lead.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${sBg} ${sText}`}>
                    {lead.status.replace(/_/g ')}
                  </span>
                </td>
                <td className="max-w-[140px] px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(lead.tags ?? []).slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">
                        {t}
                      </span>
                    ))}
                    {(lead.tags ?? []).length > 2 && (
                      <span className="text-[10px] text-slate-600">+{(lead.tags ?? []).length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {formatRelative(lead.last_called_at)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-600 tabular-nums">
                    {lead.call_attempts ?? 0}×
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    {lead.linkedin && (
                      <a
                        href={lead.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 hover:text-blue-400 transition"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <RowMenu
                      lead={lead}
                      onCall={() => onCall(lead)}
                      onView={() => onView(lead)}
                      onEdit={() => onEdit(lead)}
                      onDelete={() => onDelete(lead)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {leads.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-600">No leads match your filters</div>
      )}
    </div>
  );
}
