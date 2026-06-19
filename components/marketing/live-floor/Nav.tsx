'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Target, Zap, BarChart3, Headphones, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ShimmerButton } from './ShimmerButton';
import { EASE_OUT } from './motion';
import { APP_SIGNIN, APP_SIGNUP, TOP_NAV } from '@/lib/marketing/navigation';
import { cn } from '@/lib/utils';

const PRODUCT_FEATURES = [
  { icon: Target, label: 'AI Dialer', href: '/features/ai', desc: '3-mode focus stage' },
  { icon: Zap, label: 'Power Dialer', href: '/features', desc: 'Queue & parallel dial' },
  { icon: BarChart3, label: 'Analytics', href: '/features', desc: 'Connect rate & talk time' },
  { icon: Headphones, label: 'Coaching', href: '/features/salesfloor', desc: 'Live manager floor' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
          'mx-auto mt-3 flex h-[4.25rem] max-w-7xl items-center justify-between gap-5 rounded-2xl px-5 transition-all duration-300 sm:h-[4.5rem] lg:px-8',
          scrolled
            ? 'marketing-glass max-w-[calc(100%-1.5rem)] shadow-[0_18px_80px_rgba(0,0,0,0.42)]'
            : 'max-w-[calc(100%-1.5rem)] border border-white/[0.04] bg-white/[0.025] backdrop-blur-md'
        )}
      >
        <BrandLogo href="/" showText size="nav" priority className="shrink-0" />

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
          onMouseLeave={() => {
            setHovered(null);
            setDropdownOpen(null);
          }}
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
              >
                <button
                  type="button"
                  className="group relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      dropdownOpen === item.label && 'rotate-180'
                    )}
                  />
                  <span className="absolute bottom-1 left-3 right-3 h-px origin-left scale-x-0 bg-[#8B5CF6] transition-transform duration-300 group-hover:scale-x-100" />
                </button>
                <AnimatePresence>
                  {dropdownOpen === item.label && item.label === 'Features' && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0.95, y: 6 }}
                      animate={{ opacity: 1, scaleY: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0.95, y: 6 }}
                      transition={{ duration: 0.15 }}
                      style={{ transformOrigin: 'top' }}
                      className="marketing-glass absolute left-1/2 top-full z-50 mt-3 w-[520px] -translate-x-1/2 overflow-hidden rounded-3xl p-1"
                    >
                      <div className="grid grid-cols-2 gap-0 p-2">
                        <div className="space-y-1 p-2">
                          {PRODUCT_FEATURES.map((f) => {
                            const Icon = f.icon;
                            return (
                              <Link
                                key={f.label}
                                href={f.href}
                                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.04]"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span>
                                  <span className="block text-sm font-medium text-[#F5F5F7]">{f.label}</span>
                                  <span className="text-[12px] text-zinc-500">{f.desc}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                        <div className="border-l border-white/[0.06] p-4">
                          <span className="mb-2 inline-flex rounded-full bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8B5CF6]">
                            What&apos;s new
                          </span>
                          <p className="text-sm font-medium text-[#F5F5F7]">AI Call Briefs</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                            Context before every dial — company, intent and last touch in one glance.
                          </p>
                          <Link
                            href="/features/ai"
                            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#8B5CF6] hover:text-[#06B6D4]"
                          >
                            Read more <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {dropdownOpen === item.label && item.label !== 'Features' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    className="marketing-glass absolute left-0 top-full z-50 mt-3 min-w-[220px] rounded-2xl py-1.5"
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
                className="group relative rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
              >
                {hovered === item.label && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06]"
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                )}
                {item.label}
                <span className="absolute bottom-1 left-3 right-3 h-px origin-left scale-x-0 bg-[#8B5CF6] transition-transform duration-300 group-hover:scale-x-100" />
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
          <ShimmerButton href={APP_SIGNUP} className="!h-10 !px-4 !text-sm">
            Start Free
            <ArrowRight className="h-3.5 w-3.5" />
          </ShimmerButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-300 backdrop-blur-xl lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#08080A]/96 pt-24 backdrop-blur-2xl lg:hidden"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
              className="mx-auto max-w-lg space-y-2 px-5 py-6"
            >
              {TOP_NAV.map((item) =>
                item.children ? (
                  <motion.div key={item.label} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpanded((v) => (v === item.label ? null : item.label))
                      }
                      className="flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-4 text-base text-zinc-200"
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
                          className="block rounded-xl px-4 py-3 text-sm text-zinc-500 hover:bg-white/[0.035] hover:text-[#F5F5F7]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key={item.label} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-4 text-base text-zinc-200"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                )
              )}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="mt-6 space-y-3 border-t border-white/[0.06] pt-6"
              >
                <a href={APP_SIGNIN} className="block px-3 py-2 text-sm text-zinc-400">
                  Log in
                </a>
                <ShimmerButton href={APP_SIGNUP} className="w-full justify-center">
                  Start Free
                </ShimmerButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
