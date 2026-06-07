'use client';

import { useState } from 'react';
import { Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationLogoProps {
  name: string;
  logoDomain?: string;
  brandColor: string;
  className?: string;
  size?: 'sm' | 'md';
}

function BrandFallback({
  name,
  brandColor,
  className,
  size,
}: {
  name: string;
  brandColor: string;
  className?: string;
  size: 'sm' | 'md';
}) {
  const initial = name.charAt(0).toUpperCase();
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md font-semibold text-white',
        dim,
        className,
      )}
      style={{ backgroundColor: brandColor }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function IntegrationLogo({
  name,
  logoDomain,
  brandColor,
  className,
  size = 'md',
}: IntegrationLogoProps) {
  const [failed, setFailed] = useState(false);
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  if (!logoDomain) {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/80',
          dim,
          className,
        )}
      >
        <Webhook className="h-4 w-4 text-zinc-500" aria-hidden />
      </span>
    );
  }

  if (failed) {
    return (
      <BrandFallback name={name} brandColor={brandColor} className={className} size={size} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logo.clearbit.com/${logoDomain}`}
      alt=""
      width={size === 'sm' ? 32 : 36}
      height={size === 'sm' ? 32 : 36}
      className={cn('shrink-0 rounded-md object-contain', dim, className)}
      onError={() => setFailed(true)}
    />
  );
}
