'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface GsapScrollRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scroll-triggered staggered reveals for descendants marked with data-gsap-reveal.
 * Respects prefers-reduced-motion via gsap.matchMedia().
 */
export function GsapScrollReveal({ children, className }: GsapScrollRevealProps) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const reduceMotion = Boolean(context.conditions?.reduceMotion);

          if (reduceMotion) {
            gsap.set('[data-gsap-reveal]', { autoAlpha: 1, y: 0 });
            return;
          }

          gsap.set('[data-gsap-reveal]', { autoAlpha: 0, y: 20 });

          // The scroll container is this component's own element (a nested
          // overflow-y-auto div), not the window — ScrollTrigger must be told
          // or reveals never fire on desktop/mobile scroll. (The installed
          // gsap types omit `scroller` on batch vars; the runtime supports it.)
          const batchVars = {
            interval: 0.08,
            batchMax: 8,
            start: 'top 88%',
            once: true,
            scroller: scopeRef.current,
            onEnter: (elements: Element[]) => {
              gsap.to(elements, {
                autoAlpha: 1,
                y: 0,
                duration: 0.55,
                ease: 'power2.out',
                stagger: 0.07,
                overwrite: true,
              });
            },
          } as Parameters<typeof ScrollTrigger.batch>[1] & { scroller: Element | null };
          ScrollTrigger.batch('[data-gsap-reveal]', batchVars);

          ScrollTrigger.refresh();
        },
      );

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [] },
  );

  return (
    <div ref={scopeRef} className={className}>
      {children}
    </div>
  );
}

/** Call after async layout/data changes so scroll reveals recalculate positions. */
export function refreshGsapScrollTriggers() {
  ScrollTrigger.refresh();
}
