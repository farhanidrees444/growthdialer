import { cn } from '@/lib/utils';

/**
 * Framed figure for SVG product visuals with an honest caption.
 * Captions describe the feature — never claim to be a screenshot.
 */
export function VisualFigure({
  children,
  caption,
  dark = false,
  className,
}: {
  children: React.ReactNode;
  caption?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn('not-prose min-w-0', className)}>
      <div
        className={cn(
          'overflow-hidden rounded-2xl border',
          dark
            ? 'border-white/10 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8)]'
            : 'border-zinc-950/10 shadow-[0_32px_80px_-24px_rgba(9,9,11,0.45)]'
        )}
      >
        {children}
      </div>
      {caption && (
        <figcaption className={cn('pm-caption', dark && '!text-zinc-500')}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
