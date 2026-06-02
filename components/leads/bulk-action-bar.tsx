'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Tag, TrendingUp, PhoneOff, Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  selectedIds: string[];
  onClear: () => void;
  onBulkDone: (action: string, ids: string[]) => void;
}

async function runBulk(ids: string[], action: Record<string, unknown>) {
  const res = await fetch('/api/leads/bulk', {
    method: 'POST',
    headers: { 'Content-Type': ', 'application/json' },
    body: JSON.stringify({ ids, action }),
  });
  if (!res.ok) throw new Error('Bulk action failed');
  return res.json();
}

export function BulkActionBar({ selectedIds, onClear, onBulkDone }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const count = selectedIds.length;

  const execute = async (actionType: string, action: Record<string, unknown>) => {
    setBusy(actionType);
    try {
      await runBulk(selectedIds, action);
      onBulkDone(actionType, selectedIds);
      toast.success(`Done — ${count} lead${count !== 1 ? 's' : ''} updated`, {
        action: { label: 'Undo', onClick: () => toast.info(', 'Undo not available for this action') },
      });
      onClear();
    } catch {
      toast.error('Action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy('delete');
    try {
      await runBulk(selectedIds, { type: 'delete' });
      onBulkDone('delete', selectedIds);
      toast.success(`${count} lead${count !== 1 ? 's' : ''} deleted`, {
        description: 'Moved to trash — recoverable for 30 days',
        action: { label: 'Undo', onClick: () => toast.info(', 'Go to Trash tab to restore') },
      });
      onClear();
    } catch {
      toast.error('Delete failed');
    } finally {
      setBusy(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const res = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'selected', ids: selectedIds, format: 'csv', fields: ['name', 'company', 'phone', 'email', 'status', 'tags', 'call_history'] }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} lead${count !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setBusy(null);
    }
  };

  const ACTIONS = [
    {
      id: 'mark_hot',
      label: 'Mark Hot',
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      className: 'border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15',
      action: { type: 'mark_hot' },
    },
    {
      id: 'mark_dnc',
      label: 'Mark DNC',
      icon: <PhoneOff className="h-3.5 w-3.5" />,
      className: 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15',
      action: { type: 'mark_dnc' },
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-3.5 w-3.5" />,
      className: 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15',
      onClick: handleExport,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)] p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">Delete {count} lead{count !== 1 ? 's' : ''}?</h3>
              <p className="mt-1.5 mb-5 text-sm text-slate-400 leading-relaxed">
                They&apos;ll be moved to trash and can be restored within 30 days.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.04] transition">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={busy === 'delete'}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-60 transition">
                  {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : `Delete ${count}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile: full-width bar above bottom tab. Desktop: floating pill */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="fixed left-3 right-3 z-40 flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.12] bg-[oklch(0.09_0.02_282)]/96 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl lg:bottom-6 lg:left-1/2 lg:right-auto lg:w-auto lg:-translate-x-1/2 lg:flex-nowrap"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-[10px] font-bold text-black">
            <Check className="h-3 w-3" />
          </div>
          <span className="text-sm font-semibold text-white tabular-nums">{count} selected</span>
        </div>

        <div className="hidden h-5 w-px bg-white/[0.08] lg:block" />

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {ACTIONS.map(({ id, label, icon, className, action, onClick }) => (
            <button
              key={id}
              type="button"
              disabled={!!busy}
              onClick={onClick ?? (() => execute(id, action as Record<string, unknown>))}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 min-h-[36px] ${className}`}
            >
              {busy === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
              {label}
            </button>
          ))}

          <button
            type="button"
            disabled={!!busy}
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/15 transition disabled:opacity-50 min-h-[36px]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>

        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-500 hover:text-white transition"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
