'use client';

/**
 * Shared motion primitives for the marketing site.
 *
 * Rules honored here:
 * - transform/opacity-only animations (no layout thrash)
 * - rAF-throttled pointer/scroll handlers
 * - every primitive no-ops or renders statically under
 *   prefers-reduced-motion
 * No new dependencies — framer-motion only (already installed).
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ── reduced motion + coarse pointer hooks ────────────── */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setCoarse(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return coarse;
}

/* ── animated gradient-mesh background ────────────────── */
export function Aurora({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div aria-hidden className={cn('mx-aurora', dark && 'mx-aurora-dark', className)}>
      <span className="mx-blob mx-blob-a" />
      <span className="mx-blob mx-blob-b" />
      <span className="mx-blob mx-blob-c" />
    </div>
  );
}

/* ── subtle film-grain noise overlay ──────────────────── */
export function Noise({ className, opacity }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={cn('mx-noise', className)}
      style={opacity !== undefined ? ({ '--mx-noise-o': opacity } as CSSProperties) : undefined}
    />
  );
}

/* ── scroll progress bar (fixed, top) ─────────────────── */
export function ScrollProgress({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.35 });
  if (reduced) return null;
  return <motion.div aria-hidden className={cn('mx-scroll-progress', className)} style={{ scaleX }} />;
}

/* ── seamless marquee strip ───────────────────────────── */
export function Marquee({
  items,
  className,
  duration = 34,
  label,
}: {
  items: string[];
  className?: string;
  duration?: number;
  label?: string;
}) {
  return (
    <div className={cn('mx-marquee', className)} role="list" aria-label={label}>
      <div className="mx-marquee-track" style={{ animationDuration: `${duration}s` }}>
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="mx-marquee-chunk">
            {items.map((item) => (
              <span key={`${copy}-${item}`} role="listitem" className="mx-marquee-item">
                <span className="mx-marquee-dot" aria-hidden />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── animated counter (IntersectionObserver-gated) ────── */
export function Counter({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1500,
  className,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      setVal(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(to * eased);
          if (p < 1) raf = requestAnimationFrame(step);
          else setVal(to);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration, reduced]);

  return (
    <span ref={ref} className={cn('mx-counter', className)}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ── magnetic hover wrapper (buttons, CTAs) ───────────── */
export function Magnetic({
  children,
  strength = 16,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (reduced || coarse) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `translate3d(${((x / r.width) * strength).toFixed(1)}px, ${((y / r.height) * strength).toFixed(1)}px, 0)`;
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn('mx-magnetic', className)}>
      {children}
    </div>
  );
}

/* ── typewriter lines (loops; static under reduced motion) */
export function TypingLines({
  lines,
  className,
  charMs = 26,
  linePause = 700,
  loopPause = 3400,
}: {
  lines: string[];
  className?: string;
  charMs?: number;
  linePause?: number;
  loopPause?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!started || reduced) return;
    const line = lines[lineIdx] ?? '';
    if (chars < line.length) {
      const t = setTimeout(() => setChars((c) => c + 1), charMs);
      return () => clearTimeout(t);
    }
    const last = lineIdx === lines.length - 1;
    const t = setTimeout(
      () => {
        if (last) {
          setLineIdx(0);
          setChars(0);
        } else {
          setLineIdx(lineIdx + 1);
          setChars(0);
        }
      },
      last ? loopPause : linePause
    );
    return () => clearTimeout(t);
  }, [started, reduced, lineIdx, chars, lines, charMs, linePause, loopPause]);

  if (reduced) {
    return (
      <div ref={ref} className={cn('mx-typing', className)}>
        {lines.map((l) => (
          <p key={l} className="mx-typing-line">
            {l}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('mx-typing', className)} aria-live="off">
      {lines.slice(0, lineIdx).map((l) => (
        <p key={l} className="mx-typing-line">
          {l}
        </p>
      ))}
      {started && lineIdx < lines.length && (
        <p className="mx-typing-line">
          {(lines[lineIdx] ?? '').slice(0, chars)}
          <span className="mx-caret" aria-hidden />
        </p>
      )}
    </div>
  );
}

/* ── scroll parallax layer (different speeds per layer) ─ */
export function Parallax({
  children,
  speed = 0.1,
  className,
}: {
  children: ReactNode;
  /** fraction of scroll delta applied as counter-translation */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    const render = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const delta = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-delta * speed).toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (!visible || raf) return;
      raf = requestAnimationFrame(render);
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) schedule();
      },
      { rootMargin: '20% 0px 20% 0px' }
    );
    io.observe(el);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, speed]);

  return (
    <div ref={ref} className={cn('mx-parallax', className)}>
      {children}
    </div>
  );
}

/* ── cursor-tracking glow card ────────────────────────── */
export function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();

  const onMove = (e: React.MouseEvent) => {
    if (reduced || coarse) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx-gx', `${(e.clientX - r.left).toFixed(0)}px`);
    el.style.setProperty('--mx-gy', `${(e.clientY - r.top).toFixed(0)}px`);
  };

  return (
    <div ref={ref} onMouseMove={onMove} className={cn('mx-glow-card', className)}>
      {children}
    </div>
  );
}

/* ── gradient-border wrapper ──────────────────────────── */
export function GradientBorder({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-gradient-border', className)}>{children}</div>;
}

/* ── rAF-throttled 3D tilt (mouse parallax) ───────────── */
export function Tilt3D({
  children,
  className,
  maxX = 9,
  maxY = 13,
}: {
  children: ReactNode;
  className?: string;
  maxX?: number;
  maxY?: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const interactive = !reduced && !coarse;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onMove = (e: React.MouseEvent) => {
    if (!interactive) return;
    const stage = stageRef.current;
    const inner = innerRef.current;
    if (!stage || !inner) return;
    const r = stage.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      inner.style.transform = `rotateX(${(-py * maxX).toFixed(2)}deg) rotateY(${(px * maxY).toFixed(2)}deg)`;
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    if (innerRef.current) innerRef.current.style.transform = '';
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('mx-tilt-stage', !interactive && 'mx-static', className)}
    >
      <div ref={innerRef} className="mx-tilt-inner">
        {children}
      </div>
    </div>
  );
}

/* ── shared loop driver ───────────────────────────────────
   Steps 0..length-1 on a fixed interval. Pauses when off-screen
   (IntersectionObserver), skips ticks in hidden tabs, and freezes
   under prefers-reduced-motion (callers render a calm static state). */
export function useCycle(length: number, ms: number) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced || length < 2) return;
    let iv: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && iv === undefined) {
          iv = window.setInterval(() => {
            if (!document.hidden) setStep((s) => (s + 1) % length);
          }, ms);
        } else if (!entry.isIntersecting && iv !== undefined) {
          window.clearInterval(iv);
          iv = undefined;
        }
      },
      { threshold: 0.12 }
    );
    const el = ref.current;
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      if (iv !== undefined) window.clearInterval(iv);
    };
  }, [reduced, length, ms]);
  return { step, ref, reduced };
}
