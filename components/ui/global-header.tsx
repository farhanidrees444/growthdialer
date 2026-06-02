'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = ['Features', 'Pricing', 'Docs'] as const;
type NavLink = (typeof NAV_LINKS)[number];

export function GlobalHeader() {
  const [activeLink, setActiveLink] = useState<NavLink | null>(null);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* ─── Sticky Glassmorphism Navbar ─── */}
      <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-background/60 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* ─── Logo ─── */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500" />
            <span className="font-display text-lg font-semibold text-foreground">GrowthDialer</span>
          </Link>

          {/* ─── Navigation Links with Animated Pill ─── */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <div
                key={link}
                onMouseEnter={() => setActiveLink(link)}
                onMouseLeave={() => setActiveLink(null)}
                className="relative"
              >
                <button
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors duration-200',
                    activeLink === link ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link}
                </button>

                {/* ─── Animated Pill Background ─── */}
                <AnimatePresence>
                  {activeLink === link && (
                    <motion.div
                      layoutId="navbar-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-white/[0.08]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* ─── Action Buttons ─── */}
          <div className="flex items-center gap-3">
            {/* ─── Log In Button ─── */}
            <Link
              href="/login"
              className={cn(
                'group flex items-center gap-2 px-4 py-2 text-sm font-medium',
                'text-muted-foreground transition-colors duration-200 hover:text-foreground'
              )}
            >
              <LogIn className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              <span className="hidden sm:inline">Log in</span>
            </Link>

            {/* ─── Start Free CTA Button ─── */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Link
                href="/signup"
                className={cn(
                  'relative inline-flex items-center justify-center px-5 py-2 text-sm font-semibold',
                  'rounded-lg text-white',
                  /* Metallic gradient background */
                  'bg-gradient-to-r from-purple-600 to-purple-700 via-purple-600',
                  /* Fine border ring */
                  'border border-purple-400/40',
                  /* Subtle shadow and hover lift */
                  'shadow-lg shadow-purple-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-purple-600/30',
                  /* Shine effect */
                  'overflow-hidden'
                )}
              >
                {/* ─── Metallic Shine Overlay ─── */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                  }}
                />
                Start Free
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
