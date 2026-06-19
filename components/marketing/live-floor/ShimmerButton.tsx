'use client';

import { cn } from '@/lib/utils';

type ShimmerButtonProps = React.ComponentProps<'a'> & {
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
};

export function ShimmerButton({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ShimmerButtonProps) {
  const sizes = {
    md: 'h-12 px-6 text-sm',
    lg: 'h-14 px-10 text-base',
  };

  if (variant === 'ghost') {
    return (
      <a
        className={cn(
          'group inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/[0.12] font-medium text-zinc-300 transition-all duration-200 hover:border-[#8B5CF6]/50 hover:bg-white/[0.03] hover:text-[#F5F5F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[10px] bg-[#8B5CF6] font-medium text-white transition-all duration-200 hover:bg-[#06B6D4] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A]',
        sizes[size],
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  );
}
