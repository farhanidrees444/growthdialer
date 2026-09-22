'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const inputClass =
  'w-full rounded-xl border border-zinc-950/[0.10] bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:border-[#7C3AED]/50 focus:ring-2 focus:ring-[#7C3AED]/20';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(fd.get('name') ?? ''),
          email: String(fd.get('email') ?? ''),
          company: String(fd.get('company') ?? ''),
          message: String(fd.get('message') ?? ''),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (res.ok) {
        setDone((data.message as string) ?? "Thanks — we'll be in touch within one business day.");
        (e.target as HTMLFormElement).reset();
      } else {
        setError(true);
      }
    } catch {
      setLoading(false);
      setError(true);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-2xl border border-emerald-600/20 bg-emerald-50 p-8 text-center"
      >
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-[15px] text-zinc-800">{done}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="pm-card relative overflow-hidden p-6 sm:p-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-zinc-600">Name</label>
          <input id="name" name="name" required minLength={2} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-600">Work email</label>
          <input id="email" name="email" type="email" required className={inputClass} placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-zinc-600">Company</label>
          <input id="company" name="company" required className={inputClass} placeholder="Your company" />
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-zinc-600">How can we help?</label>
          <textarea id="message" name="message" rows={4} required className={`${inputClass} resize-none`} placeholder="Tell us about your team and what you're looking for." />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            Something went wrong. Please try again or email{' '}
            <a href="mailto:hello@growthdialer.com" className="underline">hello@growthdialer.com</a>.
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="pm-btn pm-btn-primary w-full justify-center disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send message'}
        </button>
      </div>
    </form>
  );
}
