'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Gradient ribbon GD mark — vector, sharp at any size */
export function BrandMarkSvg({
  size = 40,
  className,
  title = 'GrowthDialer',
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  const gradId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="0.45" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      {/* Ribbon G */}
      <path
        fill={`url(#${gradId})`}
        d="M8 24c0-8.837 7.163-16 16-16 2.8 0 5.4.72 7.7 1.98l-2.4 4.1A11.8 11.8 0 0 0 24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12c2.6 0 5-.78 7-2.12l2.4 4.14A15.9 15.9 0 0 1 24 40C15.163 40 8 32.837 8 24Zm8-6.5h6v5h-6a3.5 3.5 0 1 0 0 7h4v5h-4c-5.523 0-10-4.477-10-10s4.477-10 10-10Z"
      />
      {/* Ribbon D */}
      <path
        fill={`url(#${gradId})`}
        d="M30 8h10c6.627 0 12 5.373 12 12s-5.373 12-12 12H30V8Zm6 5v14h4a7 7 0 1 0 0-14h-4Z"
      />
    </svg>
  );
}

/** Dark squircle app icon with GD letterforms */
export function BrandIconDarkSvg({
  size = 40,
  className,
  title = 'GrowthDialer',
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  const gradId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="12" y1="14" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C4B5FD" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="#0B0B0F" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="rgba(255,255,255,0.06)" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fill={`url(#${gradId})`}
        fontSize="17"
        fontWeight="700"
        fontFamily="var(--font-bricolage), var(--font-dm-sans), system-ui, sans-serif"
        letterSpacing="-0.04em"
      >
        GD
      </text>
    </svg>
  );
}

/** Full horizontal lockup — mark + wordmark text (vector) */
export function BrandWordmarkSvg({
  height = 36,
  className,
  title = 'GrowthDialer',
}: {
  height?: number;
  className?: string;
  title?: string;
}) {
  const width = Math.round(height * (300 / 75));
  const gradId = useId();
  const textGradId = `${gradId}-text`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block max-w-none object-contain object-left', className)}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMinYMid meet"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="8" y1="38" x2="68" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={textGradId} x1="82" y1="20" x2="290" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DDD6FE" />
          <stop offset="0.35" stopColor="#C4B5FD" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Geometric mark (scaled to wordmark icon slot) */}
      <g transform="translate(4, 8) scale(1.15)">
        <path
          fill={`url(#${gradId})`}
          d="M6 22c0-7.5 6.1-13.6 13.6-13.6 2.4 0 4.6.62 6.5 1.7l-2 3.5A10.2 10.2 0 0 0 19.6 12c-5.6 0-10.2 4.6-10.2 10.2S14 32.4 19.6 32.4c2.2 0 4.2-.66 5.9-1.8l2 3.45A14.8 14.8 0 0 1 19.6 38C12.1 38 6 31.9 6 24.4V22Zm6.8-5.5h5.2v4.2h-5.2a3 3 0 1 0 0 6h3.4v4.2h-3.4c-4.8 0-8.6-3.8-8.6-8.6s3.8-8.6 8.6-8.6Z"
        />
        <path
          fill={`url(#${gradId})`}
          d="M26 6.4h8.6c5.6 0 10.2 4.6 10.2 10.2S40.2 26.8 34.6 26.8H26V6.4Zm5.2 4.2v12.2h3.4a6 6 0 1 0 0-12.2h-3.4Z"
        />
        <path
          fill={`url(#${gradId})`}
          d="m22.2 4.2 3.2-2.2 4.8 4.2-3.2 2.2-4.8-4.2Z"
          opacity="0.9"
        />
      </g>
      <text
        x="82"
        y="50"
        fill={`url(#${textGradId})`}
        fontSize="30"
        fontWeight="600"
        fontFamily="var(--font-bricolage), var(--font-dm-sans), system-ui, sans-serif"
        letterSpacing="-0.03em"
      >
        GrowthDialer
      </text>
    </svg>
  );
}
