'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';

interface SaveAsLeadModalProps {
  phone: string;
  onClose: () => void;
}

export default function SaveAsLeadModal({ phone, onClose }: SaveAsLeadModalProps) {
  const { apiFetch } = useWorkspace();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const parts = name.trim().split(/\s+/);
      const first_name = parts[0] ?? '';
      const last_name = parts.slice(1).join(' ');

      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          name: name.trim(),
          company: company.trim() || undefined,
          phone,
          status: 'new',
        }),
      });

      if (!res.ok) {
        console.error('Save as lead failed:', await res.text());
        return;
      }

      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Save as lead failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] p-6 shadow-2xl"
        >
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition">
            <X className="h-4 w-4" />
          </button>

          {saved ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Lead saved!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <UserPlus className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Save as Lead?</p>
                  <p className="text-[11px] text-slate-500 font-mono">{phone}</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Contact name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save to workspace
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
