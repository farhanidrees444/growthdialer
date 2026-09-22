'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

type Format = 'csv' | 'json';
type Scope = 'all' | 'selected' | 'filtered';

interface Props {
  onClose: () => void;
  selectedCount: number;
  filteredCount: number;
  selectedIds: string[];
}

const FIELD_OPTIONS = [
  { id: 'basic', label: 'Basic info', sublabel: 'Name, company, phone, email', default: true },
  { id: 'title', label: 'Title', sublabel: 'Job title', default: true },
  { id: 'status', label: 'Status', sublabel: 'Current lead status', default: true },
  { id: 'tags', label: 'Tags', sublabel: 'Lead tags', default: true },
  { id: 'notes', label: 'Notes', sublabel: 'Call and lead notes', default: false },
  { id: 'call_history', label: 'Call history', sublabel: 'Attempts and last contact', default: false },
  { id: 'ai_score', label: 'AI Score', sublabel: 'Lead scoring', default: false },
];

export function LeadExportModal({ onClose, selectedCount, filteredCount, selectedIds }: Props) {
  const { apiFetch } = useWorkspace();
  const { isDark } = useSiteTheme();
  const [format, setFormat] = useState<Format>('csv');
  const [scope, setScope] = useState<Scope>(selectedCount > 0 ? 'selected' : 'all');
  const [fields, setFields] = useState<string[]>(
    FIELD_OPTIONS.filter((f) => f.default).map((f) => f.id)
  );
  const [exporting, setExporting] = useState(false);

  const toggleField = (id: string) => {
    setFields((p) => p.includes(id) ? p.filter((f) => f !== id) : [...p, id]);
  };

  const handleExport = async () => {
    if (fields.length === 0) { toast.warning('Select at least one field'); return; }
    setExporting(true);

    try {
      const body: Record<string, unknown> = { scope, format, fields };
      if (scope === 'selected') body.ids = selectedIds;

      const res = await apiFetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      if (format === 'json') {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        triggerDownload(blob, `leads-export-${Date.now()}.json`);
      } else {
        const blob = await res.blob();
        triggerDownload(blob, `leads-export-${Date.now()}.csv`);
      }
      toast.success('Export downloaded');
      onClose();
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className={cn(
          'relative z-10 w-full max-w-sm rounded-3xl border overflow-hidden',
          isDark
            ? 'border-white/[0.10] bg-[oklch(0.09_0.006_285)] shadow-2xl shadow-black/70'
            : 'border-zinc-950/[0.08] bg-white shadow-[0_24px_70px_rgba(76,29,149,0.12),0_2px_8px_rgba(9,9,11,0.06)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Download className={cn('h-4 w-4', isDark ? 'text-slate-500' : 'text-zinc-400')} />
            <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-zinc-950')}>Export Leads</h2>
          </div>
          <button type="button" onClick={onClose}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border transition',
              isDark
                ? 'border-white/[0.08] text-slate-500 hover:text-white'
                : 'border-zinc-950/10 bg-white text-zinc-400 shadow-sm hover:text-zinc-700',
            )}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Format */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {(['csv', 'json'] as Format[]).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className={cn(
                    'rounded-xl border py-2.5 text-sm font-semibold uppercase tracking-wide transition',
                    format === f
                      ? isDark
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-emerald-600/30 bg-emerald-500/10 text-emerald-700'
                      : isDark
                        ? 'border-white/[0.07] text-slate-500 hover:text-slate-300'
                        : 'border-zinc-950/10 text-zinc-500 hover:text-zinc-800',
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Scope</label>
            <div className="space-y-1.5">
              {[
                { value: 'all' as Scope, label: 'All leads', count: null },
                ...(selectedCount > 0 ? [{ value: 'selected' as Scope, label: 'Selected only', count: selectedCount }] : []),
                ...(filteredCount > 0 ? [{ value: 'filtered' as Scope, label: 'Current filter view', count: filteredCount }] : []),
              ].map(({ value, label, count }) => (
                <button key={value} type="button" onClick={() => setScope(value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                    scope === value
                      ? isDark
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-emerald-600/30 bg-emerald-500/10 text-emerald-700'
                      : isDark
                        ? 'border-white/[0.07] text-slate-400 hover:text-white'
                        : 'border-zinc-950/10 text-zinc-500 hover:text-zinc-800',
                  )}>
                  <span>{label}</span>
                  {count != null && (
                    <span className="text-xs text-slate-600 tabular-nums">{count} leads</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Fields</label>
            <div className="space-y-1.5">
              {FIELD_OPTIONS.map(({ id, label, sublabel }) => {
                const active = fields.includes(id);
                return (
                  <label key={id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition',
                      active
                        ? isDark
                          ? 'border-white/[0.10] bg-white/[0.04]'
                          : 'border-zinc-950/10 bg-zinc-950/[0.03]'
                        : isDark
                          ? 'border-white/[0.05]'
                          : 'border-zinc-950/[0.06]',
                    )}>
                    <div>
                      <p className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-zinc-900')}>{label}</p>
                      <p className="text-[10px] text-slate-600">{sublabel}</p>
                    </div>
                    <div className={cn(
                      'h-4 w-4 rounded border transition',
                      active
                        ? 'border-emerald-500 bg-emerald-500'
                        : isDark
                          ? 'border-white/[0.15]'
                          : 'border-zinc-950/20',
                    )}>
                      {active && (
                        <svg viewBox="0 0 12 12" className="h-4 w-4 p-0.5 text-black">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={active} onChange={() => toggleField(id)} className="sr-only" />
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || fields.length === 0}
            className={cn(
              'w-full',
              isDark
                ? 'dash-btn-primary'
                : 'inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-[14px] font-medium text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-all duration-150 select-none hover:bg-violet-500 disabled:opacity-50',
            )}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Download'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
