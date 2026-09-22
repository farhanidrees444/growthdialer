'use client';

/**
 * 3D hero scene — the dialer console in browser chrome, rendered with real
 * CSS 3D perspective: mouse-parallax tilt (rAF-throttled) plus floating
 * glass stat cards at different translateZ depths, a typewriter AI brief,
 * and an animated waveform. Flat + static under reduced motion / touch.
 */
import { useEffect, useRef } from 'react';
import { Mic, Sparkles, TrendingUp, Voicemail } from 'lucide-react';
import { BrowserFrame, DialerConsole, LiveBadge, Waveform } from './Mockups';
import { TypingLines, useIsCoarsePointer, usePrefersReducedMotion } from './motion';
import { cn } from '@/lib/utils';

/* Lines reuse the exact AI-brief copy shown in the console mockup. */
const BRIEF_LINES = [
  'Buying signal: replacing spreadsheet call tracking.',
  'Asked for team pricing and onboarding timeline.',
  'Next step: send 12-seat annual proposal.',
];

/** translateZ depth per floating card (px) — parallax scales with depth */
const CARD_DEPTH = [110, 70, 50] as const;

export function HeroConsole3D({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const interactive = !reduced && !coarse;

  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const resetCards = () => {
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      card.style.transform = interactive ? `translate3d(0px, 0px, ${CARD_DEPTH[i] ?? 60}px)` : '';
    });
  };

  const onMove = (e: React.MouseEvent) => {
    if (!interactive) return;
    const stage = stageRef.current;
    const tilt = tiltRef.current;
    if (!stage || !tilt) return;
    const r = stage.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      tilt.style.transform = `rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 13).toFixed(2)}deg)`;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const depth = CARD_DEPTH[i] ?? 60;
        card.style.transform = `translate3d(${(px * depth * 0.4).toFixed(1)}px, ${(py * depth * 0.4).toFixed(1)}px, ${depth}px)`;
      });
    });
  };

  const onLeave = () => {
    if (!interactive) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      if (tiltRef.current) tiltRef.current.style.transform = '';
      resetCards();
    });
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[i] = el;
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('mx-hero-stage relative', !interactive && 'mx-static', className)}
    >
      <div aria-hidden className="mx-hero-glow" />

      <div className="mx-breathe relative">
        <div ref={tiltRef} className="mx-tilt-inner relative">
          <BrowserFrame badge={<LiveBadge />}>
            <DialerConsole />
          </BrowserFrame>

          {/* floating glass cards — hidden on small screens to avoid clutter */}
          <div
            ref={setCardRef(0)}
            className="mx-float-card mx-fc-brief hidden md:block"
            aria-hidden={false}
          >
            <p className="mx-fc-label flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#6d28d9]" /> AI brief · live
            </p>
            <div className="mt-2.5">
              <TypingLines lines={BRIEF_LINES} charMs={30} />
            </div>
          </div>

          <div ref={setCardRef(1)} className="mx-float-card mx-fc-stat hidden md:block">
            <p className="mx-fc-label flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Connect rate
            </p>
            <p className="mt-1.5 font-display text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-zinc-950">
              31%
            </p>
            <Waveform bars={22} color="#10b981" className="mt-2 h-7" />
          </div>

          <div ref={setCardRef(2)} className="mx-float-card mx-fc-amd hidden items-center gap-3 lg:flex">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
              <Voicemail className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-semibold text-zinc-900">Voicemail dropped</p>
              <p className="flex items-center gap-1 text-[11.5px] text-zinc-500">
                <Mic className="h-3 w-3" /> Answering machine detected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
