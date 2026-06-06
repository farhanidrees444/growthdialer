'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, Building2, Briefcase, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';

interface LeadToEdit {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  title?: string | null;
  phone: string;
  email?: string | null;
  notes?: string | null;
  status: string;
}

interface Props {
  lead: LeadToEdit;
  onClose: () => void;
  onSaved: (lead: LeadToEdit) => void;
}

export function LeadEditModal({ lead, onClose, onSaved }: Props) {
  const { apiFetch } = useWorkspace();
  const [form, setForm] = useState({
    first_name: lead.first_name ?? '',
    last_name: lead.last_name ?? '',
    company: lead.company ?? '',
    title: lead.title ?? '',
    phone: lead.phone,
    email: lead.email ?? '',
    notes: lead.notes ?? '',
    status: lead.status,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const name = `${form.first_name} ${form.last_name}`.trim() || lead.name;

    try {
      const res = await apiFetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name }),
      });

      if (!res.ok) { toast.error('Failed to save changes'); return; }
      const { lead: updated } = await res.json();
      toast.success('Lead updated');
      onSaved(updated);
      onClose();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
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
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.10] bg-[oklch(0.09_0.006_285)] shadow-2xl shadow-black/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-white">Edit Lead</h2>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ModalField icon={<User className="h-3.5 w-3.5" />} label="First Name" value={form.first_name} onChange={set('first_name')} placeholder="First" />
            <ModalField label="Last Name" value={form.last_name} onChange={set('last_name')} placeholder="Last" />
          </div>
          <ModalField icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={form.company} onChange={set('company')} placeholder="Company" />
          <ModalField icon={<Briefcase className="h-3.5 w-3.5" />} label="Title" value={form.title} onChange={set('title')} placeholder="Title" />
          <ModalField icon={<Phone className="h-3.5 w-3.5" />} label="Phone *" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" type="tel" error={errors.phone} />
          <ModalField icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={form.email} onChange={set('email')} placeholder="email@example.com" type="email" error={errors.email} />

          {/* Status */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">Status</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/25 transition appearance-none"
            >
              {['new','queued','contacted','connected','callback','meeting_booked','not_interested','do_not_call','wrong_number'].map((s) => (
                <option key={s} value={s} className="bg-[#111] capitalize">{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Notes…"
              className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.04] transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ModalField({ label, value, onChange, placeholder, type = 'text', error, icon }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={[
            'w-full rounded-xl border bg-white/[0.03] py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition',
            icon ? 'pl-9 pr-3' : 'px-3',
            error ? 'border-red-500/40' : 'border-white/[0.07] focus:border-emerald-500/25',
          ].join(' ')}
        />
      </div>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
