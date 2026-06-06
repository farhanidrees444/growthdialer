'use client';

import { useRef } from 'react';
import { motion, useInView, type HTMLMotionProps, type Variants } from 'framer-motion';
import { EASE_OUT, MARKETING_IN_VIEW } from './motion';

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
  y?: number;
};

export function Reveal({ children, delay = 0, y = 24, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, MARKETING_IN_VIEW);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerReveal({
  children,
  className,
  variants,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, MARKETING_IN_VIEW);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={
        variants ?? {
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }
      }
    >
      {children}
    </motion.div>
  );
}

/** Stagger container driven by useInView — use instead of whileInView + revealContainer. */
export function InViewReveal({
  children,
  className,
  variants,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, MARKETING_IN_VIEW);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};
