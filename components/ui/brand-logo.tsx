import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Intrinsic dimensions of `public/brand/wordmark.png` */
const WORDMARK_NATIVE_W = 300;
const WORDMARK_NATIVE_H = 75;

/** Icon variants — all 1:1 */
export type BrandLogoVariant = 'mark' | 'icon-dark' | 'icon-light' | 'icon-purple';

const ICON_SRC: Record<BrandLogoVariant, string> = {
  mark: '/brand/mark.png',
  'icon-dark': '/brand/icon-dark.png',
  'icon-light': '/brand/icon-light.png',
  'icon-purple': '/brand/icon-purple.png',
};

const ICON_NATIVE: Record<BrandLogoVariant, number> = {
  mark: 1024,
  'icon-dark': 150,
  'icon-light': 150,
  'icon-purple': 150,
};

export interface BrandLogoProps {
  /** Render width in px. */
  width?: number;
  /** Render height in px. Aspect ratio is always preserved. */
  height?: number;
  /** When true, renders the horizontal wordmark lockup. */
  showText?: boolean;
  /** Icon variant when `showText` is false. */
  variant?: BrandLogoVariant;
  className?: string;
  /** Preload for above-the-fold placements (nav, auth). */
  priority?: boolean;
  /** Wraps the logo in a Next.js Link when set. */
  href?: string;
  /** Fires when the logo link is clicked (e.g. close mobile nav). */
  onClick?: () => void;
}

function resolveIconSize(width?: number, height?: number): number {
  if (width != null && height != null) return Math.min(width, height);
  return width ?? height ?? 32;
}

function resolveWordmarkSize(
  width?: number,
  height?: number,
): { w: number; h: number } {
  if (width != null && height != null) return { w: width, h: height };
  if (height != null) {
    return {
      w: Math.round(height * (WORDMARK_NATIVE_W / WORDMARK_NATIVE_H)),
      h: height,
    };
  }
  const w = width ?? 140;
  return { w, h: Math.round(w / (WORDMARK_NATIVE_W / WORDMARK_NATIVE_H)) };
}

export function BrandLogo({
  width,
  height,
  showText = false,
  variant = 'icon-dark',
  className,
  priority = false,
  href,
  onClick,
}: BrandLogoProps) {
  const inner = showText ? (
    (() => {
      const { w, h } = resolveWordmarkSize(width, height);
      return (
        <Image
          src="/brand/wordmark.png"
          alt="GrowthDialer"
          width={WORDMARK_NATIVE_W}
          height={WORDMARK_NATIVE_H}
          sizes={`${w}px`}
          priority={priority}
          className="block max-w-none object-contain object-left"
          style={{
            width: w,
            height: h,
            aspectRatio: `${WORDMARK_NATIVE_W} / ${WORDMARK_NATIVE_H}`,
          }}
        />
      );
    })()
  ) : (
    (() => {
      const size = resolveIconSize(width, height);
      const native = ICON_NATIVE[variant];
      return (
        <Image
          src={ICON_SRC[variant]}
          alt="GrowthDialer"
          width={native}
          height={native}
          sizes={`${size}px`}
          priority={priority}
          className="block max-w-none object-contain"
          style={{ width: size, height: size, aspectRatio: '1 / 1' }}
        />
      );
    })()
  );

  const wrapperClass = cn('inline-flex shrink-0 items-center', className);

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
  size = 32,
  variant = 'icon-dark',
  className,
  priority,
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
      priority={priority}
    />
  );
}
