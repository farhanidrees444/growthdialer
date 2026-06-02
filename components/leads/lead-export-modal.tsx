'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

      const res = await fetch('/api/leads/export', {
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
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)] shadow-2xl shadow-black/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-bold text-white">Export Leads</h2>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Format */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {(['csv'json'] as Format[]).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className={[
                    'rounded-xl border py-2.5 text-sm font-semibold uppercase tracking-wide transition',
                    format === f
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/[0.07] text-slate-500 hover:text-slate-300',
                  ].join(' ')}>
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
                  className={[
                    'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                    scope === value
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/[0.07] text-slate-400 hover:text-white',
                  ].join(' ')}>
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
                    className={[
                      'flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition',
                      active ? 'border-white/[0.10] bg-white/[0.04]' : 'border-white/[0.05]',
                    ].join(' ')}>
                    <div>
                      <p className="text-xs font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-slate-600">{sublabel}</p>
                    </div>
                    <div className={`h-4 w-4 rounded border transition ${active ? 'border-emerald-500 bg-emerald-500' : 'border-white/[0.15]'}`}>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition active:scale-[0.98]"
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
