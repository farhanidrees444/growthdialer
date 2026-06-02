'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SaveAsLeadModalProps {
  phone: string;
  onClose: () => void;
}

export default function SaveAsLeadModal({ phone, onClose }: SaveAsLeadModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      await supabase.from('leads').insert({
        user_id: session.user.id,
        name: name.trim(),
        company: company.trim() || null,
        phone,
        status: 'new',
        call_attempts: 1,
        last_called_at: new Date().toISOString(),
      });

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
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Name *</label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contact name"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-sm text-slate-400 transition hover:text-white"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Save Lead
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
