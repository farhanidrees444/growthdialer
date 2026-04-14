"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 150, suffix: "+", label: "Avg. daily calls per rep", prefix: "" },
  { value: 22, suffix: "%", label: "Average connect rate", prefix: "" },
  { value: 3, suffix: "×", label: "More meetings booked", prefix: "" },
  { value: 2400, suffix: "+", label: "Sales teams trust us", prefix: "" },
];

function Counter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(target);
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || animated) return;
    setAnimated(true);
    setCount(0);
    const duration = 1800;
    const start = performance.now();
    const update = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = target % 1 !== 0
        ? Math.round(ease * target * 10) / 10
        : Math.round(ease * target);
      setCount(next);
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [inView, target, animated]);

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
