"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const testimonials = [
  {
    quote:
      "We switched from another dialer and within 30 days our SDR team was booking 40% more meetings. The parallel dialing is a game-changer — our reps spend zero time waiting.",
    name: "Ryan Mitchell",
    role: "Head of Sales",
    company: "Apex Growth Co.",
    companyTag: "Series B · 45 reps",
    initials: "RM",
    bg: "bg-indigo-500",
    stars: 5,
    linkedin: "https://linkedin.com",
    metric: "+40% meetings in 30 days",
    metricColor: "text-brand",
  },
  {
    quote:
      "The AI coaching feature caught objections I didn't even notice myself. It surfaced the right battlecard at exactly the right moment. Closed a $120K deal because of it.",
    name: "Lena Kowalski",
    role: "Senior AE",
    company: "NovaSpark Tech",
    companyTag: "SaaS · 200+ employees",
    initials: "LK",
    bg: "bg-brand",
    stars: 5,
    linkedin: "https://linkedin.com",
    metric: "$120K deal closed",
    metricColor: "text-amber-400",
  },
  {
    quote:
      "GrowthDialer replaced our dialer, our sequencer, and our call recording tool. One platform, less complexity, and our reps actually enjoy using it.",
    name: "Carlos Torres",
    role: "VP Revenue",
    company: "Meridian Cloud",
    companyTag: "Cloud Infra · 150+ employees",
    initials: "CT",
    bg: "bg-purple-500",
    stars: 5,
    linkedin: "https://linkedin.com",
    metric: "3 tools → 1 platform",
    metricColor: "text-indigo-400",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Loved by sales teams everywhere
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Don't take our word for it — hear from the reps closing more deals every day.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="rounded-2xl border border-white/8 bg-[oklch(0.086_0.024_282)] p-7 flex flex-col gap-5 hover:border-white/15 transition-colors group"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <p className="text-foreground/85 text-sm leading-relaxed flex-1">"{t.quote}"</p>

              {/* Key result callout */}
              <div className={`text-xs font-semibold ${t.metricColor} bg-white/4 rounded-lg px-3 py-2 self-start`}>
                {t.metric}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div
                  className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center text-sm font-bold text-[oklch(0.08_0.04_153)] shrink-0`}
                >
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <Link
                      href={t.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground/50 hover:text-[#0A66C2] transition-colors"
                      aria-label={`${t.name} on LinkedIn`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.role} · {t.company}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">{t.companyTag}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
