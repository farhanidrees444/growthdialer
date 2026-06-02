'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Phone, Brain, Zap, BarChart3, Users, Shield, ArrowRight } from 'lucide-react';
import { MiniWave } from './LiveWaveform';
import { EASE_OUT } from './motion';

const LINKS = [
  {
    label: 'Product',
    href: '#',
    hasDropdown: true,
    items: [
      { icon: Phone, label: 'AI Dialer', description: 'Three modes. One focused stage.', href: '/#features' },
      { icon: Brain, label: 'Call Intelligence', description: 'AI-powered transcription and insights', href: '/#features' },
      { icon: Zap, label: 'Power Dialer', description: 'Work the list, not the dialer', href: '/#features' },
      { icon: BarChart3, label: 'Analytics', description: 'See what actually works', href: '/#features' },
      { icon: Users, label: 'Team Coaching', description: 'Coach reps in real-time', href: '/#features' },
      { icon: Shield, label: 'Number Health', description: 'Keep your calls landing', href: '/#features' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integrations', href: '/#integrations' },
  { label: 'Customers', href: '/customers' },
  { label: 'Docs', href: '/docs' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

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
      {/* Announcement bar */}
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-[#8B5CF6]/10 via-transparent to-[#06B6D4]/10 px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-[13px]">
          <span className="rounded-full bg-[#8B5CF6] px-2 py-0.5 text-[10px] font-semibold text-white">
            NEW
          </span>
          <span className="text-zinc-400">
            AI Call Summaries now in beta.
          </span>
          <Link href="/changelog" className="group inline-flex items-center gap-1 text-[#8B5CF6] hover:text-[#A78BFA]">
            Learn more
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Main nav */}
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.06] bg-[#08080A]/90 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
              <MiniWave className="scale-90" />
            </span>
            <span className="text-[16px] font-semibold tracking-tight text-[#F5F5F7]">
              GrowthDialer
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <div key={link.label} className="relative">
                {link.hasDropdown ? (
                  <button
                    onMouseEnter={() => setDropdownOpen(link.label)}
                    onMouseLeave={() => setDropdownOpen(null)}
                    className="group flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-[#F5F5F7]"
                  >
                    {link.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen === link.label ? 'rotate-180' : ''}`} />
                    
                    {/* Dropdown */}
                    <AnimatePresence>
                      {dropdownOpen === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2, ease: EASE_OUT }}
                          className="absolute left-1/2 top-full z-50 w-[480px] -translate-x-1/2 pt-2"
                          onMouseEnter={() => setDropdownOpen(link.label)}
                          onMouseLeave={() => setDropdownOpen(null)}
                        >
                          <div className="rounded-xl border border-white/[0.08] bg-[#0C0C0F]/95 p-2 shadow-2xl backdrop-blur-xl">
                            <div className="grid grid-cols-2 gap-1">
                              {link.items?.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setDropdownOpen(null)}
                                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/[0.04]"
                                  >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                      <Icon className="h-4 w-4 text-[#8B5CF6]" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-white">{item.label}</p>
                                      <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-[#F5F5F7]"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-[#F5F5F7]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="group relative rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#8B5CF6]/20 transition-all hover:bg-[#7C3AED] hover:shadow-[#8B5CF6]/30 active:scale-[0.98]"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-300 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="overflow-hidden border-b border-white/[0.06] bg-[#08080A]/98 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {LINKS.map((link) => (
                <div key={link.label}>
                  {link.hasDropdown ? (
                    <>
                      <p className="px-3 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-600">
                        {link.label}
                      </p>
                      <div className="mb-2 space-y-1">
                        {link.items?.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.03]"
                            >
                              <Icon className="h-4 w-4 text-[#8B5CF6]" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.03] hover:text-[#F5F5F7]"
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
              
              <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                <Link 
                  href="/login" 
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.03]"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[#8B5CF6] px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#7C3AED]"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
