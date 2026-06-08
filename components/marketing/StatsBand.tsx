"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

import { MARKETING_STATS } from '@/lib/marketing/honest-copy';

const stats = MARKETING_STATS.map((s) => ({
  value: s.to,
  suffix: s.suffix,
  label: s.label,
  prefix: s.prefix,
}));

function Counter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(target);
  const animatedRef = useRef(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || animatedRef.current) return;
    animatedRef.current = true;

    const duration = 1800;
    const start = performance.now();
    setCount(0);

    const update = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = target % 1 !== 0
        ? Math.round(ease * target * 10) / 10
        : Math.round(ease * target);
      setCount(next);
      if (t < 1) requestAnimationFrame(update);
      else setCount(target);
    };
    requestAnimationFrame(update);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsBand() {
  return (
    <section className="py-16 border-y border-white/8 bg-gradient-to-r from-brand/5 via-transparent to-brand/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="text-center lg:px-8"
            >
              <div className="font-display text-4xl lg:text-5xl font-bold text-brand mb-2">
                <Counter target={s.value} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
