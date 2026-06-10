'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type BrandLogoVariant = 'mark' | 'icon-dark' | 'icon-light' | 'icon-purple';

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

const WORDMARK = { src: '/brand/wordmark.png', w: 300, h: 75 } as const;
const RATIO = WORDMARK.w / WORDMARK.h;

const ICON_ASSETS: Record<
  BrandLogoVariant,
  { src: string; w: number; h: number }
> = {
  mark: { src: '/brand/mark.png', w: 1024, h: 1024 },
  'icon-dark': { src: '/brand/icon-dark.png', w: 150, h: 150 },
  'icon-light': { src: '/brand/icon-light.png', w: 150, h: 150 },
  'icon-purple': { src: '/brand/icon-purple.png', w: 150, h: 150 },
};

/** Tailwind height classes — aspect ratio locked via w-auto */
const WORDMARK_HEIGHT: Record<BrandLogoSize, string> = {
  xs: 'h-7 sm:h-8',
  sm: 'h-8 sm:h-9',
  md: 'h-9 sm:h-10',
  lg: 'h-10 sm:h-11',
  xl: 'h-11 sm:h-12',
  nav: 'h-8 w-auto sm:h-9 md:h-10',
  sidebar: 'h-9 w-auto sm:h-10 lg:h-[42px]',
  auth: 'h-10 w-auto sm:h-11 md:h-12',
  footer: 'h-9 w-auto sm:h-10',
};

const ICON_SIZE: Record<BrandLogoSize, string> = {
  xs: 'size-8',
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-11',
  xl: 'size-12',
  nav: 'size-9 sm:size-10',
  sidebar: 'size-10 sm:size-11',
  auth: 'size-11 sm:size-12',
  footer: 'size-10',
};

export interface BrandLogoProps {
  width?: number;
  height?: number;
  size?: BrandLogoSize;
  showText?: boolean;
  variant?: BrandLogoVariant;
  /** Premium squircle frame for rail / favicon-style marks */
  framed?: boolean;
  className?: string;
  priority?: boolean;
  href?: string;
  onClick?: () => void;
}

function resolveWordmarkClass(size: BrandLogoSize | undefined): string {
  if (size) return WORDMARK_HEIGHT[size];
  return 'h-9 w-auto sm:h-10';
}

function resolveIconClass(size: BrandLogoSize | undefined): string {
  if (size) return ICON_SIZE[size];
  return 'size-10';
}

function BrandIconFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[11px]',
        'border border-white/[0.09] bg-gradient-to-b from-white/[0.05] to-white/[0.01]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]',
        'ring-1 ring-black/20',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BrandLogo({
  width,
  height,
  size = 'md',
  showText = false,
  variant = 'icon-dark',
  framed = false,
  className,
  priority = false,
  href,
  onClick,
}: BrandLogoProps) {
  const asset = ICON_ASSETS[variant];
  const wordmarkClass = resolveWordmarkClass(size);
  const iconClass = resolveIconClass(size);

  const inner = showText ? (
    <Image
      src={WORDMARK.src}
      alt="GrowthDialer"
      width={WORDMARK.w}
      height={WORDMARK.h}
      priority={priority}
      sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 220px"
      className={cn(
        'block max-w-full object-contain object-left',
        wordmarkClass,
        width == null && height == null ? 'w-auto' : '',
      )}
      style={
        width != null || height != null
          ? {
              width: width ?? (height != null ? Math.round(height * RATIO) : undefined),
              height: height ?? (width != null ? Math.round(width / RATIO) : undefined),
              maxWidth: '100%',
            }
          : undefined
      }
    />
  ) : (
    (() => {
      const img = (
        <Image
          src={asset.src}
          alt="GrowthDialer"
          width={asset.w}
          height={asset.h}
          priority={priority}
          sizes="(max-width: 640px) 44px, 52px"
          className={cn(
            'block object-contain',
            !framed && iconClass,
            variant === 'mark' && !framed && 'rounded-lg',
            variant !== 'mark' && !framed && 'rounded-[10px]',
            framed && 'size-full rounded-[9px]',
          )}
          style={
            !framed && (width != null || height != null)
              ? {
                  width: width ?? height,
                  height: height ?? width,
                  maxWidth: '100%',
                }
              : undefined
          }
        />
      );
      if (framed) {
        return (
          <BrandIconFrame className={cn('p-[3px]', iconClass)}>
            {img}
          </BrandIconFrame>
        );
      }
      return img;
    })()
  );

  const wrapperClass = cn(
    'inline-flex shrink-0 items-center transition-opacity hover:opacity-95',
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

export function BrandLogoMark({
  size = 44,
  variant = 'mark',
  className,
  framed,
  priority,
}: {
  size?: number;
  variant?: BrandLogoVariant;
  className?: string;
  framed?: boolean;
  priority?: boolean;
}) {
  return (
    <BrandLogo
      width={size}
      height={size}
      variant={variant}
      framed={framed}
      className={className}
      priority={priority}
    />
  );
}
