'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Building2, Briefcase, User, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  notes: string;
}

interface Props {
  onClose: () => void;
  onCreated: (lead: Record<string, unknown>) => void;
}

const INITIAL: FormData = {
  first_name: '', last_name: '', company: '', title: '',
  phone: '', email: '', notes: '',
};

export function LeadAddModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
    if (field === 'phone') setDuplicateWarning(null);
  };

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.phone.trim()) {
      e.phone = 'Required';
    } else if (!/^[\d\s\+\-\(\)\.]{7,}$/.test(form.phone)) {
      e.phone = 'Invalid phone number';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Invalid email';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setDuplicateWarning(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': ', 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 409) {
        const d = await res.json();
        setDuplicateWarning(d.message ?? 'Duplicate phone number');
        setSaving(false);
        return;
      }

      if (!res.ok) {
        toast.error('Failed to create lead');
        return;
      }

      const { lead } = await res.json();
      toast.success(`${lead.name} added`);
      onCreated(lead);
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
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.10] bg-[oklch(0.09_0.02_282)] shadow-2xl shadow-black/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-white">Add Lead</h2>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duplicate warning */}
        <AnimatePresence>
          {duplicateWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-2 flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-300">{duplicateWarning}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={<User className="h-3.5 w-3.5" />}
              label="First Name *"
              value={form.first_name}
              onChange={set('first_name')}
              error={errors.first_name}
              placeholder="John"
            />
            <Field
              label="Last Name *"
              value={form.last_name}
              onChange={set('last_name')}
              error={errors.last_name}
              placeholder="Smith"
            />
          </div>

          <Field
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Company"
            value={form.company}
            onChange={set('company')}
            placeholder="Acme Corp"
          />

          <Field
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Title"
            value={form.title}
            onChange={set('title')}
            placeholder="CEO"
          />

          <Field
            ref={phoneRef}
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Phone *"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
            placeholder="+1 (555) 000-0000"
            type="tel"
          />

          <Field
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            placeholder="john@example.com"
            type="email"
          />

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Optional notes…"
              className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/25 transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Lead'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Reusable field ───────────────────────────────────────────────────────────

import { forwardRef } from 'react';

const Field = forwardRef<HTMLInputElement, {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  icon?: React.ReactNode;
}>(function Field({ label, value, onChange, placeholder, type = 'text', error, icon }, ref) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={[
            'w-full rounded-xl border bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition',
            icon ? 'pl-9' : '',
            error
              ? 'border-red-500/40 focus:border-red-500/60'
              : 'border-white/[0.07] focus:border-emerald-500/25',
          ].join(' ')}
        />
      </div>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
});
