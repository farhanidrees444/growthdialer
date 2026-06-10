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

const ICON_ASSETS: Record<
  BrandLogoVariant,
  { src: string; w: number; h: number }
> = {
  mark: { src: '/brand/mark.png', w: 1024, h: 1024 },
  'icon-dark': { src: '/brand/icon-dark.png', w: 150, h: 150 },
  'icon-light': { src: '/brand/icon-light.png', w: 150, h: 150 },
  'icon-purple': { src: '/brand/icon-purple.png', w: 150, h: 150 },
};

/** Icon-only sizes (collapsed rail, favicon slots) */
const ICON_ONLY: Record<BrandLogoSize, string> = {
  xs: 'size-9',
  sm: 'size-10',
  md: 'size-11',
  lg: 'size-12',
  xl: 'size-14',
  nav: 'size-10 sm:size-11',
  sidebar: 'size-11 sm:size-12',
  auth: 'size-12 sm:size-14',
  footer: 'size-11',
};

/** Lockup: framed icon beside wordmark text (Aircall-style) */
const LOCKUP: Record<
  BrandLogoSize,
  { icon: string; gap: string; text: string }
> = {
  xs: { icon: 'size-8', gap: 'gap-2', text: 'text-sm' },
  sm: { icon: 'size-9', gap: 'gap-2', text: 'text-[15px]' },
  md: { icon: 'size-10', gap: 'gap-2.5', text: 'text-base' },
  lg: { icon: 'size-11', gap: 'gap-2.5', text: 'text-lg' },
  xl: { icon: 'size-12', gap: 'gap-3', text: 'text-xl' },
  nav: {
    icon: 'size-10 sm:size-11 md:size-12',
    gap: 'gap-2.5 sm:gap-3',
    text: 'text-[17px] sm:text-[19px] md:text-[21px]',
  },
  sidebar: {
    icon: 'size-9 lg:size-10',
    gap: 'gap-2 lg:gap-2.5',
    text: 'text-[15px] lg:text-[17px]',
  },
  auth: {
    icon: 'size-12 sm:size-14',
    gap: 'gap-3 sm:gap-3.5',
    text: 'text-xl sm:text-2xl',
  },
  footer: {
    icon: 'size-10 sm:size-11',
    gap: 'gap-2.5',
    text: 'text-base sm:text-lg',
  },
};

export interface BrandLogoProps {
  width?: number;
  height?: number;
  size?: BrandLogoSize;
  showText?: boolean;
  variant?: BrandLogoVariant;
  framed?: boolean;
  className?: string;
  priority?: boolean;
  href?: string;
  onClick?: () => void;
}

function BrandIconFrame({
  children,
  className,
  glow = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[12px]',
        'border border-white/[0.10] bg-gradient-to-b from-white/[0.07] to-white/[0.02]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_1px_2px_rgba(0,0,0,0.35)]',
        glow && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_20px_-4px_rgba(139,92,246,0.35)]',
        className,
      )}
    >
      {children}
    </span>
  );
}

function BrandWordmarkText({ size }: { size: BrandLogoSize }) {
  const { text } = LOCKUP[size];
  return (
    <span
      className={cn(
        'font-display font-semibold leading-none tracking-tight whitespace-nowrap',
        text,
      )}
    >
      <span className="text-[#F5F5F7]">Growth</span>
      <span className="bg-gradient-to-r from-[#C4B5FD] via-[#A78BFA] to-[#8B5CF6] bg-clip-text text-transparent">
        Dialer
      </span>
    </span>
  );
}

function BrandIconImage({
  variant,
  className,
  priority,
  framed,
  glow,
  pixelSize,
}: {
  variant: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  framed?: boolean;
  glow?: boolean;
  pixelSize?: number;
}) {
  const asset = ICON_ASSETS[variant];
  const dimensionStyle =
    pixelSize != null ? { width: pixelSize, height: pixelSize } : undefined;

  const img = (
    <Image
      src={asset.src}
      alt=""
      aria-hidden
      width={asset.w}
      height={asset.h}
      priority={priority}
      sizes="(max-width: 640px) 48px, 56px"
      className={cn(
        'block object-contain',
        framed ? 'size-full rounded-[10px]' : className,
        !framed && variant !== 'mark' && 'rounded-[10px]',
        !framed && variant === 'mark' && 'rounded-lg',
        pixelSize != null && !framed && !className && 'size-full',
      )}
      style={!framed ? dimensionStyle : undefined}
    />
  );

  if (framed) {
    return (
      <BrandIconFrame
        className={cn('p-[3px]', className)}
        glow={glow}
        style={dimensionStyle}
      >
        {img}
      </BrandIconFrame>
    );
  }
  return img;
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
  const lockup = LOCKUP[size];
  const iconOnly = ICON_ONLY[size];

  const inner = showText ? (
    <span className={cn('inline-flex min-w-0 items-center', lockup.gap)}>
      <BrandIconImage
        variant={variant}
        className={lockup.icon}
        priority={priority}
        framed
        glow={size === 'nav' || size === 'auth'}
      />
      <BrandWordmarkText size={size} />
    </span>
  ) : (
    <BrandIconImage
      variant={variant}
      className={width == null && height == null ? iconOnly : undefined}
      pixelSize={width ?? height}
      priority={priority}
      framed={framed}
      glow={framed}
    />
  );

  const wrapperClass = cn(
    'group/brand inline-flex shrink-0 items-center',
    'transition-[opacity,transform] duration-200 ease-out',
    'hover:opacity-[0.92] active:scale-[0.99]',
    showText && 'min-w-0',
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
  size = 48,
  variant = 'icon-dark',
  className,
  framed = true,
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
