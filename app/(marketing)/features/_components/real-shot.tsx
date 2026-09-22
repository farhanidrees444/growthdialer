import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The only privacy-safe product screenshots allowed on marketing pages.
 * These are real, cropped captures of the actual GrowthDialer app —
 * never use the original PNGs (they contain the owner's name).
 */
export const SHOTS = {
  dialerMain: { src: '/images/product/dialer-main.webp', width: 1600, height: 828 },
  dialerBanner: { src: '/images/product/dialer-banner.webp', width: 1600, height: 566 },
  dashboardMain: { src: '/images/product/dashboard-main.webp', width: 1600, height: 578 },
  dashboardBanner: { src: '/images/product/dashboard-banner.webp', width: 1600, height: 441 },
} as const;

type RealShotProps = {
  shot: keyof typeof SHOTS;
  alt: string;
  /** Context shown after the fixed "Actual GrowthDialer product UI." prefix. */
  caption: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** A real product screenshot in a clean frame — never a mockup. */
export function RealShot({ shot, alt, caption, className, sizes, priority }: RealShotProps) {
  const { src, width, height } = SHOTS[shot];
  return (
    <figure className={cn('min-w-0', className)}>
      <div className="overflow-hidden rounded-2xl border border-zinc-950/10 bg-zinc-950 shadow-[0_32px_80px_-24px_rgba(9,9,11,0.45)]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes ?? '(max-width: 1024px) 100vw, 900px'}
          className="h-auto w-full"
          priority={priority}
        />
      </div>
      <figcaption className="pm-caption">
        Actual GrowthDialer product UI. {caption}
      </figcaption>
    </figure>
  );
}
