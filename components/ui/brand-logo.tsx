'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BrandIconDarkSvg, BrandMarkSvg, BrandWordmarkSvg } from '@/components/ui/brand-svg';

/** Icon variants — all 1:1 */
export type BrandLogoVariant = 'mark' | 'icon-dark' | 'icon-light' | 'icon-purple';

/** Responsive size presets — tuned for clarity on retina displays */
export type BrandLogoSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'nav'
  | 'sidebar'
  | 'auth'
  | 'footer';

const SIZE_PRESETS: Record<
  BrandLogoSize,
  { icon: number; wordmarkH: number }
> = {
  xs: { icon: 32, wordmarkH: 28 },
  sm: { icon: 36, wordmarkH: 32 },
  md: { icon: 44, wordmarkH: 36 },
  lg: { icon: 52, wordmarkH: 40 },
  xl: { icon: 60, wordmarkH: 48 },
  nav: { icon: 40, wordmarkH: 36 },
  sidebar: { icon: 48, wordmarkH: 42 },
  auth: { icon: 52, wordmarkH: 44 },
  footer: { icon: 44, wordmarkH: 38 },
};

export interface BrandLogoProps {
  /** Explicit width in px (overrides `size` when set with height). */
  width?: number;
  /** Explicit height in px (overrides `size`). */
  height?: number;
  /** Preset sizing — responsive-friendly defaults per surface. */
  size?: BrandLogoSize;
  /** When true, renders the horizontal wordmark lockup. */
  showText?: boolean;
  /** Icon variant when `showText` is false. */
  variant?: BrandLogoVariant;
  className?: string;
  /** Preload hint for above-the-fold placements (nav, auth). */
  priority?: boolean;
  /** Wraps the logo in a Next.js Link when set. */
  href?: string;
  /** Fires when the logo link is clicked (e.g. close mobile nav). */
  onClick?: () => void;
}

function resolveIconSize(
  size: BrandLogoSize | undefined,
  width: number | undefined,
  height: number | undefined,
  showText: boolean,
): number {
  if (width != null && height != null && !showText) return Math.min(width, height);
  if (height != null && !showText) return height;
  if (width != null && !showText) return width;
  if (size) return SIZE_PRESETS[size].icon;
  return 40;
}

function resolveWordmarkHeight(
  size: BrandLogoSize | undefined,
  width: number | undefined,
  height: number | undefined,
): number {
  if (height != null) return height;
  if (width != null) return Math.round(width / (300 / 75));
  if (size) return SIZE_PRESETS[size].wordmarkH;
  return 36;
}

function IconGraphic({
  variant,
  iconSize,
}: {
  variant: BrandLogoVariant;
  iconSize: number;
}) {
  switch (variant) {
    case 'mark':
      return <BrandMarkSvg size={iconSize} />;
    case 'icon-dark':
      return <BrandIconDarkSvg size={iconSize} />;
    case 'icon-light':
    case 'icon-purple':
      // Light/purple PNG variants kept for press kit; UI uses vector marks
      return <BrandMarkSvg size={iconSize} />;
    default:
      return <BrandMarkSvg size={iconSize} />;
  }
}

export function BrandLogo({
  width,
  height,
  size,
  showText = false,
  variant = 'mark',
  className,
  priority: _priority,
  href,
  onClick,
}: BrandLogoProps) {
  const wordmarkH = resolveWordmarkHeight(size, width, height);
  const iconSize = resolveIconSize(size, width, height, showText);

  const inner = showText ? (
    <BrandWordmarkSvg
      height={wordmarkH}
      className={cn(
        'h-auto w-auto max-w-full',
        size === 'sidebar' && 'min-h-[38px] sm:min-h-[42px]',
        size === 'nav' && 'min-h-[34px] sm:min-h-[36px]',
        size === 'auth' && 'min-h-[40px] sm:min-h-[44px]',
        size === 'footer' && 'min-h-[36px] sm:min-h-[38px]',
      )}
    />
  ) : (
    <IconGraphic variant={variant} iconSize={iconSize} />
  );

  const wrapperClass = cn(
    'inline-flex shrink-0 items-center',
    showText && 'min-w-0 max-w-full',
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={wrapperClass}
        aria-label="GrowthDialer home"
      >
        {inner}
      </Link>
    );
  }

  return <span className={wrapperClass}>{inner}</span>;
}

/** Square mark only — compare pages, avatars, compact slots. */
export function BrandLogoMark({
  size = 40,
  variant = 'mark',
  className,
}: {
  size?: number;
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}) {
  return (
    <BrandLogo
      width={size}
      height={size}
      variant={variant}
      className={className}
    />
  );
}
