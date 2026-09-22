'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { APP_SIGNIN, APP_SIGNUP, FOOTER_COLUMNS, SOCIAL_LINKS, TOP_NAV } from '@/lib/marketing/navigation';
import { FOOTER_TAGLINE } from './copy';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          'mx-auto mt-4 flex h-[68px] max-w-7xl items-center justify-between gap-6 rounded-[1.1rem] px-4 transition-all duration-300 sm:px-5',
          scrolled
            ? 'border border-zinc-950/[0.08] bg-white/85 shadow-[0_16px_48px_-16px_rgba(9,9,11,0.18)] backdrop-blur-xl'
            : 'border border-transparent bg-transparent'
        )}
        style={{ maxWidth: 'min(80rem, calc(100% - 2rem))' }}
      >
        <BrandLogo href="/" showText size="nav" priority wordmarkTone="onLight" className="shrink-0" />

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setDrop(null)}>
          {TOP_NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="relative" onMouseEnter={() => setDrop(item.label)}>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-4 py-2.5 text-[14.5px] font-medium text-zinc-600 transition-colors hover:bg-zinc-950/[0.04] hover:text-zinc-950"
                  aria-expanded={drop === item.label}
                >
                  {item.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', drop === item.label && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {drop === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3"
                    >
                      <div className="overflow-hidden rounded-2xl border border-zinc-950/[0.08] bg-white p-2 shadow-[0_32px_64px_-24px_rgba(9,9,11,0.25)]">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block rounded-xl px-4 py-3 transition-colors hover:bg-zinc-950/[0.04]"
                          >
                            <span className="block text-[14.5px] font-semibold text-zinc-950">{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2.5 text-[14.5px] font-medium text-zinc-600 transition-colors hover:bg-zinc-950/[0.04] hover:text-zinc-950"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={APP_SIGNIN}
            className="rounded-full px-4 py-2.5 text-[14.5px] font-medium text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Log in
          </a>
          <a href={APP_SIGNUP} className="pm-btn pm-btn-primary !px-5 !py-2.5 !text-[14px]">
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-950/[0.1] bg-white/70 text-zinc-900 backdrop-blur lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mx-4 mt-2 overflow-hidden rounded-2xl border border-zinc-950/[0.08] bg-white/95 p-3 shadow-[0_32px_64px_-24px_rgba(9,9,11,0.3)] backdrop-blur-xl lg:hidden"
          >
            {TOP_NAV.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-zinc-950 hover:bg-zinc-950/[0.04]"
                >
                  {item.label}
                </Link>
                {item.children?.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-8 py-2.5 text-[14px] text-zinc-600 hover:bg-zinc-950/[0.04]"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="mt-2 flex gap-2 border-t border-zinc-950/[0.07] p-2">
              <a href={APP_SIGNIN} className="pm-btn pm-btn-secondary flex-1 !py-3">
                Log in
              </a>
              <a href={APP_SIGNUP} className="pm-btn pm-btn-primary flex-1 !py-3">
                Start free trial
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function SocialIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    X: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    LinkedIn:
      'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    GitHub:
      'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    YouTube:
      'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  };
  const d = paths[label] ?? paths['X'];
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Footer() {
  // GoHighLevel is the founder's named competitor: surface it first in the
  // Compare column (the column renders its first 6 links).
  const footerColumns = FOOTER_COLUMNS.map((col) =>
    col.heading === 'Compare'
      ? {
          ...col,
          links: [{ label: 'vs GoHighLevel', href: '/compare/vs-gohighlevel' }, ...col.links],
        }
      : col
  );
  return (
    <footer className="pm-divider relative overflow-hidden bg-white px-5 pb-10 pt-16 lg:px-8 lg:pt-20">
      <div className="pm-container">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <BrandLogo href="/" showText size="footer" wordmarkTone="onLight" />
            <p className="pm-body mt-5 max-w-xs">{FOOTER_TAGLINE}</p>
            <a
              href={APP_SIGNUP}
              className="mt-6 inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#6d28d9] transition-colors hover:text-[#7c3aed]"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </a>
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-950/[0.08] bg-white text-zinc-500 transition-all hover:-translate-y-0.5 hover:border-zinc-950/[0.16] hover:text-zinc-950"
                >
                  <SocialIcon label={social.label} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {footerColumns.map((col) => (
              <div key={col.heading}>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {col.heading}
                </p>
                <ul className="space-y-2.5">
                  {col.links.slice(0, 6).map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="inline-block text-[13.5px] text-zinc-600 transition-colors hover:text-zinc-950"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p
          aria-hidden
          className="pointer-events-none mt-14 select-none text-center font-display text-[clamp(3.2rem,11vw,8.5rem)] font-semibold leading-none tracking-[-0.04em] text-zinc-950/[0.045]"
        >
          GrowthDialer
        </p>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-950/[0.07] pt-7 sm:flex-row">
          <p className="text-[12.5px] text-zinc-500">© {new Date().getFullYear()} GrowthDialer. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-[12.5px]">
            <Link href="/privacy" className="text-zinc-500 transition-colors hover:text-zinc-950">Privacy</Link>
            <Link href="/terms" className="text-zinc-500 transition-colors hover:text-zinc-950">Terms</Link>
            <Link href="/status" className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-950">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
