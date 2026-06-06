'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { MiniWave } from './LiveWaveform';
import { EASE_OUT } from './motion';
import { APP_SIGNIN, APP_SIGNUP, TOP_NAV } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

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
        className={cn(
          'mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 transition-all duration-500 lg:px-8',
          scrolled
            ? 'border-b border-white/[0.06] bg-[#08080A]/80 backdrop-blur-xl'
            : 'border-b border-transparent'
        )}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <MiniWave className="scale-90" />
          </span>
          <span className="text-[15px] font-medium tracking-tight text-[#F5F5F7]">
            GrowthDialer
          </span>
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
          onMouseLeave={() => setHovered(null)}
        >
          {TOP_NAV.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => {
                  setHovered(item.label);
                  setDropdownOpen(item.label);
                }}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <button
                  type="button"
                  className="relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
                >
                  {hovered === item.label && (
                    <motion.span
                      layoutId="nav-hover-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06]"
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    />
                  )}
                  {item.label}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      dropdownOpen === item.label && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {dropdownOpen === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0c0c0e]/95 py-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-[#F5F5F7]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onMouseEnter={() => setHovered(item.label)}
                className="relative rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
              >
                {hovered === item.label && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06]"
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                )}
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <a
            href={APP_SIGNIN}
            className="rounded-lg px-3.5 py-2 text-sm text-zinc-300 transition-colors hover:text-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
          >
            Log in
          </a>
          <a
            href={APP_SIGNUP}
            className="group relative rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-all hover:bg-[#7C3AED] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]"
          >
            Start Free
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-300 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="overflow-hidden border-b border-white/[0.06] bg-[#08080A]/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {TOP_NAV.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpanded((v) => (v === item.label ? null : item.label))
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.03] hover:text-[#F5F5F7]"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          mobileExpanded === item.label && 'rotate-180'
                        )}
                      />
                    </button>
                    {mobileExpanded === item.label && (
                      <div className="ml-3 space-y-0.5 border-l border-white/[0.06] pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-white/[0.03] hover:text-[#F5F5F7]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.03] hover:text-[#F5F5F7]"
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
                <a href={APP_SIGNIN} className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.03]">
                  Log in
                </a>
                <a
                  href={APP_SIGNUP}
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-[#8B5CF6] px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#7C3AED]"
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
