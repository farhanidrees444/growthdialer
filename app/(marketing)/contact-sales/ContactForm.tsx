'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { Spotlight } from '@/components/marketing/live-floor/Spotlight';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F7] placeholder:text-zinc-600 outline-none transition focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/20';

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
        className="relative overflow-hidden rounded-2xl border border-[#06B6D4]/20 bg-white/[0.02] p-8 text-center backdrop-blur-xl"
      >
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4]">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-[15px] text-zinc-200">{done}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
      <Spotlight />
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-zinc-400">Name</label>
          <input id="name" name="name" required minLength={2} className={inputClass} placeholder="Alex Rivera" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">Work email</label>
          <input id="email" name="email" type="email" required className={inputClass} placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-zinc-400">Company</label>
          <input id="company" name="company" required className={inputClass} placeholder="Acme Corp" />
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-zinc-400">How can we help?</label>
          <textarea id="message" name="message" rows={4} required className={`${inputClass} resize-none`} placeholder="Tell us about your team and what you're looking for." />
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            Something went wrong. Please try again or email{' '}
            <a href="mailto:hello@growthdialer.com" className="underline">hello@growthdialer.com</a>.
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] py-3 text-sm font-medium text-white transition-all hover:bg-[#7C3AED] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send message'}
        </button>
      </div>
    </form>
  );
}
