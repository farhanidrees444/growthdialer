import Image from 'next/image';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type CompetitorLogoProps = {
  domain: string;
  name: string;
  size?: number;
  className?: string;
};

function LogoPlaceholder({ name, size }: { name: string; size: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-900/60 font-semibold text-zinc-400"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

/** Auto-fetched competitor logo via logo.dev, with text fallback when no token. */
export function CompetitorLogo({ domain, name, size = 48, className }: CompetitorLogoProps) {
  const token =
    process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ?? process.env.LOGO_DEV_TOKEN ?? '';

  if (!token) {
    return (
      <div className={className} title={name}>
        <LogoPlaceholder name={name} size={size} />
      </div>
    );
  }

  const src = `https://img.logo.dev/${domain}?token=${token}&size=${size * 2}&format=png`;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/40',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="h-full w-full object-contain p-1.5"
        loading="lazy"
      />
    </div>
  );
}

export function GrowthDialerLogoMark({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-400',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Zap className="h-5 w-5" fill="currentColor" style={{ width: size * 0.42, height: size * 0.42 }} />
    </div>
  );
}
