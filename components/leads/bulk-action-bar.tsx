'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Tag, TrendingUp, PhoneOff, Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { useSiteTheme } from '@/components/theme/site-theme';
import { cn } from '@/lib/utils';

interface Props {
  selectedIds: string[];
  onClear: () => void;
  onBulkDone: (action: string, ids: string[]) => void;
}

export function BulkActionBar({ selectedIds, onClear, onBulkDone }: Props) {
  const { apiFetch } = useWorkspace();
  const { isDark } = useSiteTheme();
  const [busy, setBusy] = useState<string | null>(null);

  const runBulk = async (ids: string[], action: Record<string, unknown>) => {
    const res = await apiFetch('/api/leads/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action }),
    });
    if (!res.ok) {
      let message = 'Bulk action failed';
      try {
        const body = await res.json() as { error?: string; message?: string };
        message = body.message ?? body.error ?? message;
      } catch {
        // Keep the fallback when the server returns an empty/non-JSON error body.
      }
      throw new Error(message);
    }
    return res.json();
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const count = selectedIds.length;

  const execute = async (actionType: string, action: Record<string, unknown>) => {
    setBusy(actionType);
    try {
      await runBulk(selectedIds, action);
      onBulkDone(actionType, selectedIds);
      toast.success(`Done — ${count} lead${count !== 1 ? 's' : ''} updated`, {
        action: { label: 'Undo', onClick: () => toast.info('Undo not available for this action') },
      });
      onClear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
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
        action: { label: 'Undo', onClick: () => toast.info('Go to Trash tab to restore') },
      });
      onClear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusy(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const res = await apiFetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'selected', ids: selectedIds, format: 'csv', fields: ['name','company','phone','email','status','tags','call_history'] }),
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
      className: isDark
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
        : 'border-amber-600/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15',
      action: { type: 'mark_hot' },
    },
    {
      id: 'mark_dnc',
      label: 'Mark DNC',
      icon: <PhoneOff className="h-3.5 w-3.5" />,
      className: isDark
        ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15'
        : 'border-red-600/30 bg-red-500/10 text-red-600 hover:bg-red-500/15',
      action: { type: 'mark_dnc' },
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-3.5 w-3.5" />,
      className: isDark
        ? 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15'
        : 'border-blue-600/30 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15',
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
              className={cn(
                'relative z-10 w-full max-w-sm rounded-2xl border p-6',
                isDark
                  ? 'border-white/[0.10] bg-[oklch(0.09_0.006_285)] shadow-2xl'
                  : 'border-zinc-950/[0.08] bg-white shadow-[0_24px_70px_rgba(76,29,149,0.12),0_2px_8px_rgba(9,9,11,0.06)]',
              )}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-zinc-950')}>Delete {count} lead{count !== 1 ? 's' : ''}?</h3>
              <p className={cn('mt-1.5 mb-5 text-sm leading-relaxed', isDark ? 'text-slate-400' : 'text-zinc-500')}>
                They&apos;ll be moved to trash and can be restored within 30 days.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}
                  className={cn(
                    'flex-1',
                    isDark
                      ? 'dash-btn-ghost'
                      : 'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-950/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-violet-500/30 hover:bg-violet-50/60',
                  )}>
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={busy === 'delete'}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:opacity-60">
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
        className={cn(
          'fixed left-3 right-3 z-40 flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl lg:bottom-6 lg:left-1/2 lg:right-auto lg:w-auto lg:-translate-x-1/2 lg:flex-nowrap',
          isDark
            ? 'border-white/[0.12] bg-[oklch(0.09_0.006_285)]/96 shadow-black/60'
            : 'border-zinc-950/[0.08] bg-white/95 shadow-[0_16px_50px_rgba(76,29,149,0.12)]',
        )}
        style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-[10px] font-bold text-black">
            <Check className="h-3 w-3" />
          </div>
          <span className={cn('text-sm font-semibold tabular-nums', isDark ? 'text-white' : 'text-zinc-900')}>{count} selected</span>
        </div>

        <div className={cn('hidden h-5 w-px lg:block', isDark ? 'bg-white/[0.08]' : 'bg-zinc-950/[0.08]')} />

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
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 min-h-[36px]',
              isDark
                ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15'
                : 'border-red-600/30 bg-red-500/10 text-red-600 hover:bg-red-500/15',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>

        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={onClear}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition',
              isDark
                ? 'border-white/[0.07] text-slate-500 hover:text-white'
                : 'border-zinc-950/10 text-zinc-400 hover:text-zinc-700',
            )}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
