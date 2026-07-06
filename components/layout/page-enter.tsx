'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface PageEnterProps {
  children: ReactNode;
  className?: string;
}

/** Subtle route enter — premium feel without heavy page transitions */
export function PageEnter({ children, className }: PageEnterProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
