'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { MiniWave } from './LiveWaveform';
import { EASE_OUT } from './motion';

const APP_SIGNIN = 'https://app.growthdialer.com/login';
const APP_SIGNUP = 'https://app.growthdialer.com/signup';

const LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Customers', href: '/customers' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between px-5 transition-all duration-500 lg:px-8 ${
          scrolled
            ? 'border-b border-white/[0.06] bg-[hsl(200,50%,3%)']/80 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <MiniWave className="scale-90" />
          </span>
          <span className="text-[15px] font-medium tracking-tight text-foreground">
            GrowthDialer
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/50"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href={APP_SIGNIN}
            className="rounded-lg px-3.5 py-2 text-sm text-muted-foreground/90 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/50"
          >
            Log in
          </a>
          <a
            href={APP_SIGNUP}
            className="group relative rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(258,90%,66%)']/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start Free
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] text-muted-foreground/90 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="overflow-hidden border-b border-white/[0.06] bg-[hsl(200,50%,3%)']/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground/90 hover:bg-white/[0.03] hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
                <a href={APP_SIGNIN} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground/90 hover:bg-white/[0.03]">
                  Log in
                </a>
                <a
                  href={APP_SIGNUP}
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-violet-600 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  Start Free
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
