'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useMounted } from '@/hooks/use-mounted';
import type { IconType } from 'react-icons';

/**
 * Props for each step in an animated section.
 * Defines the visual content shown during that step's duration.
 */
export interface StepContent {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Content to render as the dashboard/preview for this step (JSX or text). */
  dashboardContent: React.ReactNode;
}

/**
 * Reusable animated section component combining:
 * - Title and description
 * - Animated brand logos with grayscale→color hover effect
 * - Animated step indicators with progress bar
 * - Auto-looping dashboard preview (Smartlead-style)
 *
 * SSR-safe: all animations use fixed initial states, mounted guard, and reduced-motion support.
 */
export function AnimatedSection({
  title,
  subtitle,
  logos,
  steps,
  stepDurationMs = 4000,
  className = '',
}: {
  title: string;
  subtitle?: string;
  /** Array of [Icon, name] tuples for the logo row. */
  logos: [IconType, string][];
  steps: StepContent[];
  stepDurationMs?: number;
  className?: string;
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: '-30%' });
  const mounted = useMounted();
  const prefersReduced = useReducedMotion();
  // Treat motion as enabled until mounted, so server render matches first client paint.
  const reduce = mounted && prefersReduced;

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Advance steps when in view and motion is allowed. Reduced-motion users see all steps static.
  useEffect(() => {
    if (reduce || !isInView || !mounted) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
      setProgress(0);
    }, stepDurationMs);

    return () => clearInterval(interval);
  }, [isInView, reduce, mounted, steps.length, stepDurationMs]);

  // Animate progress bar during each step.
  useEffect(() => {
    if (reduce || !isInView || !mounted) return;

    let frame: ReturnType<typeof requestAnimationFrame>;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / stepDurationMs) * 100, 100);
      setProgress(percent);
      if (percent < 100) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [stepIndex, isInView, reduce, mounted, stepDurationMs]);

  const currentStep = steps[stepIndex];

  return (
    <motion.section
      ref={containerRef}
      className={`relative min-h-screen flex flex-col items-center justify-center px-5 py-20 ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, margin: '-20%' }}
    >
      {/* Title and Subtitle */}
      <motion.div
        className="relative z-10 mb-16 max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: false }}
      >
        <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-lg text-zinc-400">
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Animated Logo Marquee */}
      <LogoMarquee logos={logos} />

      {/* Step Indicator Pills and Progress Bar */}
      <div className="relative z-10 mb-12 w-full max-w-2xl">
        {/* Step Pills */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: false }}
        >
          {steps.map((step, i) => (
            <motion.button
              key={i}
              onClick={() => {
                setStepIndex(i);
                setProgress(0);
              }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                i === stepIndex
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-400 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="hidden sm:inline">{step.title}</span>
              <span className="inline sm:hidden">{i + 1}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="h-1 w-full rounded-full bg-white/10 overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: false }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </motion.div>
      </div>

      {/* Dashboard Preview Content - Animates per step */}
      <motion.div
        className="relative z-10 w-full max-w-4xl"
        key={stepIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
      >
        {currentStep.dashboardContent}
      </motion.div>
    </motion.section>
  );
}

/**
 * Animated logo marquee: dual-row infinite scroll with grayscale→color hover effect.
 */
function LogoMarquee({ logos }: { logos: [IconType, string][] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <motion.div
      className="relative z-10 mb-16 w-full max-w-5xl"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      viewport={{ once: false }}
    >
      {/* Dual-row animated marquee */}
      <div className="space-y-4 overflow-hidden">
        {/* Row 1 - scroll left */}
        <motion.div
          className="flex gap-4"
          animate={{ x: [0, -2000] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          {[...logos, ...logos].map(([Icon, name], i) => (
            <LogoPill
              key={i}
              Icon={Icon}
              name={name}
              isHovered={hoveredIndex === i % logos.length}
              onHover={() => setHoveredIndex(i % logos.length)}
              onHoverEnd={() => setHoveredIndex(null)}
            />
          ))}
        </motion.div>

        {/* Row 2 - scroll right, offset timing */}
        <motion.div
          className="flex gap-4"
          animate={{ x: [-2000, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...logos, ...logos].map(([Icon, name], i) => (
            <LogoPill
              key={i}
              Icon={Icon}
              name={name}
              isHovered={hoveredIndex === logos.length + (i % logos.length)}
              onHover={() => setHoveredIndex(logos.length + (i % logos.length))}
              onHoverEnd={() => setHoveredIndex(null)}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Individual logo pill with grayscale-to-color transition on hover.
 */
function LogoPill({
  Icon,
  name,
  isHovered,
  onHover,
  onHoverEnd,
}: {
  Icon: IconType;
  name: string;
  isHovered: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
}) {
  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className="group flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.015] px-6 py-3.5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div
        animate={{
          filter: isHovered
            ? 'grayscale(0%) brightness(1.2)'
            : 'grayscale(100%) brightness(0.85)',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <Icon className="h-6 w-6 text-zinc-500" aria-hidden />
      </motion.div>
      <motion.span
        animate={{
          color: isHovered ? '#F5F5F7' : '#71717A',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="whitespace-nowrap font-display text-[15px] font-medium tracking-tight"
      >
        {name}
      </motion.span>
    </motion.div>
  );
}
